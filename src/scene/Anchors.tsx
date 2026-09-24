import { Billboard, Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { RESUME, type Chapter } from '../data'
import { useStore } from '../store'
import { ANCHORS } from './layout'
import { makeSticker, type StickerTexture } from './stickers'

// Rim colour per chapter
const GLOW: Record<Exclude<Chapter, 'About'>, string> = {
  Education: '#6fa8ff',
  Work: '#ffb45a',
  Recognition: '#ffd84a',
  Toolkit: '#b28cff',
}
const TOKEN_RADIUS = 0.3
const IDLE_GLOW = 0.4
const ACTIVE_GLOW = 3.5 // bloom picks this up
const ACTIVE_SCALE = 1.18

/** Soft radial glow sprite (white; tinted per icon) */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])
}

/** Each entry's icon is its first sticker (reorder `stickers` in data.ts to change it) */
const iconFor = (i: number) => RESUME[i].stickers[0]

/** One floating icon per resume entry; the active one lights up (picked up by Bloom) */
export function Anchors() {
  const [icons, setIcons] = useState<StickerTexture[] | null>(null)
  const glow = useGlowTexture()
  useEffect(() => {
    let alive = true
    let made: StickerTexture[] = []
    Promise.all(RESUME.map((_, i) => makeSticker(iconFor(i)))).then((t) => {
      made = t
      if (alive) setIcons(t)
      else t.forEach((x) => x.texture.dispose())
    })
    return () => {
      alive = false
      made.forEach((x) => x.texture.dispose())
    }
  }, [])

  return (
    <>
      {ANCHORS.map((p, i) => (
        <Anchor key={i} i={i} position={p} icon={icons?.[i]} glow={glow} color={GLOW[RESUME[i].chapter]} />
      ))}
    </>
  )
}

function Anchor({ i, position, icon, glow, color }: { i: number; position: THREE.Vector3; icon?: StickerTexture; glow: THREE.Texture; color: string }) {
  const group = useRef<THREE.Group>(null!)
  const rim = useRef<THREE.MeshStandardMaterial>(null!)
  const face = useRef<THREE.MeshStandardMaterial>(null)
  const halo = useRef<THREE.MeshBasicMaterial>(null!)

  useFrame((_, dt) => {
    const active = useStore.getState().activeEntry === i
    rim.current.emissiveIntensity = THREE.MathUtils.damp(rim.current.emissiveIntensity, active ? ACTIVE_GLOW : IDLE_GLOW, 4, dt)
    halo.current.opacity = THREE.MathUtils.damp(halo.current.opacity, active ? 0.9 : 0, 4, dt)
    if (face.current) face.current.emissiveIntensity = THREE.MathUtils.damp(face.current.emissiveIntensity, active ? 0.4 : 0.2, 4, dt)
    const s = THREE.MathUtils.damp(group.current.scale.x, active ? ACTIVE_SCALE : 1, 4, dt)
    group.current.scale.setScalar(s)
  })

  // Fit the icon inside the token face
  const k = icon ? (TOKEN_RADIUS * 1.45) / Math.max(icon.width, icon.height) : 1

  return (
    <Float position={position} speed={1.4} rotationIntensity={0.25} floatIntensity={0.5}>
      <Billboard>
        <group ref={group}>
          {/* Soft halo behind the token */}
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[TOKEN_RADIUS * 4, TOKEN_RADIUS * 4]} />
            <meshBasicMaterial ref={halo} map={glow} color={color} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          {/* Glossy token */}
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[TOKEN_RADIUS, TOKEN_RADIUS, 0.05, 64]} />
            <meshPhysicalMaterial color="#e9e3d6" roughness={0.4} clearcoat={1} clearcoatRoughness={0.2} />
          </mesh>
          {/* Glowing rim */}
          <mesh>
            <torusGeometry args={[TOKEN_RADIUS, 0.022, 16, 64]} />
            <meshStandardMaterial ref={rim} color={color} emissive={color} emissiveIntensity={IDLE_GLOW} roughness={0.3} toneMapped={false} />
          </mesh>
          {icon && (
            <mesh position={[0, 0, 0.027]} scale={[icon.width * k, icon.height * k, 1]}>
              <planeGeometry />
              <meshStandardMaterial ref={face} map={icon.texture} emissiveMap={icon.texture} emissive="#ffffff" emissiveIntensity={0.25} alphaTest={0.5} roughness={0.5} />
            </mesh>
          )}
        </group>
      </Billboard>
    </Float>
  )
}
