'use client';

import { useRef, useState, useEffect, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      console.error('Robot3D Canvas error:', this.state.error);
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function StrawHat() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef} scale={0.9}>
      {/* Brim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 0.1, 64]} />
        <meshStandardMaterial color="#d4a843" roughness={0.8} />
      </mesh>

      {/* Crown */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[1.4, 1.6, 1.2, 64]} />
        <meshStandardMaterial color="#d4a843" roughness={0.8} />
      </mesh>

      {/* Crown top dome */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[1.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d4a843" roughness={0.8} />
      </mesh>

      {/* Red ribbon */}
      <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.1, 8, 64]} />
        <meshStandardMaterial color="#c0392b" roughness={0.4} />
      </mesh>
    </group>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full h-[400px] md:h-[500px] bg-white/5 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading 3D Model...</p>
      </div>
    </div>
  );
}

export default function Robot3D() {
  const [mounted, setMounted] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
    setMounted(true);
  }, []);

  if (!mounted || !webglSupported) return <LoadingFallback />;

  return (
    <div className="w-full h-[400px] md:h-[500px] relative">
      <CanvasErrorBoundary fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 3, 12], fov: 35 }}
          shadows="soft"
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
          <pointLight position={[-5, 3, -5]} intensity={0.5} color="#fbbf24" />
          <pointLight position={[3, -2, 5]} intensity={0.3} color="#f59e0b" />
          <spotLight position={[0, 6, 0]} angle={0.5} penumbra={1} intensity={0.6} color="#fde68a" />

          <Float speed={1} rotationIntensity={0.05} floatIntensity={0.4}>
            <StrawHat />
          </Float>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </CanvasErrorBoundary>
      <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-amber-500/5 via-transparent to-transparent" />
    </div>
  );
}
