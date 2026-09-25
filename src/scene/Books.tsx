import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { RESUME, type Chapter, type ResumeEntry } from '../data'
import { useStore } from '../store'
import { rig } from './CameraRig'
import { BOOK, BOOKS, bookTimeline, type BookSlot } from './layout'
import { pack, rng } from './pack'
import { makeCover, makeHeading, makePaper, makeSpine, makeSticker, type StickerTexture } from './stickers'

// Cloth colour per chapter (each book gets a slight variation)
const CLOTH: Record<Exclude<Chapter, 'About'>, string> = {
  Education: '#1f3f6b',
  Work: '#7a2e22',
  Recognition: '#2f5a3a',
  Toolkit: '#4a3a6e',
}
const PAGE_COLOR = '#efe6d2'
const COVER_T = 0.014 // cover board thickness
const PULL = 0.5 // how far a book slides straight out before flying to the front (m)
const OPEN_ANGLE = Math.PI * 0.97
const SLAP_SPEED = 3.2
const PEEL_SPEED = 5
const STAGGER = 0.08

const { w: W, h: H } = BOOK
const easeOutBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2
const smooth = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c) }

function shadeOf(hex: string, k: number) {
  const c = new THREE.Color(hex)
  return '#' + c.offsetHSL(0, 0, k).getHexString()
}

export function Books() {
  const [stickers, setStickers] = useState<StickerTexture[][] | null>(null)
  useEffect(() => {
    let alive = true
    let made: StickerTexture[][] = []
    Promise.all(RESUME.map((e) => Promise.all(e.stickers.map(makeSticker)))).then((t) => {
      made = t
      if (alive) setStickers(t)
      else t.flat().forEach((x) => x.texture.dispose())
    })
    return () => {
      alive = false
      made.flat().forEach((x) => x.texture.dispose())
    }
  }, [])
  const paper = useMemo(() => makePaper((W - 0.03) / (H - 0.03)), [])

  return (
    <>
      {RESUME.map((e, k) => (
        <Book key={k} k={k} entry={e} slot={BOOKS[k]} stickers={stickers?.[k]} paper={paper} />
      ))}
    </>
  )
}

type Placed = { tex: StickerTexture; u: number; v: number; rot: number; w: number; h: number; p: number; target: number; showAt: number }

