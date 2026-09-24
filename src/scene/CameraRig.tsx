import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { SHOTS } from './layout'

const DAMPING = 3.5 // higher = snappier camera
const PARALLAX = 0.25 // how much the pointer nudges the camera

const smooth = (x: number) => x * x * (3 - 2 * x)

/** Scrubs the camera along the SHOTS path using the scroll-derived `camT`. */
export function CameraRig({ focus }: { focus: THREE.Vector3 }) {
  const camera = useThree((s) => s.camera)
  const t = useRef(0)
  const { posCurve, lookCurve, focusCurve } = useMemo(
    () => ({
      posCurve: new THREE.CatmullRomCurve3(SHOTS.map((s) => s.pos), false, 'centripetal'),
      lookCurve: new THREE.CatmullRomCurve3(SHOTS.map((s) => s.look), false, 'centripetal'),
      focusCurve: new THREE.CatmullRomCurve3(SHOTS.map((s) => s.focus), false, 'centripetal'),
    }),
    [],
  )
  const look = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const target = useStore.getState().camT
    t.current = THREE.MathUtils.damp(t.current, target, DAMPING, Math.min(dt, 0.1))

    // Ease within each segment so the camera "settles" on every shot
    const n = SHOTS.length - 1
    const i = Math.min(Math.floor(t.current), n - 1)
    const u = (i + smooth(THREE.MathUtils.clamp(t.current - i, 0, 1))) / n

    posCurve.getPoint(u, camera.position)
    lookCurve.getPoint(u, look)
    focusCurve.getPoint(u, focus)

    tmp.set(state.pointer.x * PARALLAX, state.pointer.y * PARALLAX * 0.6, 0).applyQuaternion(camera.quaternion)
    camera.position.add(tmp)
    camera.lookAt(look)
  })
  return null
}
