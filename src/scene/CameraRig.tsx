import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { buildShots } from './layout'

const DAMPING = 3.5 // higher = snappier camera
const PARALLAX = 0.2 // how much the pointer nudges the camera

export const smooth = (x: number) => x * x * (3 - 2 * x)

/** Damped camera position along the shot list, shared with the briefcase & stickers */
export const rig = { t: 0 }

/** Scrubs the camera along the shot path using the scroll-derived `camT`. */
export function CameraRig({ focus }: { focus: THREE.Vector3 }) {
  const camera = useThree((s) => s.camera)
  const portrait = useThree((s) => s.size.width / s.size.height < 0.8)
  const { posCurve, lookCurve, focusCurve, n } = useMemo(() => {
    const shots = buildShots(portrait)
    const curve = (pts: THREE.Vector3[]) => new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    return {
      posCurve: curve(shots.map((s) => s.pos)),
      lookCurve: curve(shots.map((s) => s.look)),
      focusCurve: curve(shots.map((s) => s.focus)),
      n: shots.length - 1,
    }
  }, [portrait])
  const look = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const target = useStore.getState().camT
    rig.t = THREE.MathUtils.damp(rig.t, target, DAMPING, Math.min(dt, 0.1))

    // Ease within each segment so the camera "settles" on every shot
    const i = Math.min(Math.floor(rig.t), n - 1)
    const u = (i + smooth(THREE.MathUtils.clamp(rig.t - i, 0, 1))) / n

    posCurve.getPoint(u, camera.position)
    lookCurve.getPoint(u, look)
    focusCurve.getPoint(u, focus)

    tmp.set(state.pointer.x * PARALLAX, state.pointer.y * PARALLAX * 0.6, 0).applyQuaternion(camera.quaternion)
    camera.position.add(tmp)
    camera.lookAt(look)
  })
  return null
}
