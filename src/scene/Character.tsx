import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { HEAD } from './layout'

const SKIN = '#b98462'
const SHIRT = '#1f2a44'
const EYE_RANGE = 0.35 // max eye rotation (rad)
const HEAD_FOLLOW = 0.35 // how much the head follows the eyes

/** A stylised, fully procedural character whose eyes & head track the cursor. */
export function Character() {
  const head = useRef<THREE.Group>(null!)
  const eyes = [useRef<THREE.Group>(null!), useRef<THREE.Group>(null!)]
  const body = useRef<THREE.Group>(null!)
  const blink = useRef({ next: 2, t: 0 })
  const lids = [useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!)]
  const aim = useMemo(() => new THREE.Vector2(), [])

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime
    aim.lerp(state.pointer, 1 - Math.exp(-8 * dt))

    // Idle breathing
    body.current.position.y = Math.sin(time * 1.4) * 0.015
    body.current.scale.setScalar(1 + Math.sin(time * 1.4) * 0.006)

    // Head turns part of the way, eyes do the rest
    head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, aim.x * EYE_RANGE * HEAD_FOLLOW, 4, dt)
    head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, -aim.y * EYE_RANGE * HEAD_FOLLOW, 4, dt)
    for (const e of eyes) {
      e.current.rotation.y = aim.x * EYE_RANGE
      e.current.rotation.x = -aim.y * EYE_RANGE
    }

    // Blinking
    const b = blink.current
    if (time > b.next) { b.t = time; b.next = time + 2 + Math.random() * 4 }
    const k = Math.max(0, 1 - Math.abs(time - b.t - 0.08) / 0.08)
    for (const l of lids) l.current.scale.y = 0.02 + k
  })

  const skin = <meshPhysicalMaterial color={SKIN} roughness={0.55} sheen={1} sheenColor="#e0a582" />

  return (
    <group ref={body}>
      {/* Torso */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.42, 0.7, 8, 24]} />
        <meshPhysicalMaterial color={SHIRT} roughness={0.8} sheen={0.6} sheenColor="#8fa6ff" />
      </mesh>
      {/* Shirt collar */}
      <mesh position={[0, 1.08, 0.04]} rotation-x={-0.2}>
        <coneGeometry args={[0.2, 0.22, 24, 1, true]} />
        <meshStandardMaterial color="#e8ecf4" roughness={0.7} side={2} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 16]} />
        {skin}
      </mesh>
      <group ref={head} position={HEAD}>
        <mesh castShadow>
          <sphereGeometry args={[0.38, 48, 48]} />
          {skin}
        </mesh>
        {/* Hair cap */}
        <mesh position={[0, 0.07, -0.03]} rotation={[-0.25, 0, 0]}>
          <sphereGeometry args={[0.4, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
          <meshStandardMaterial color="#1c1a22" roughness={0.9} />
        </mesh>
        {[-1, 1].map((s, i) => (
          <group key={s} position={[s * 0.13, 0.02, 0.31]}>
            <group ref={eyes[i]}>
              <mesh>
                <sphereGeometry args={[0.075, 32, 32]} />
                <meshPhysicalMaterial color="white" roughness={0.1} clearcoat={1} />
              </mesh>
              <mesh position={[0, 0, 0.062]}>
                <sphereGeometry args={[0.038, 24, 24]} />
                <meshStandardMaterial color="#141414" roughness={0.2} />
              </mesh>
              <mesh position={[0.012, 0.014, 0.095]}>
                <sphereGeometry args={[0.009, 8, 8]} />
                <meshBasicMaterial color="white" toneMapped={false} />
              </mesh>
            </group>
            {/* Eyelid (scales down to blink) */}
            <mesh ref={lids[i]} position={[0, 0.07, 0.02]} scale={[1, 0.02, 1]}>
              <boxGeometry args={[0.17, 0.16, 0.12]} />
              {skin}
            </mesh>
          </group>
        ))}
        {/* Glasses */}
        <group position={[0, 0.02, 0.43]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.13, 0, 0]}>
              <torusGeometry args={[0.095, 0.011, 12, 40]} />
              <meshStandardMaterial color="#141418" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          <mesh rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.008, 0.008, 0.07, 8]} />
            <meshStandardMaterial color="#141418" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
        {/* Smile */}
        <mesh position={[0, -0.13, 0.33]} rotation={[0.3, 0, Math.PI]}>
          <torusGeometry args={[0.06, 0.012, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#9c4a4a" />
        </mesh>
      </group>
    </group>
  )
}
