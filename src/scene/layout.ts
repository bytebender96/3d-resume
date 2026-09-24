import * as THREE from 'three'
import { RESUME } from '../data'

// World-space layout of the scene. Tweak freely.

/** Avatar scale (the model is 1.83 m tall) */
export const AVATAR_SCALE = 1.5
export const HEAD = new THREE.Vector3(0, 2.45, 0.05)

const N = RESUME.length
const RADIUS = 1.5
const START_ANGLE = 0.55 // radians from straight ahead; leaves the space in front of the face clear
const SWEEP = 5.2 // how far around the avatar the icons spiral
const TOP = 2.9
const BOTTOM = 0.8

/** One floating icon per resume entry, spiralling around the avatar from head height down */
export const ANCHORS = RESUME.map((_, i) => {
  const t = N > 1 ? i / (N - 1) : 0
  const a = START_ANGLE + t * SWEEP
  return new THREE.Vector3(Math.sin(a) * RADIUS, TOP - t * (TOP - BOTTOM), Math.cos(a) * RADIUS)
})

export type Shot = { pos: THREE.Vector3; look: THREE.Vector3; focus: THREE.Vector3 }

/**
 * Camera keyframes: hero → one per resume entry → wide.
 * Scroll position is mapped onto this list (see App.tsx), so each resume card
 * centred on screen lines up exactly with its icon.
 */
export function buildShots(portrait: boolean): Shot[] {
  const hero: Shot = portrait
    ? { pos: new THREE.Vector3(0, 2.3, 11), look: new THREE.Vector3(0, 0.4, 0), focus: HEAD.clone() }
    : { pos: new THREE.Vector3(-0.9, 2.05, 6.8), look: new THREE.Vector3(-1.15, 1.65, 0.2), focus: HEAD.clone() }

  const closeUps = ANCHORS.map((p) => {
    const out = p.clone().setY(0).normalize()
    // Stand outside the icon and a little to one side, so the avatar is visible behind it
    const side = new THREE.Vector3(-out.z, 0, out.x)
    if (portrait) {
      return {
        pos: p.clone().addScaledVector(out, 3.2).add(new THREE.Vector3(0, 0.5, 0)),
        look: p.clone().add(new THREE.Vector3(0, -0.45, 0)),
        focus: p.clone(),
      }
    }
    return {
      pos: p.clone().addScaledVector(out, 3.3).addScaledVector(side, 1.0).add(new THREE.Vector3(0, 0.3, 0)),
      look: p.clone().addScaledVector(side, 1.0),
      focus: p.clone(),
    }
  })

  const wide: Shot = { pos: new THREE.Vector3(0, 3.6, 12.5), look: new THREE.Vector3(0, 1.6, 0), focus: HEAD.clone() }
  return [hero, ...closeUps, wide]
}
