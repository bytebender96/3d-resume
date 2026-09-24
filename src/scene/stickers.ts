import * as THREE from 'three'
import type { Sticker } from '../data'

// Every sticker is drawn on a canvas at load time. Each style draws only its
// "body"; `dieCut` then adds the white vinyl border that follows the outline.
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"'
const ROUND = `"Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif, ${EMOJI}`
const HEAVY = `"Futura", "Avenir Next Condensed", "Arial Black", "Helvetica Neue", sans-serif, ${EMOJI}`
const SERIF = `Georgia, "Times New Roman", serif`
const MARKER = `"Marker Felt", "Comic Sans MS", "Segoe Print", cursive`
const MONO = `"SF Mono", Menlo, Consolas, monospace`
const BORDER = 18 // white die-cut border (px)
export const PX_TO_WORLD = 0.00032 // canvas px → metres on the briefcase (before auto-fit scaling)

export type StickerTexture = { texture: THREE.CanvasTexture; width: number; height: number; holo: boolean }

// ─── helpers ───────────────────────────────────────────────────────────

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(w)
  c.height = Math.ceil(h)
  return [c, c.getContext('2d')!] as const
}

function isLight(hex: string) {
  const c = new THREE.Color(hex)
  return c.r * 0.299 + c.g * 0.587 + c.b * 0.114 > 0.6
}

function shade(hex: string, k: number) {
  const c = new THREE.Color(hex)
  return '#' + c.lerp(new THREE.Color(k < 0 ? '#000' : '#fff'), Math.abs(k)).getHexString()
}

/** Largest font size (≤ max) at which `text` fits in `width`; leaves ctx.font set */
function fit(ctx: CanvasRenderingContext2D, text: string, width: number, max: number, font: string, weight = 800) {
  let size = max
  for (;;) {
    ctx.font = `${weight} ${size}px ${font}`
    if (ctx.measureText(text).width <= width || size <= 12) return size
    size -= 2
  }
}

const isEmoji = (t: string) => !/[\p{L}\p{N}]/u.test(t)

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points: number, inner: number) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 ? r * inner : r
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
  }
  ctx.closePath()
}

/** Paper grain + a few scuffs, so labels look printed and travelled */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.06) {
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  for (let i = 0; i < (w * h) / 60; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
  }
  ctx.restore()
}

const images = new Map<string, Promise<HTMLImageElement>>()
function loadImage(file: string) {
  if (!images.has(file)) {
    images.set(
      file,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = `${import.meta.env.BASE_URL}logos/${file}`
      }),
    )
  }
  return images.get(file)!
}

function fitImage(img: HTMLImageElement, maxW: number, maxH: number) {
  const k = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight)
  return { w: img.naturalWidth * k, h: img.naturalHeight * k }
}

/** Adds a white vinyl border that hugs the body's silhouette, plus a faint edge line */
function dieCut(body: HTMLCanvasElement, r = BORDER) {
  const pad = r + 6
  const [out, ctx] = canvas(body.width + pad * 2, body.height + pad * 2)
  const tinted = (color: string) => {
    const [c, x] = canvas(body.width, body.height)
    x.drawImage(body, 0, 0)
    x.globalCompositeOperation = 'source-in'
    x.fillStyle = color
    x.fillRect(0, 0, c.width, c.height)
    return c
  }
  const ring = (src: HTMLCanvasElement, radius: number, steps = 28) => {
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2
      ctx.drawImage(src, pad + Math.cos(a) * radius, pad + Math.sin(a) * radius)
    }
  }
  const edge = tinted('rgba(0,0,0,0.08)')
  const white = tinted('#ffffff')
  ring(edge, r + 2.5)
  for (const k of [1, 0.66, 0.33]) ring(white, r * k)
  ctx.drawImage(white, pad, pad)
  ctx.drawImage(body, pad, pad)
  return out
}

// ─── styles ────────────────────────────────────────────────────────────

