import { useMemo } from 'react'
import * as THREE from 'three'
import { BOOK, SHELF, bayUsed } from './layout'
import { rng } from './pack'
import { makeWood } from './stickers'

const WOOD = '#5c3b22'
const BACK = '#2c1b10'
const WALL = '#16120f'
const BRASS = '#c29a4a'
// Muted cloth colours for the filler books
const FILLER = ['#3d4a5c', '#5a3a2c', '#2f4a3c', '#6b5a3a', '#4a3a55', '#7a6a58', '#2c3440', '#5c2f2f', '#8a7a5a']

const { z: Z, depth: DEPTH, width: WIDTH, board: B, boards: BOARDS, dividers: DIV } = SHELF
const TOP = BOARDS[BOARDS.length - 1]
const FRONT = Z + DEPTH / 2

/** Plain decorative books filling the rest of each bay after the real ones */
function useFillers() {
  return useMemo(() => {
    const rand = rng(7)
    const out: { pos: [number, number, number]; size: [number, number, number]; color: string; tilt: number }[] = []
    for (const bay of [0, 2]) {
      for (const row of [1, 2]) {
        let x = DIV[bay] + B / 2 + 0.12 + bayUsed(bay, row) + 0.02
        const end = DIV[bay + 1] - B / 2 - 0.05
        while (x < end - 0.05) {
          const t = 0.045 + rand() * 0.05
          const h = BOOK.h * (0.72 + rand() * 0.25)
          if (x + t > end) break
          out.push({ pos: [x + t / 2, BOARDS[row] + h / 2, Z + 0.02], size: [t, h, BOOK.w * (0.8 + rand() * 0.15)], color: FILLER[Math.floor(rand() * FILLER.length)], tilt: 0 })
          x += t + 0.006
        }
      }
    }
    return out
  }, [])
}

function Trophy({ x }: { x: number }) {
  const cup = useMemo(() => {
    const pts = [[0, 0], [0.05, 0], [0.06, 0.02], [0.03, 0.05], [0.025, 0.12], [0.07, 0.16], [0.11, 0.26], [0.12, 0.32], [0.115, 0.33]]
    return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 48)
  }, [])
  const gold = <meshStandardMaterial color="#d8b04a" metalness={1} roughness={0.25} />
  return (
    <group position={[x, TOP, Z]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.2]} />
        <meshStandardMaterial color="#1b1b1f" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1, 0]} geometry={cup} castShadow>{gold}</mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0.34, 0]} rotation-z={s * 0.2}>
          <torusGeometry args={[0.05, 0.01, 8, 24, Math.PI * 1.2]} />
          {gold}
        </mesh>
      ))}
    </group>
  )
}

