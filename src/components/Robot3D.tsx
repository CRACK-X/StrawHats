'use client';

import { useRef, useState, useEffect, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      console.error('3D Canvas error:', this.state.error);
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function HatModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/straw-hat.glb');

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.8} />
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingFallback />;

  return (
    <div className="w-full h-[400px] md:h-[500px] relative">
      <CanvasErrorBoundary fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 2, 6], fov: 35 }}
          shadows="soft"
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
          <pointLight position={[-4, 3, -4]} intensity={0.4} color="#fbbf24" />
          <pointLight position={[3, -2, 4]} intensity={0.3} color="#f59e0b" />

          <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.3}>
            <HatModel />
          </Float>

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={6}
            blur={2.5}
            far={4}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.4}
          />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

useGLTF.preload('/models/straw-hat.glb');
