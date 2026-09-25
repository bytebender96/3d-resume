import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { AVATAR_SCALE, spreadCentre } from './layout'

const MODEL = `${import.meta.env.BASE_URL}models/avatar.glb`
const HEAD_FOLLOW = 0.3 // how much of the way the head turns toward the look target
const EYE_FOLLOW = 1 // eyes go all the way
const LOOK_RANGE = new THREE.Vector2(1.6, 1.0) // how far (m) the cursor moves the look target around the camera
const SMILE = 0.25
// Relaxed standing pose: arms hang by the sides, elbows softly bent, palms toward the thighs
const STAND = {
  drop: 0.95, // wrist height below the shoulder, as a fraction of full arm length
  out: 0.1, // wrist distance out from the shoulder (m)
  forward: 0.05, // wrist slightly in front of the shoulder (m)
  pole: new THREE.Vector3(0.2, 0, -1), // elbows point back (x is mirrored per side)
  fingers: new THREE.Vector3(0.05, -1, 0.12), // fingers point down (x mirrored)
  palm: new THREE.Vector3(-1, 0, 0.15), // palm faces the thigh (x mirrored)
  curl: [0.3, 0.4, 0.3], // loose, natural finger curl
  thumb: [0.15, 0.25, 0.2],
}
const SWAY = 0.012 // gentle arm sway with the breath (m)