function Book({ k, entry, slot, stickers, paper }: { k: number; entry: ResumeEntry; slot: BookSlot; stickers?: StickerTexture[]; paper: THREE.Texture }) {
  const T = slot.thickness
  const color = useMemo(() => shadeOf(CLOTH[entry.chapter], ((k * 37) % 7) / 100 - 0.03), [entry.chapter, k])
  const root = useRef<THREE.Group>(null!)
  const cover = useRef<THREE.Group>(null!)
  const meshes = useRef<THREE.Mesh[]>([])

  // Printed textures: spine + inside-cover page now, front cover once the stickers exist
  const spine = useMemo(() => makeSpine(entry.spine, color, T / H), [entry.spine, color, T])
  const heading = useMemo(() => makeHeading(entry, k, RESUME.length, W / H), [entry, k])
  const coverTex = useMemo(() => makeCover(entry.title, entry.org, color, stickers?.[0], W / H), [entry, color, stickers])
  useEffect(() => () => { spine.dispose(); heading.dispose() }, [spine, heading])
  useEffect(() => () => coverTex.dispose(), [coverTex])

  // Stickers packed onto the right-hand page
  const placed = useMemo<Placed[] | null>(() => {
    if (!stickers) return null
    const slotRect = { u: 0, v: 0, w: (W - 0.03) * 0.86, h: (H - 0.03) * 0.86 }
    return pack(slotRect, stickers, rng(k * 97 + 13)).map((p, i) => ({
      tex: stickers[i], u: p.u, v: p.v, rot: p.rot, w: stickers[i].width * p.scale, h: stickers[i].height * p.scale, p: 0, target: 0, showAt: 0,
    }))
  }, [stickers, k])

  const outPos = useMemo(() => slot.shelf.clone().add(new THREE.Vector3(0, 0, PULL)), [slot])

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime
    const { out, open } = bookTimeline(rig.t, k)
    const g = root.current

    // Slide straight out, then fly to the front turning to face the camera
    if (out < 0.3) {
      g.position.lerpVectors(slot.shelf, outPos, smooth(out / 0.3))
      g.rotation.set(0, Math.PI / 2, 0)
    } else {
      const b = smooth((out - 0.3) / 0.7)
      g.position.lerpVectors(outPos, slot.present, b)
      g.position.y += Math.sin(Math.PI * b) * 0.15
      g.rotation.set(-0.06 * b, (Math.PI / 2) * (1 - b), 0)
    }
    // Opening: slide right by half a page so the open spread stays centred
    g.position.x += (W / 2) * open * (out > 0.99 ? 1 : out)
    g.position.y += Math.sin(now * 1.3 + k) * 0.008 * out // gentle float while out
    cover.current.rotation.y = -OPEN_ANGLE * open

    if (!placed) return
    const show = open > 0.7
    placed.forEach((it, j) => {
      if (show && it.target === 0) { it.target = 1; it.showAt = now + j * STAGGER }
      if (!show) it.target = 0
      if (it.target === 1 && now >= it.showAt) it.p = Math.min(1, it.p + dt * SLAP_SPEED)
      else if (it.target === 0) it.p = Math.max(0, it.p - dt * PEEL_SPEED)
      const m = meshes.current[j]
      if (!m) return
      m.visible = it.p > 0.001
      const e = it.target === 1 ? easeOutBack(it.p) : it.p
      m.scale.set(it.w * e, it.h * e, 1)
      m.rotation.z = it.rot + (1 - it.p) * 0.5
      m.position.z = 0.001 + j * 0.0004 + (1 - it.p) * 0.04
    })
  })

  const cloth = <meshStandardMaterial color={color} roughness={0.8} />
  const pageZ = T / 2 - COVER_T + 0.0005

  return (
    <group ref={root} position={slot.shelf} rotation={[0, Math.PI / 2, 0]}>
      {/* Back cover */}
      <mesh position={[0, 0, -T / 2 + COVER_T / 2]} castShadow>
        <boxGeometry args={[W, H, COVER_T]} />
        {cloth}
      </mesh>
      {/* Page block */}
      <mesh position={[0.01, 0, 0]}>
        <boxGeometry args={[W - 0.02, H - 0.02, T - COVER_T * 2]} />
        <meshStandardMaterial color={PAGE_COLOR} roughness={0.95} />
      </mesh>
      {/* Spine (its outer face, -x, carries the printed label) */}
      <mesh position={[-W / 2 + COVER_T / 2, 0, 0]} castShadow>
        <boxGeometry args={[COVER_T, H, T]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} {...(i === 1 ? { map: spine } : { color })} roughness={0.8} />
        ))}
      </mesh>
      {/* Right-hand page, with stickers */}
      <group position={[0.01, 0, pageZ]}>
        <mesh>
          <planeGeometry args={[W - 0.03, H - 0.03]} />
          <meshStandardMaterial map={paper} roughness={0.95} emissive="#ffffff" emissiveMap={paper} emissiveIntensity={0.08} />
        </mesh>
        {placed?.map((it, j) => (
          <mesh key={j} ref={(m) => { if (m) meshes.current[j] = m }} position={[it.u, it.v, 0.001]} visible={false}>
            <planeGeometry />
            <meshStandardMaterial map={it.tex.texture} emissiveMap={it.tex.texture} emissive="#ffffff" emissiveIntensity={0.2} alphaTest={0.5} roughness={0.5} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
        ))}
      </group>
      {/* Front cover, hinged at the spine: outside = cover art, inside = the printed entry */}
      <group ref={cover} position={[-W / 2, 0, T / 2 - COVER_T / 2]}>
        <mesh position={[W / 2, 0, 0]} castShadow>
          <boxGeometry args={[W, H, COVER_T]} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <meshStandardMaterial
              key={i}
              attach={`material-${i}`}
              {...(i === 4 ? { map: coverTex } : i === 5 ? { map: heading, emissive: '#ffffff', emissiveMap: heading, emissiveIntensity: 0.08 } : { color })}
              roughness={i === 5 ? 0.95 : 0.8}
            />
          ))}
        </mesh>
      </group>
    </group>
  )
}
