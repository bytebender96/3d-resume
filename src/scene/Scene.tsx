import { ContactShadows, Environment, Lightformer, Sparkles } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing'
import { Suspense, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { DepthOfFieldEffect } from 'postprocessing'
import { Anchors } from './Anchors'
import { CameraRig } from './CameraRig'
import { Character } from './Character'

const BG = '#0b0c12'

/** Points the depth-of-field at the shared focus vector (the effect is created after first render) */
function AutoFocus({ dof, focus }: { dof: RefObject<DepthOfFieldEffect>; focus: THREE.Vector3 }) {
  useFrame(() => {
    if (dof.current && dof.current.target !== focus) dof.current.target = focus
  })
  return null
}

export function Scene() {
  // Shared focus point: CameraRig writes it every frame, DepthOfField reads it (auto-focus)
  const focus = useMemo(() => new THREE.Vector3(0, 1.5, 0), [])
  const dof = useRef<DepthOfFieldEffect>(null)

  return (
    <Canvas
      className="scene"
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 35, near: 0.05, far: 60, position: [-0.9, 1.6, 5.8] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 10, 26]} />

      <CameraRig focus={focus} />
      <AutoFocus dof={dof} focus={focus} />
      <Anchors />
      <Suspense fallback={null}>
        <Character />
      </Suspense>

      <Sparkles count={120} scale={[12, 6, 12]} position={[0, 2.5, 0]} size={1.6} speed={0.25} opacity={0.5} color="#b8c8ff" />
      <ContactShadows position={[0, -0.02, 0]} opacity={0.6} scale={10} blur={2.4} far={3} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.03} receiveShadow>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#12141d" roughness={1} />
      </mesh>

      {/* Soft front fill so the briefcase face reads well in close-ups */}
      <directionalLight position={[-1, 3, 8]} intensity={1.3} color="#fff4e8" />
      <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      {/* Studio-style IBL built from light panels — no HDR download needed */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#ffe6d0" position={[3, 3, 3]} scale={[4, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2} color="#8fa6ff" position={[-4, 2, -2]} scale={[4, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.5} color="#ffb38f" position={[0, 5, -5]} scale={3} target={[0, 0, 0]} />
      </Environment>

      <EffectComposer multisampling={0}>
        <DepthOfField ref={dof} focusRange={1.2} bokehScale={3} height={600} />
        <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} />
        <Vignette offset={0.25} darkness={0.7} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  )
}
