import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { ANCHORS, AVATAR_SCALE } from './layout'

const MODEL = `${import.meta.env.BASE_URL}models/avatar.glb`
const HEAD_FOLLOW = 0.3 // how much of the way the head turns toward the look target
const EYE_FOLLOW = 1 // eyes go all the way
const LOOK_RANGE = new THREE.Vector2(1.6, 1.0) // how far (m) the cursor moves the look target around the camera
const SMILE = 0.25
// Arms crossed over the chest. Positions are world-space (avatar stands at the origin facing +Z).
// The left forearm sits on top; the right hand tucks under the left upper arm.
const CROSS = {
  Left: {
    wrist: new THREE.Vector3(-0.15, 1.86, 0.3),
    fingers: new THREE.Vector3(-0.55, -0.1, -1), // fingers wrap around the right upper arm
    palm: new THREE.Vector3(1, -0.2, -0.3),
    pole: new THREE.Vector3(1, -0.7, -0.35), // elbow out and down
  },
  Right: {
    wrist: new THREE.Vector3(0.15, 1.8, 0.24),
    fingers: new THREE.Vector3(0.55, 0.05, -1), // tucked under the left arm
    palm: new THREE.Vector3(-1, 0.2, -0.3),
    pole: new THREE.Vector3(-1, -0.7, -0.35),
  },
  curl: [0.45, 0.6, 0.45],
  thumb: [0.5, 0.6, 0.4],
}
const BREATH = 0.012 // how much the crossed arms rise and fall

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const FORWARD = new THREE.Vector3(0, 0, 1)

/** Rotate `bone` (in world space) so the direction bone→`from` swings onto bone→`to` */
function swing(bone: THREE.Bone, from: THREE.Vector3, to: THREE.Vector3, amount = 1) {
  const origin = bone.getWorldPosition(v1)
  const a = v2.subVectors(from, origin).normalize()
  const b = v3.subVectors(to, origin).normalize()
  const delta = q1.setFromUnitVectors(a, b)
  if (amount < 1) delta.slerp(q2.identity(), 1 - amount)
  bone.getWorldQuaternion(q2)
  const world = delta.multiply(q2)
  bone.parent!.getWorldQuaternion(q2)
  bone.quaternion.copy(q2.invert().multiply(world))
  bone.updateMatrixWorld(true)
}

const smoothstep = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c) }

type Arm = {
  upper: THREE.Bone; lower: THREE.Bone; hand: THREE.Bone; side: number; l1: number; l2: number
  /** Wrist → middle knuckle distance */
  knuckle: number
  /** Rest-pose world rotation of the hand + where its fingers point at rest */
  handRest: THREE.Quaternion; fingersRest: THREE.Vector3
  fingers: THREE.Bone[][]; thumb: THREE.Bone[]
}

/** Rotation taking the orthonormal frame (a1, b1) onto (a2, b2) */
function frameDelta(a1: THREE.Vector3, b1: THREE.Vector3, a2: THREE.Vector3, b2: THREE.Vector3) {
  const basis = (a: THREE.Vector3, b: THREE.Vector3) => {
    const x = a.clone().normalize()
    const y = b.clone().sub(x.clone().multiplyScalar(b.dot(x))).normalize()
    return new THREE.Matrix4().makeBasis(x, y, x.clone().cross(y))
  }
  const m = basis(a2, b2).multiply(basis(a1, b1).transpose())
  return new THREE.Quaternion().setFromRotationMatrix(m)
}

/** Apply an extra world-space rotation to a bone */
function rotateWorld(bone: THREE.Bone, delta: THREE.Quaternion) {
  const world = delta.clone().multiply(bone.getWorldQuaternion(new THREE.Quaternion()))
  const parent = bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert()
  bone.quaternion.copy(parent.multiply(world))
  bone.updateMatrixWorld(true)
}