/** Classic vinyl label: pill / circle / rect / burst / name tag */
function label(s: Sticker) {
  const shape = s.shape ?? 'pill'
  const bg = s.bg ?? '#f7f7f2'
  const fg = s.fg ?? (isLight(bg) ? '#16161c' : '#ffffff')
  const emoji = isEmoji(s.text)
  const [, m] = canvas(1, 1)
  m.font = `800 ${emoji ? 150 : 84}px ${ROUND}`
  const tw = m.measureText(s.text).width
  m.font = `700 38px ${ROUND}`
  const textW = Math.max(tw, s.sub ? m.measureText(s.sub).width : 0)

  let w: number, h: number
  if (shape === 'tag') { w = 560; h = 380 }
  else if (shape === 'circle' || shape === 'burst') w = h = Math.max(textW + (shape === 'burst' ? 150 : 90), shape === 'burst' ? 300 : 230)
  else { w = textW + (shape === 'pill' ? 110 : 80); h = (s.sub ? 140 : 90) + 60 }

  const [c, ctx] = canvas(w, h)
  if (shape === 'circle') { ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2) }
  else if (shape === 'burst') starPath(ctx, w / 2, h / 2, w / 2, 14, 0.82)
  else { ctx.beginPath(); ctx.roundRect(0, 0, w, h, shape === 'pill' ? h / 2 : 26) }
  ctx.fillStyle = shape === 'tag' ? '#fff' : bg
  ctx.fill()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (shape === 'tag') {
    ctx.save(); ctx.clip()
    ctx.fillStyle = s.bg ?? '#e5383b'
    ctx.fillRect(0, 0, w, 150)
    ctx.fillRect(0, h - 26, w, 26)
    ctx.restore()
    ctx.fillStyle = '#fff'
    ctx.font = `800 70px ${ROUND}`
    ctx.fillText('HELLO', w / 2, 58)
    ctx.font = `600 32px ${ROUND}`
    ctx.fillText('my name is', w / 2, 118)
    ctx.fillStyle = '#16161c'
    fit(ctx, s.text, w - 60, 100, MARKER, 400)
    ctx.fillText(s.text, w / 2, 250)
  } else {
    ctx.fillStyle = fg
    ctx.font = `800 ${emoji ? 150 : 84}px ${ROUND}`
    ctx.fillText(s.text, w / 2, s.sub ? h / 2 - 26 : h / 2 + (emoji ? 10 : 4))
    if (s.sub) {
      ctx.font = `700 38px ${ROUND}`
      ctx.globalAlpha = 0.8
      ctx.fillText(s.sub, w / 2, h / 2 + 44)
      ctx.globalAlpha = 1
    }
  }
  return c
}

/** Holographic foil: rainbow gradient body, rendered with an iridescent material */
function holo(s: Sticker) {
  const burst = s.shape === 'burst'
  const [, m] = canvas(1, 1)
  m.font = `900 90px ${HEAVY}`
  const tw = m.measureText(s.text).width
  const w = burst ? Math.max(tw + 170, 340) : tw + 130
  const h = burst ? w : 170
  const [c, ctx] = canvas(w, h)
  if (burst) starPath(ctx, w / 2, h / 2, w / 2, 16, 0.84)
  else { ctx.beginPath(); ctx.roundRect(0, 0, w, h, h / 2) }
  const g = ctx.createConicGradient(0.6, w / 2, h / 2)
  ;['#ffd6f5', '#c8f7ff', '#d9ffcf', '#fff4c2', '#ffd1d1', '#e1d4ff', '#ffd6f5'].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col))
  ctx.fillStyle = g
  ctx.fill()
  ctx.save(); ctx.clip()
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = '#ffffff'
  for (let x = -h, i = 0; x < w; x += 26, i++) { ctx.lineWidth = i % 2 ? 3 : 8; ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke() }
  ctx.restore()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `900 90px ${HEAVY}`
  ctx.lineJoin = 'round'
  ctx.lineWidth = 12
  ctx.strokeStyle = '#1b1530'
  ctx.strokeText(s.text, w / 2, h / 2 + 4)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(s.text, w / 2, h / 2 + 4)
  return c
}

/** Company / university logo, die-cut around its shape (or on a plate) */
async function logo(s: Sticker) {
  const img = await loadImage(s.logo!)
  const { w: lw, h: lh } = fitImage(img, 520, 260)
  if (s.shape === 'rect' || s.bg) {
    const pad = 36
    const [c, ctx] = canvas(lw + pad * 2, lh + pad * 2)
    ctx.beginPath()
    ctx.roundRect(0, 0, c.width, c.height, 28)
    ctx.fillStyle = s.bg ?? '#ffffff'
    ctx.fill()
    ctx.drawImage(img, pad, pad, lw, lh)
    return c
  }
  const [c, ctx] = canvas(lw, lh)
  ctx.drawImage(img, 0, 0, lw, lh)
  return c
}

