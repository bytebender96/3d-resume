import * as THREE from 'three'
import { RESUME } from '../data'

// World-space layout of the scene. Tweak freely.
export const HEAD = new THREE.Vector3(0, 1.55, 0)
const ANCHOR_RADIUS = 2.6

/** Floating "memory" objects — one per resume entry, spiralling around the character. */
const N = RESUME.length
const SPREAD = Math.min(1.35, 5.4 / Math.max(N - 1, 1)) // angle between objects; stays under one lap
export const ANCHORS = RESUME.map((_, i) => {
  const a = -0.9 + i * SPREAD
  const y = 2.6 - (i / Math.max(N - 1, 1)) * 2.0
  return new THREE.Vector3(Math.sin(a) * ANCHOR_RADIUS, y, Math.cos(a) * ANCHOR_RADIUS * 0.8)
})

export type Shot = { pos: THREE.Vector3; look: THREE.Vector3; focus: THREE.Vector3 }

/**
 * Camera keyframes: hero → one per resume entry → works.
 * Scroll position is mapped onto this list (see App.tsx), so each resume card
 * centred on screen lines up exactly with its shot.
 */
export const SHOTS: Shot[] = [
  // Hero: character on the right third, text on the left
  { pos: new THREE.Vector3(-0.9, 1.7, 6), look: new THREE.Vector3(-1.3, 1.2, 0), focus: HEAD.clone() },
  ...ANCHORS.map((p) => {
    const out = p.clone().setY(0).normalize()
    // Stand outside the anchor, slightly to the side, so the object sits right of the text column
    const side = new THREE.Vector3(-out.z, 0, out.x)
    return {
      pos: p.clone().addScaledVector(out, 3.3).addScaledVector(side, 0.9).add(new THREE.Vector3(0, 0.35, 0)),
      look: p.clone().addScaledVector(side, 0.75),
      focus: p.clone(),
    }
  }),
  // Works: pull back into a wide establishing shot
  { pos: new THREE.Vector3(0, 3.4, 11), look: new THREE.Vector3(0, 1.2, 0), focus: HEAD.clone() },
]