export function Character() {
  const { scene } = useGLTF(MODEL)
  const camera = useThree((s) => s.camera)
  const aim = useRef(new THREE.Vector2())
  const blink = useRef({ next: 2, t: -1 })
  const glance = useRef(0)
  const lastIcon = useRef(new THREE.Vector3())

  const rig = useMemo(() => {
    scene.scale.setScalar(AVATAR_SCALE)
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.frustumCulled = false // skinned meshes can pop out of view otherwise
      }
    })
    scene.updateMatrixWorld(true)
    const bone = (n: string) => scene.getObjectByName(n) as THREE.Bone
    const rest = new Map<THREE.Bone, THREE.Quaternion>()
    const keep = (b: THREE.Bone) => (rest.set(b, b.quaternion.clone()), b)

    const pos = (b: THREE.Bone) => b.getWorldPosition(new THREE.Vector3())
    const arm = (side: 'Left' | 'Right'): Arm => {
      const upper = keep(bone(`${side}Arm`)), lower = keep(bone(`${side}ForeArm`)), hand = keep(bone(`${side}Hand`))
      const middle = bone(`${side}HandMiddle1`)
      return {
        upper, lower, hand,
        side: side === 'Left' ? 1 : -1,
        l1: pos(upper).distanceTo(pos(lower)),
        l2: pos(lower).distanceTo(pos(hand)),
        knuckle: pos(hand).distanceTo(pos(middle)),
        handRest: hand.getWorldQuaternion(new THREE.Quaternion()),
        fingersRest: pos(middle).sub(pos(hand)).normalize(),
        fingers: ['Index', 'Middle', 'Ring', 'Pinky'].map((f) => [1, 2, 3].map((j) => keep(bone(`${side}Hand${f}${j}`)))),
        thumb: [1, 2, 3].map((j) => keep(bone(`${side}HandThumb${j}`))),
      }
    }

    const head = keep(bone('Head'))
    const neck = keep(bone('Neck'))
    const eyes = [keep(bone('LeftEye')), keep(bone('RightEye'))]
    // Rest-pose world rotations of the eyes (the model faces +Z) to find their "forward"
    const eyeRest = eyes.map((e) => e.getWorldQuaternion(new THREE.Quaternion()))
    const headRest = head.getWorldQuaternion(new THREE.Quaternion())
    const neckRest = neck.getWorldQuaternion(new THREE.Quaternion())

    const morphs: THREE.Mesh[] = []
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && m.morphTargetDictionary && 'eyeBlinkLeft' in m.morphTargetDictionary) morphs.push(m)
    })
    const setMorph = (name: string, value: number) => {
      for (const m of morphs) {
        const i = m.morphTargetDictionary![name]
        if (i !== undefined) m.morphTargetInfluences![i] = value
      }
    }
    setMorph('mouthSmileLeft', SMILE)
    setMorph('mouthSmileRight', SMILE)

    return { arms: [arm('Left'), arm('Right')], head, neck, eyes, eyeRest, headRest, neckRest, rest, setMorph }
  }, [scene])

  useEffect(() => useStore.getState().set({ ready: true }), [])

  useFrame((state, dt) => {
    const { arms, head, neck, eyes, eyeRest, headRest, neckRest, rest, setMorph } = rig
    const now = state.clock.elapsedTime
    for (const [b, q] of rest) b.quaternion.copy(q)
    scene.updateMatrixWorld(true)

    // ── Arms crossed: two-bone IK per arm, then hand orientation and a loose curl ──
    const breath = Math.sin(now * 1.4) * BREATH
    for (const a of arms) {
      const pose = a.side > 0 ? CROSS.Left : CROSS.Right
      const shoulder = a.upper.getWorldPosition(new THREE.Vector3())
      const target = pose.wrist.clone().multiplyScalar(AVATAR_SCALE / 1.5).add(new THREE.Vector3(0, breath, 0))
      const toTarget = target.clone().sub(shoulder)
      const d = THREE.MathUtils.clamp(toTarget.length(), Math.abs(a.l1 - a.l2) + 1e-3, a.l1 + a.l2 - 1e-3)
      const dir = toTarget.normalize()
      const pole = pose.pole.clone()
      const perp = pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize()
      const along = (a.l1 * a.l1 - a.l2 * a.l2 + d * d) / (2 * d)
      const up = Math.sqrt(Math.max(0, a.l1 * a.l1 - along * along))
      const elbow = shoulder.clone().addScaledVector(dir, along).addScaledVector(perp, up)
      swing(a.upper, a.lower.getWorldPosition(new THREE.Vector3()), elbow)
      swing(a.lower, a.hand.getWorldPosition(new THREE.Vector3()), shoulder.clone().addScaledVector(dir, d))

      // Hand orientation (absolute, from the rest pose where palms face down)
      const fingers = pose.fingers.clone().normalize()
      const palm = pose.palm.clone().normalize()
      const world = frameDelta(a.fingersRest, new THREE.Vector3(0, -1, 0), fingers, palm).multiply(a.handRest)
      a.hand.quaternion.copy(a.hand.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world))
      a.hand.updateMatrixWorld(true)

      const axis = fingers.clone().cross(palm.clone().sub(fingers.clone().multiplyScalar(palm.dot(fingers))).normalize()).normalize()
      for (const chain of a.fingers) chain.forEach((j, k) => rotateWorld(j, new THREE.Quaternion().setFromAxisAngle(axis, CROSS.curl[k])))
      a.thumb.forEach((j, k) => rotateWorld(j, new THREE.Quaternion().setFromAxisAngle(axis, CROSS.thumb[k])))
    }

    // ── Look target: toward the camera, nudged by the cursor ──
    aim.current.lerp(state.pointer, 1 - Math.exp(-6 * dt))
    const look = camera.position.clone()
      .add(new THREE.Vector3(aim.current.x * LOOK_RANGE.x, aim.current.y * LOOK_RANGE.y, 0).applyQuaternion(camera.quaternion))


    // Glance toward the icon being read
    const active = useStore.getState().activeEntry
    glance.current = THREE.MathUtils.damp(glance.current, active >= 0 ? 0.55 : 0, 3, dt)
    if (active >= 0) lastIcon.current.copy(ANCHORS[active])
    look.lerp(lastIcon.current, glance.current)

    // Each bone's "forward" = +Z (the model faces +Z) carried by its rotation since the rest pose
    const aimAt = (bone: THREE.Bone, restWorld: THREE.Quaternion, amount: number) => {
      const fwd = FORWARD.clone().applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).multiply(restWorld.clone().invert()))
      swing(bone, fwd.add(bone.getWorldPosition(new THREE.Vector3())), look, amount)
    }
    // Head & neck turn part of the way, eyes go the rest
    aimAt(neck, neckRest, HEAD_FOLLOW * 0.4)
    aimAt(head, headRest, HEAD_FOLLOW * 0.6)
    eyes.forEach((e, i) => aimAt(e, eyeRest[i], EYE_FOLLOW))

    // ── Blinking ──
    const b = blink.current
    if (now > b.next) { b.t = now; b.next = now + 2 + Math.random() * 4 }
    const k = Math.max(0, 1 - Math.abs(now - b.t - 0.08) / 0.08)
    setMorph('eyeBlinkLeft', k)
    setMorph('eyeBlinkRight', k)
  })

  return <primitive object={scene} />
}

useGLTF.preload(MODEL)