/** Round seal: text running around a coloured ring, icon or logo in the middle */
async function roundel(s: Sticker) {
  const d = 420, r = d / 2
  const ink = s.bg ?? '#1f4e9c'
  const [c, ctx] = canvas(d, d)
  ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2)
  ctx.fillStyle = ink
  ctx.fill()
  ctx.beginPath(); ctx.arc(r, r, r - 74, 0, Math.PI * 2)
  ctx.fillStyle = s.accent ?? '#fbf5e6'
  ctx.fill()
  ctx.strokeStyle = s.accent ?? '#fbf5e6'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(r, r, r - 12, 0, Math.PI * 2); ctx.stroke()

  // Text around the ring, evenly spaced
  const text = s.text.toUpperCase()
  ctx.fillStyle = s.fg ?? '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const size = Math.min(40, Math.floor((Math.PI * 2 * (r - 42)) / (text.length * 0.78)))
  ctx.font = `900 ${size}px ${HEAVY}`
  for (let i = 0; i < text.length; i++) {
    const a = (i / text.length) * Math.PI * 2 - Math.PI / 2
    ctx.save()
    ctx.translate(r + Math.cos(a) * (r - 42), r + Math.sin(a) * (r - 42))
    ctx.rotate(a + Math.PI / 2)
    ctx.fillText(text[i], 0, 0)
    ctx.restore()
  }

  if (s.logo) {
    const img = await loadImage(s.logo)
    const { w, h } = fitImage(img, (r - 90) * 1.35, (r - 90) * 1.5)
    ctx.drawImage(img, r - w / 2, r - h / 2, w, h)
  } else {
    ctx.font = `800 150px ${ROUND}`
    ctx.fillStyle = ink
    ctx.fillText(s.icon ?? '★', r, r + 10)
  }
  grain(ctx, d, d, 0.05)
  return c
}

/** Vintage luggage label: "Greetings from …" */
function travel(s: Sticker) {
  const w = 620, h = 380
  const bg = s.bg ?? '#f1e2c2'
  const ink = s.fg ?? '#8c2f2f'
  const [c, ctx] = canvas(w, h)
  ctx.beginPath()
  ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.save(); ctx.clip()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = ink
  for (let i = 0; i < 24; i += 2) {
    ctx.beginPath()
    ctx.moveTo(w / 2, h * 0.62)
    ctx.arc(w / 2, h * 0.62, w, (i / 24) * Math.PI * 2, ((i + 1) / 24) * Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = ink
  ctx.fillRect(0, h * 0.72, w, h)
  ctx.fillStyle = s.accent ?? '#e8b04b'
  for (let x = -h; x < w; x += 44) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 22, h); ctx.lineTo(x + 22 + h * 0.3, h * 0.72); ctx.lineTo(x + h * 0.3, h * 0.72); ctx.fill() }
  ctx.restore()
  ctx.strokeStyle = ink
  ctx.lineWidth = 7
  ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 16, h / 2 - 16, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 28, h / 2 - 28, 0, 0, Math.PI * 2); ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = ink
  ctx.font = `italic 700 34px ${SERIF}`
  ctx.fillText(s.kicker ?? 'Greetings from', w / 2, 88)
  const size = fit(ctx, s.text, w - 150, 112, HEAVY, 900)
  ctx.font = `900 ${size}px ${HEAVY}`
  ctx.fillStyle = shade(ink, -0.45)
  ctx.fillText(s.text, w / 2 + 5, 183)
  ctx.fillStyle = ink
  ctx.fillText(s.text, w / 2, 178)
  if (s.sub) {
    ctx.font = `800 30px ${HEAVY}`
    const sw = ctx.measureText(s.sub).width + 40
    ctx.fillStyle = bg
    ctx.beginPath(); ctx.roundRect(w / 2 - sw / 2, h * 0.72 + 12, sw, 46, 8); ctx.fill()
    ctx.fillStyle = ink
    ctx.fillText(s.sub, w / 2, h * 0.72 + 36)
  }
  grain(ctx, w, h)
  return c
}

