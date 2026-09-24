import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { ANCHORS } from './layout'

const COLORS = ['#8fb8ff', '#ffb38f', '#a8f0c6', '#e0b0ff', '#ffe28f', '#8ff0f0']

function Shape({ i }: { i: number }) {
  switch (i % 4) {
    case 0: return <icosahedronGeometry args={[0.38, 0]} />
    case 1: return <torusKnotGeometry args={[0.25, 0.08, 128, 16]} />
    case 2: return <octahedronGeometry args={[0.4, 0]} />
    default: return <torusGeometry args={[0.3, 0.1, 24, 64]} />
  }
}

/** One floating object per resume entry; the active one glows (picked up by Bloom). */
export function Anchors() {
  return (
    <>
      {ANCHORS.map((p, i) => <Anchor key={i} i={i} position={p} />)}
    </>
  )
}

function Anchor({ i, position }: { i: number; position: THREE.Vector3 }) {
  const mat = useRef<THREE.MeshPhysicalMaterial>(null!)
  const mesh = useRef<THREE.Mesh>(null!)
  const color = COLORS[i % COLORS.length]

  useFrame((_, dt) => {
    const active = useStore.getState().activeEntry === i
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, active ? 2.2 : 0.15, 4, dt)
    mesh.current.rotation.y += dt * (active ? 0.8 : 0.25)
    const s = THREE.MathUtils.damp(mesh.current.scale.x, active ? 1.15 : 1, 4, dt)
    mesh.current.scale.setScalar(s)
  })

  return (
    <Float position={position} speed={1.5} rotationIntensity={0.6} floatIntensity={0.6}>
      <mesh ref={mesh} castShadow>
        <Shape i={i} />
        <meshPhysicalMaterial
          ref={mat}
          color={color}
          emissive={color}
          emissiveIntensity={0.15}
          roughness={0.15}
          metalness={0.1}
          clearcoat={1}
          iridescence={0.6}
        />
      </mesh>
    </Float>
  )
}