/** The room: a wall, a wooden bookshelf with cupboards, filler books, decor, trophies on top and a warm lamp */
export function Bookshelf() {
  const wood = useMemo(() => makeWood(WOOD), [])
  const fillers = useFillers()
  const woodMat = <meshStandardMaterial map={wood} roughness={0.7} />

  return (
    <group>
      {/* Wall */}
      <mesh position={[0, 4, Z - DEPTH / 2 - 0.02]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color={WALL} roughness={1} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, TOP / 2, Z - DEPTH / 2 + 0.005]} receiveShadow>
        <planeGeometry args={[WIDTH, TOP]} />
        <meshStandardMaterial color={BACK} roughness={0.9} />
      </mesh>
      {/* Plinth + horizontal boards (the top one slightly wider, like a cornice) */}
      <mesh position={[0, 0.1, Z]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH + 0.06, 0.2, DEPTH + 0.04]} />
        {woodMat}
      </mesh>
      {BOARDS.map((y, i) => (
        <mesh key={y} position={[0, y - B / 2, Z]} castShadow receiveShadow>
          <boxGeometry args={[i === BOARDS.length - 1 ? WIDTH + 0.1 : WIDTH, B, i === BOARDS.length - 1 ? DEPTH + 0.06 : DEPTH]} />
          {woodMat}
        </mesh>
      ))}
      {/* Uprights */}
      {DIV.map((x) => (
        <mesh key={x} position={[x, TOP / 2, Z]} castShadow receiveShadow>
          <boxGeometry args={[B, TOP, DEPTH]} />
          {woodMat}
        </mesh>
      ))}
      {/* Cupboard doors along the bottom */}
      {[0, 1, 2].map((bay) => {
        const cx = (DIV[bay] + DIV[bay + 1]) / 2, w = DIV[bay + 1] - DIV[bay] - B - 0.02
        const h = BOARDS[1] - BOARDS[0] - B - 0.04
        return (
          <group key={bay} position={[cx, BOARDS[0] + (BOARDS[1] - B - BOARDS[0]) / 2, FRONT - 0.01]}>
            {[-1, 1].map((s) => (
              <group key={s}>
                <mesh position={[(s * w) / 4, 0, 0]} castShadow>
                  <boxGeometry args={[w / 2 - 0.01, h, 0.025]} />
                  {woodMat}
                </mesh>
                <mesh position={[s * 0.05, 0.05, 0.025]}>
                  <sphereGeometry args={[0.018, 16, 16]} />
                  <meshStandardMaterial color={BRASS} metalness={1} roughness={0.3} />
                </mesh>
              </group>
            ))}
          </group>
        )
      })}

      {/* Filler books + a bookend at the start of each bay */}
      {fillers.map((f, i) => (
        <mesh key={i} position={f.pos} castShadow>
          <boxGeometry args={f.size} />
          <meshStandardMaterial color={f.color} roughness={0.8} />
        </mesh>
      ))}
      {[0, 2].flatMap((bay) => [1, 2].map((row) => (
        <mesh key={`${bay}${row}`} position={[DIV[bay] + B / 2 + 0.06, BOARDS[row] + 0.12, Z + 0.02]} castShadow>
          <boxGeometry args={[0.07, 0.24, 0.18]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.3} roughness={0.5} />
        </mesh>
      )))}

      {/* Middle bay (behind the avatar): a plant up top, a globe and a book stack below */}
      <group position={[0, BOARDS[2], Z]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.1, 0.24, 24]} />
          <meshStandardMaterial color="#c9b8a0" roughness={0.8} />
        </mesh>
        {[[0, 0.42, 0, 0.2], [-0.13, 0.34, 0.05, 0.14], [0.14, 0.36, -0.03, 0.15], [0.02, 0.58, 0.02, 0.13]].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color={i % 2 ? '#3f6b3a' : '#4d7c44'} roughness={0.8} flatShading />
          </mesh>
        ))}
      </group>
      <group position={[0, BOARDS[1], Z]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-0.25, 0.03 + i * 0.06, 0]} rotation-y={i * 0.15} castShadow>
            <boxGeometry args={[0.42, 0.055, 0.3]} />
            <meshStandardMaterial color={FILLER[i + 3]} roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0.25, 0.32, 0]} castShadow>
          <sphereGeometry args={[0.16, 32, 32]} />
          <meshStandardMaterial color="#2f5d7c" roughness={0.5} />
        </mesh>
        <mesh position={[0.25, 0.07, 0]}>
          <cylinderGeometry args={[0.02, 0.09, 0.14, 16]} />
          <meshStandardMaterial color={BRASS} metalness={1} roughness={0.3} />
        </mesh>
      </group>

      {/* Trophy shelf on top */}
      <Trophy x={-1.4} />
      <Trophy x={1.4} />
      <group position={[0, TOP, Z]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.03, 40]} />
          <meshStandardMaterial color="#d8b04a" metalness={1} roughness={0.3} />
        </mesh>
      </group>

      {/* Warm lamp glow over the shelf */}
      <pointLight position={[0, 3.7, -0.3]} color="#ffcf94" intensity={6} distance={7} decay={1.6} />
      <pointLight position={[-1.4, 2.9, -0.6]} color="#ffd9a8" intensity={1.5} distance={3} decay={2} />
      <pointLight position={[1.4, 2.9, -0.6]} color="#ffd9a8" intensity={1.5} distance={3} decay={2} />
    </group>
  )
}