/** Postage stamp with perforated edges */
function stamp(s: Sticker) {
  const w = 330, h = 400
  const bg = s.bg ?? '#3ec1d3'
  const fg = s.fg ?? (isLight(bg) ? '#16161c' : '#ffffff')
  const [c, ctx] = canvas(w, h)
  ctx.fillStyle = '#fbf8f1'
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'destination-out'
  const hole = 13, step = 36
  for (let x = step / 2; x < w; x += step) for (const y of [0, h]) { ctx.beginPath(); ctx.arc(x, y, hole, 0, Math.PI * 2); ctx.fill() }
  for (let y = step / 2; y < h; y += step) for (const x of [0, w]) { ctx.beginPath(); ctx.arc(x, y, hole, 0, Math.PI * 2); ctx.fill() }
  ctx.globalCompositeOperation = 'source-over'
  const inset = 30
  ctx.fillStyle = bg
  ctx.fillRect(inset, inset, w - inset * 2, h - inset * 2)
  ctx.strokeStyle = shade(bg, 0.5)
  ctx.lineWidth = 3
  ctx.strokeRect(inset + 12, inset + 12, w - inset * 2 - 24, h - inset * 2 - 24)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 ${isEmoji(s.icon ?? 'x') ? 150 : 110}px ${ROUND}`
  ctx.fillStyle = fg
  ctx.fillText(s.icon ?? '★', w / 2, h / 2 - 20)
  fit(ctx, s.text.toUpperCase(), w - inset * 2 - 40, 40, HEAVY, 900)
  ctx.fillText(s.text.toUpperCase(), w / 2, h - inset - 48)
  if (s.sub) {
    ctx.textAlign = 'right'
    ctx.font = `900 30px ${HEAVY}`
    ctx.fillText(s.sub, w - inset - 22, inset + 38)
  }
  grain(ctx, w, h, 0.05)
  return c
}

/** Award rosette with ribbon tails */
function badge(s: Sticker) {
  const w = 440, h = 560
  const bg = s.bg ?? '#f2b632'
  const fg = s.fg ?? (isLight(bg) ? '#2a1d05' : '#ffffff')
  const r = 190, cy = 210
  const [c, ctx] = canvas(w, h)
  for (const side of [-1, 1]) {
    ctx.fillStyle = shade(bg, side < 0 ? -0.25 : -0.4)
    ctx.beginPath()
    const x0 = w / 2 + side * 20
    ctx.moveTo(x0 - 55, cy + 80)
    ctx.lineTo(x0 + 55, cy + 80)
    ctx.lineTo(x0 + side * 90 + 55, h - 10)
    ctx.lineTo(x0 + side * 90, h - 60)
    ctx.lineTo(x0 + side * 90 - 55, h - 10)
    ctx.closePath()
    ctx.fill()
  }
  starPath(ctx, w / 2, cy, r, 30, 0.9)
  ctx.fillStyle = shade(bg, -0.12)
  ctx.fill()
  ctx.beginPath(); ctx.arc(w / 2, cy, r * 0.8, 0, Math.PI * 2)
  const g = ctx.createRadialGradient(w / 2 - 50, cy - 60, 10, w / 2, cy, r)
  g.addColorStop(0, shade(bg, 0.35))
  g.addColorStop(1, bg)
  ctx.fillStyle = g
  ctx.fill()
  ctx.setLineDash([10, 8])
  ctx.strokeStyle = fg
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(w / 2, cy, r * 0.7, 0, Math.PI * 2); ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = fg
  const words = s.text.toUpperCase().split(' ')
  const half = Math.ceil(words.length / 2)
  const lines = s.text.length > 10 && words.length > 1 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : [s.text.toUpperCase()]
  const size = Math.min(...lines.map((l) => fit(ctx, l, r * 1.2, 64, HEAVY, 900)))
  ctx.font = `900 ${size}px ${HEAVY}`
  const lh = size * 1.05
  const top = cy - ((lines.length - 1) * lh) / 2 - (s.sub ? 18 : 0)
  lines.forEach((l, i) => ctx.fillText(l, w / 2, top + i * lh))
  if (s.sub) {
    ctx.font = `700 30px ${ROUND}`
    ctx.fillText(`★ ${s.sub} ★`, w / 2, top + lines.length * lh + 14)
  }
  return c
}

/** Boarding-pass style ticket with a barcode stub */
function ticket(s: Sticker) {
  const w = 660, h = 270
  const accent = s.bg ?? '#1f4e9c'
  const [c, ctx] = canvas(w, h)
  const cut = w * 0.72
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, 24)
  ctx.fillStyle = '#fff8ea'
  ctx.fill()
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, w, 58)
  ctx.globalCompositeOperation = 'destination-out'
  for (const y of [0, h]) { ctx.beginPath(); ctx.arc(cut, y, 24, 0, Math.PI * 2); ctx.fill() }
  ctx.globalCompositeOperation = 'source-over'
  ctx.setLineDash([12, 10])
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(cut, 30); ctx.lineTo(cut, h - 30); ctx.stroke()
  ctx.setLineDash([])

  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.font = `800 26px ${MONO}`
  ctx.fillText((s.kicker ?? 'Boarding pass').toUpperCase(), 30, 30)
  ctx.fillStyle = '#16161c'
  fit(ctx, s.text, cut - 60, 84, HEAVY, 900)
  ctx.fillText(s.text, 30, 128)
  if (s.sub) {
    fit(ctx, s.sub.toUpperCase(), cut - 60, 30, MONO, 700)
    ctx.fillStyle = shade(accent, -0.1)
    ctx.fillText(s.sub.toUpperCase(), 30, 200)
  }
  let x = cut + 32
  let seed = s.text.length * 7 + 3
  while (x < w - 30) {
    seed = (seed * 9301 + 49297) % 233280
    const bw = 3 + (seed % 9)
    ctx.fillStyle = '#16161c'
    ctx.fillRect(x, 84, bw * 0.6, 150)
    x += bw + 3
  }
  grain(ctx, w, h, 0.04)
  return c
}

/** Data-card sticker: big metric + mini bar chart trending the right way */
function chart(s: Sticker) {
  const w = 470, h = 320
  const accent = s.bg ?? '#3ec1d3'
  const good = '#12a150'
  const [c, ctx] = canvas(w, h)
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, 34)
  ctx.fillStyle = '#fbfbf7'
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 2
  for (let y = 60; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(w - 24, y); ctx.stroke() }

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = good
  const size = fit(ctx, s.text, w - 140, 104, HEAVY, 900)
  ctx.fillText(s.text, 30, 120)
  const tw = ctx.measureText(s.text).width
  ctx.font = `900 ${Math.round(size * 0.48)}px ${ROUND}`
  ctx.fillText(s.trend === 'down' ? '▼' : '▲', 30 + tw + 12, 104)
  ctx.fillStyle = '#5b6070'
  fit(ctx, (s.sub ?? '').toUpperCase(), w - 60, 32, ROUND, 700)
  ctx.fillText((s.sub ?? '').toUpperCase(), 32, 168)

  const n = 8, bx = 32, bw = (w - 64) / n
  for (let i = 0; i < n; i++) {
    const t = s.trend === 'down' ? 1 - i / (n - 1) : i / (n - 1)
    const bh = 20 + t * 90 + Math.sin(i * 2.3) * 8
    ctx.fillStyle = i === n - 1 ? good : accent
    ctx.globalAlpha = i === n - 1 ? 1 : 0.55 + (i / n) * 0.4
    ctx.beginPath(); ctx.roundRect(bx + i * bw + 6, h - 30 - bh, bw - 12, bh, 6); ctx.fill()
  }
  ctx.globalAlpha = 1
  return c
}

// ─── entry point ───────────────────────────────────────────────────────

export async function makeSticker(s: Sticker): Promise<StickerTexture> {
  const style = s.style ?? 'label'
  const body =
    style === 'logo' ? await logo(s)
    : style === 'roundel' ? await roundel(s)
    : style === 'holo' ? holo(s)
    : style === 'travel' ? travel(s)
    : style === 'stamp' ? stamp(s)
    : style === 'badge' ? badge(s)
    : style === 'ticket' ? ticket(s)
    : style === 'chart' ? chart(s)
    : label(s)
  const cut = dieCut(body)

  // Subtle glossy highlight across the whole sticker
  const ctx = cut.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, cut.width, cut.height)
  g.addColorStop(0, 'rgba(255,255,255,0.22)')
  g.addColorStop(0.45, 'rgba(255,255,255,0)')
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = g
  ctx.fillRect(0, 0, cut.width, cut.height)

  const texture = new THREE.CanvasTexture(cut)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const k = PX_TO_WORLD * (s.scale ?? 1)
  return { texture, width: cut.width * k, height: cut.height * k, holo: style === 'holo' }
}
