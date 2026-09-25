import * as THREE from 'three'
import { RESUME, type Chapter } from '../data'

// World-space layout of the scene. Tweak freely.

/** Avatar scale (the model is 1.83 m tall); the avatar stands at the origin facing +Z */
export const AVATAR_SCALE = 1.5
export const HEAD = new THREE.Vector3(0, 2.45, 0.05)

// ─── Bookshelf behind the avatar ─────────────────────────────────────────
export const SHELF = {
  z: -1.3, // centre of the shelf's depth
  depth: 0.46,
  width: 4.2,
  board: 0.04, // board thickness
  /** Top surface of each horizontal board, bottom → top */
  boards: [0.2, 1.2, 2.2, 3.1],
  /** Vertical dividers (x) — the middle bay sits behind the avatar and holds decor */
  dividers: [-2.1, -0.7, 0.7, 2.1],
}

/** Which bay and row each chapter's books live in */
const CHAPTER_SLOT: Record<Exclude<Chapter, 'About'>, { bay: 0 | 2; row: 1 | 2 }> = {
  Education: { bay: 0, row: 2 }, // left, eye level
  Work: { bay: 2, row: 2 }, // right, eye level
  Recognition: { bay: 0, row: 1 }, // left, lower
  Toolkit: { bay: 2, row: 1 }, // right, lower
}

/** Book size: W = cover width, H = height; thickness varies per book */
export const BOOK = { w: 0.44, h: 0.62 }
const THICKNESS = [0.1, 0.085, 0.12, 0.095, 0.11, 0.13, 0.1, 0.09, 0.12]

export type BookSlot = {
  /** Centre of the book standing on the shelf (spine facing out) */
  shelf: THREE.Vector3
  /** Where it floats to, facing the camera (closed; spine on the left) */
  present: THREE.Vector3
  thickness: number
  bay: number
  row: number
}

/** Real books, in resume order, packed from the left of their bay (fillers go around them) */
export const BOOKS: BookSlot[] = (() => {
  const used = new Map<string, number>()
  return RESUME.map((e, k) => {
    const { bay, row } = CHAPTER_SLOT[e.chapter]
    const key = `${bay}-${row}`
    const left = SHELF.dividers[bay] + SHELF.board / 2 + 0.12 + (used.get(key) ?? 0)
    const t = THICKNESS[k % THICKNESS.length]
    used.set(key, (used.get(key) ?? 0) + t + 0.012)
    const x = left + t / 2
    const bayCentre = (SHELF.dividers[bay] + SHELF.dividers[bay + 1]) / 2
    return {
      shelf: new THREE.Vector3(x, SHELF.boards[row] + BOOK.h / 2 + 0.002, SHELF.z + 0.01),
      present: new THREE.Vector3(bayCentre, 2.05, SHELF.z + 0.85),
      thickness: t,
      bay,
      row,
    }
  })
})()

/** Space already taken by real books in each bay/row (so fillers start after them) */
export const bayUsed = (bay: number, row: number) =>
  BOOKS.filter((b) => b.bay === bay && b.row === row).reduce((a, b) => a + b.thickness + 0.012, 0)

/** Centre of book k's open two-page spread (the book shifts right as it opens, so this is where it floats to) */
export const spreadCentre = (k: number) => BOOKS[k].present.clone()

/**
 * Scroll timeline, in camera-shot units (see App.tsx): 0 = hero, k+1 = resume entry k,
 * N+1 = wide shot. Book k comes out and opens as you reach entry k, then goes back.
 */
const smooth = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c) }
export const bookTimeline = (t: number, k: number) => ({
  /** 0 = on the shelf, 1 = floating in front, facing the camera */
  out: smooth((t - (k + 0.35)) / 0.55) * (1 - smooth((t - (k + 1.4)) / 0.55)),
  /** 0 = closed, 1 = open flat */
  open: smooth((t - (k + 0.75)) / 0.25) * (1 - smooth((t - (k + 1.25)) / 0.2)),
})

export type Shot = { pos: THREE.Vector3; look: THREE.Vector3; focus: THREE.Vector3 }

/**
 * Camera keyframes: hero → one shot per open book → wide.
 * Scroll position is mapped onto this list (see App.tsx), so each resume card
 * centred on screen lines up with its book lying open.
 */
export function buildShots(portrait: boolean): Shot[] {
  const hero: Shot = portrait
    ? { pos: new THREE.Vector3(0, 2.3, 11), look: new THREE.Vector3(0, 0.6, -0.3), focus: HEAD.clone() }
    : { pos: new THREE.Vector3(-0.5, 2.2, 6.6), look: new THREE.Vector3(-0.7, 1.8, -0.3), focus: HEAD.clone() }

  const closeUps = BOOKS.map((_, k) => {
    const c = spreadCentre(k)
    // Gentle drift so consecutive books in the same bay don't feel static
    const drift = new THREE.Vector3(Math.sin(k * 1.7) * 0.06, Math.cos(k * 1.3) * 0.04, 0)
    if (portrait) {
      return { pos: c.clone().add(new THREE.Vector3(0, 0.3, 2.9)).add(drift), look: c.clone().add(new THREE.Vector3(0, -0.5, 0)), focus: c }
    }
    // Desktop: the spread sits right of the text column
    const look = c.clone().add(new THREE.Vector3(-0.36, 0, 0))
    return { pos: look.clone().add(new THREE.Vector3(0.05, 0.12, 1.55)).add(drift), look, focus: c }
  })

  const wide: Shot = { pos: new THREE.Vector3(0, 2.4, 9.5), look: new THREE.Vector3(0, 1.8, -0.8), focus: HEAD.clone() }
  return [hero, ...closeUps, wide]
}
