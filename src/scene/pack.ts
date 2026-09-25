import type { StickerTexture } from './stickers'

export type Slot = { u: number; v: number; w: number; h: number }
export type Placed = { u: number; v: number; rot: number; scale: number }

const GUTTER = 0.006 // minimum space between stickers (m)
const MAX_TILT = 0.12 // radians
const TILT_FIT = 0.92 // shrink a touch so tilted stickers don't touch

export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Lays stickers out in rows filling a rectangle edge to edge: tries 1–4 rows,
 * stretches each row to the slot width, keeps whichever covers the most area.
 */
export function pack(slot: Slot, texes: StickerTexture[], rand: () => number): Placed[] {
  const n = texes.length
  type Layout = { rows: number[][]; rowScale: number[]; f: number; coverage: number }
  let best: Layout | null = null

  for (let r = 1; r <= Math.min(n, 4); r++) {
    const total = texes.reduce((a, t) => a + t.width, 0)
    const rows: number[][] = [[]]
    let acc = 0
    texes.forEach((t, i) => {
      const row = rows[rows.length - 1]
      if (row.length && rows.length < r && acc + t.width / 2 > (total / r) * rows.length) rows.push([])
      rows[rows.length - 1].push(i)
      acc += t.width
    })
    if (rows.length !== r) continue
    let rowScale = rows.map((row) => (slot.w - GUTTER * (row.length - 1)) / row.reduce((a, i) => a + texes[i].width, 0))
    const median = [...rowScale].sort((a, b) => a - b)[Math.floor(r / 2)]
    rowScale = rowScale.map((s) => Math.min(s, median * 1.35))
    const heights = rows.map((row, k) => Math.max(...row.map((i) => texes[i].height)) * rowScale[k])
    const f = Math.min(1, (slot.h - GUTTER * (r - 1)) / heights.reduce((a, h) => a + h, 0))
    const coverage = rows.reduce((a, row, k) => a + row.reduce((b, i) => b + texes[i].width * texes[i].height, 0) * (rowScale[k] * f) ** 2, 0)
    if (!best || coverage > best.coverage) best = { rows, rowScale, f, coverage }
  }

  const { rows, rowScale, f } = best!
  const heights = rows.map((row, k) => Math.max(...row.map((i) => texes[i].height)) * rowScale[k] * f)
  const vGap = (slot.h - heights.reduce((a, h) => a + h, 0)) / (rows.length + 1)
  const out: Placed[] = new Array(n)
  let y = slot.v + slot.h / 2 - vGap
  rows.forEach((row, k) => {
    const s = rowScale[k] * f
    const rowH = heights[k]
    const widths = row.map((i) => texes[i].width * s)
    const hGap = (slot.w - widths.reduce((a, w) => a + w, 0)) / (row.length + 1)
    let x = slot.u - slot.w / 2 + hGap
    row.forEach((i, j) => {
      const h = texes[i].height * s
      const jitter = (rand() - 0.5) * (rowH - h) * 0.7
      out[i] = { u: x + widths[j] / 2, v: y - rowH / 2 + jitter, rot: (rand() - 0.5) * 2 * MAX_TILT, scale: s * TILT_FIT }
      x += widths[j] + hGap
    })
    y -= rowH + vGap
  })
  return out
}