// Weight on the right leg (contrapposto): hips shift over it and its hip rises,
// the left knee relaxes, and the shoulders tilt the other way. Feet stay planted.
const WEIGHT = {
  shift: new THREE.Vector3(-0.035, -0.03, 0), // hips move toward the right leg (−x) and settle down a touch (m)
  roll: 0.05, // pelvis tilt, right hip up (radians)
  counter: 1.25, // spine tilts back the other way by this multiple, so the shoulders counter the hips
  sway: 0.006, // slow side-to-side weight drift (m)
}
// Right hand in the trouser pocket (wrist position relative to the hips, in metres)
const POCKET = {
  wrist: new THREE.Vector3(-0.255, 0.0, 0.035),
  pole: new THREE.Vector3(-0.8, 0, -1), // elbow out and back
  fingers: new THREE.Vector3(0.3, -1, 0.05), // down and in, disappearing into the pocket
  palm: new THREE.Vector3(1, 0, 0.2), // toward the thigh
  curl: [0.15, 0.25, 0.2],
  thumb: [0, 0, 0], // thumb hooked outside the pocket
}

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

    const hips = keep(bone('Hips'))
    const hipsRestPos = hips.position.clone()
    const spine = keep(bone('Spine1'))
    const leg = (side: 'Left' | 'Right') => {
      const up = keep(bone(`${side}UpLeg`)), low = keep(bone(`${side}Leg`)), foot = keep(bone(`${side}Foot`))
      return {
        up, low, foot,
        side: side === 'Left' ? 1 : -1,
        l1: pos(up).distanceTo(pos(low)),
        l2: pos(low).distanceTo(pos(foot)),
        footPos: pos(foot),
        footRot: foot.getWorldQuaternion(new THREE.Quaternion()),
      }
    }
    const legs = [leg('Left'), leg('Right')]

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

    return { arms: [arm('Left'), arm('Right')], legs, hips, hipsRestPos, spine, head, neck, eyes, eyeRest, headRest, neckRest, rest, setMorph }
  }, [scene])

  useEffect(() => useStore.getState().set({ ready: true }), [])

  useFrame((state, dt) => {
    const { arms, legs, hips, hipsRestPos, spine, head, neck, eyes, eyeRest, headRest, neckRest, rest, setMorph } = rig
    const now = state.clock.elapsedTime
    for (const [b, q] of rest) b.quaternion.copy(q)
    hips.position.copy(hipsRestPos)
    scene.updateMatrixWorld(true)

    // ── Weight shift: move & tilt the pelvis, counter-tilt the spine, then re-plant the feet ──
    const drift = Math.sin(now * 0.45) * WEIGHT.sway
    const shift = WEIGHT.shift.clone().add(new THREE.Vector3(drift, 0, 0)).divideScalar(AVATAR_SCALE) // hips live in model space
    hips.position.add(shift)
    hips.updateMatrixWorld(true)
    rotateWorld(hips, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -WEIGHT.roll))
    rotateWorld(spine, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), WEIGHT.roll * WEIGHT.counter))
    for (const l of legs) {
      const hip = l.up.getWorldPosition(new THREE.Vector3())
      const toFoot = l.footPos.clone().sub(hip)
      const d = THREE.MathUtils.clamp(toFoot.length(), Math.abs(l.l1 - l.l2) + 1e-3, l.l1 + l.l2 - 1e-4)
      const dir = toFoot.normalize()
      const pole = new THREE.Vector3(l.side * 0.1, 0, 1) // knees point forward
      const perp = pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize()
      const along = (l.l1 * l.l1 - l.l2 * l.l2 + d * d) / (2 * d)
      const knee = hip.clone().addScaledVector(dir, along).addScaledVector(perp, Math.sqrt(Math.max(0, l.l1 * l.l1 - along * along)))
      swing(l.up, l.low.getWorldPosition(new THREE.Vector3()), knee)
      swing(l.low, l.foot.getWorldPosition(new THREE.Vector3()), hip.clone().addScaledVector(dir, d))
      // Keep the foot flat, as in the rest pose
      l.foot.quaternion.copy(l.foot.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(l.footRot))
      l.foot.updateMatrixWorld(true)
    }

    // ── Arms relaxed by the sides: two-bone IK per arm, then hand orientation and a loose curl ──
    const hipsPos = hips.getWorldPosition(new THREE.Vector3())
    for (const a of arms) {
      const pocket = a.side < 0 // right hand goes in the pocket
      const m = new THREE.Vector3(a.side, 1, 1) // mirror x for the right side
      const shoulder = a.upper.getWorldPosition(new THREE.Vector3())
      const sway = Math.sin(now * 1.2) * SWAY
      const target = pocket
        ? hipsPos.clone().add(POCKET.wrist)
        : shoulder.clone().add(new THREE.Vector3(a.side * STAND.out, -(a.l1 + a.l2) * STAND.drop, STAND.forward + sway))
      const toTarget = target.clone().sub(shoulder)
      const d = THREE.MathUtils.clamp(toTarget.length(), Math.abs(a.l1 - a.l2) + 1e-3, a.l1 + a.l2 - 1e-3)
      const dir = toTarget.normalize()
      const pole = pocket ? POCKET.pole.clone() : STAND.pole.clone().multiply(m)
      const perp = pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize()
      const along = (a.l1 * a.l1 - a.l2 * a.l2 + d * d) / (2 * d)
      const up = Math.sqrt(Math.max(0, a.l1 * a.l1 - along * along))
      const elbow = shoulder.clone().addScaledVector(dir, along).addScaledVector(perp, up)
      swing(a.upper, a.lower.getWorldPosition(new THREE.Vector3()), elbow)
      swing(a.lower, a.hand.getWorldPosition(new THREE.Vector3()), shoulder.clone().addScaledVector(dir, d))

      // Hand orientation (absolute, from the rest pose where palms face down)
      const fingers = (pocket ? POCKET.fingers.clone() : STAND.fingers.clone().multiply(m)).normalize()
      const palm = (pocket ? POCKET.palm.clone() : STAND.palm.clone().multiply(m)).normalize()
      const world = frameDelta(a.fingersRest, new THREE.Vector3(0, -1, 0), fingers, palm).multiply(a.handRest)
      a.hand.quaternion.copy(a.hand.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world))
      a.hand.updateMatrixWorld(true)

      const axis = fingers.clone().cross(palm.clone().sub(fingers.clone().multiplyScalar(palm.dot(fingers))).normalize()).normalize()
      const curl = pocket ? POCKET.curl : STAND.curl
      const thumb = pocket ? POCKET.thumb : STAND.thumb
      for (const chain of a.fingers) chain.forEach((j, k) => rotateWorld(j, new THREE.Quaternion().setFromAxisAngle(axis, curl[k])))
      a.thumb.forEach((j, k) => rotateWorld(j, new THREE.Quaternion().setFromAxisAngle(axis, thumb[k])))
    }

    // ── Look target: toward the camera, nudged by the cursor ──
    aim.current.lerp(state.pointer, 1 - Math.exp(-6 * dt))
    const look = camera.position.clone()
      .add(new THREE.Vector3(aim.current.x * LOOK_RANGE.x, aim.current.y * LOOK_RANGE.y, 0).applyQuaternion(camera.quaternion))


    // Glance toward the book being read
    const active = useStore.getState().activeEntry
    glance.current = THREE.MathUtils.damp(glance.current, active >= 0 ? 0.55 : 0, 3, dt)
    if (active >= 0) lastIcon.current.copy(spreadCentre(active))
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
