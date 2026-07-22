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

  const strawColor = '#d4a843';
  const strawDarkColor = '#b8922e';
  const ribbonColor = '#c0392b';

  return (
    <group ref={groupRef} scale={1.4} position={[0, -0.3, 0]}>
      {/* Brim - flat wide disc */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3.2, 3.2, 0.12, 64]} />
        <meshStandardMaterial color={strawColor} roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Brim edge ring */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.2, 0.06, 8, 64]} />
        <meshStandardMaterial color={strawDarkColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Crown - dome shape */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[1.6, 1.8, 1.3, 64]} />
        <meshStandardMaterial color={strawColor} roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Crown top cap */}
      <mesh position={[0, 1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 64]} />
        <meshStandardMaterial color={strawColor} roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Crown top dome */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[1.6, 64, 32, 0, Math.PI * 2, 0, Math.PI / 6]} />
        <meshStandardMaterial color={strawColor} roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Red ribbon band */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.75, 0.12, 8, 64]} />
        <meshStandardMaterial color={ribbonColor} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Straw texture lines on brim */}
      {[...Array(24)].map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.6, 0.07, Math.sin(angle) * 1.6]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.02, 0.02, 3]} />
            <meshStandardMaterial color={strawDarkColor} roughness={0.9} transparent opacity={0.3} />
          </mesh>
        );
      })}
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
