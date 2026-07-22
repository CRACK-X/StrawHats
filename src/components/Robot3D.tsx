'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Environment } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function RoverModel({ mouse }: { mouse: THREE.Vector2 }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/rov.glb');

  const targetRotY = useRef(0);
  const targetRotX = useRef(0);
  const currentRotY = useRef(0);
  const currentRotX = useRef(0);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.metalness !== undefined) {
            mat.metalness = Math.min(mat.metalness + 0.1, 1);
            mat.roughness = Math.max(mat.roughness - 0.05, 0);
          }
        }
      }
    });
  }, [scene]);

  useFrame(() => {
    targetRotY.current = mouse.x * 0.3;
    targetRotX.current = -mouse.y * 0.15;

    currentRotY.current = THREE.MathUtils.lerp(currentRotY.current, targetRotY.current, 0.05);
    currentRotX.current = THREE.MathUtils.lerp(currentRotX.current, targetRotX.current, 0.05);

    if (groupRef.current) {
      groupRef.current.rotation.y = currentRotY.current;
      groupRef.current.rotation.x = currentRotX.current;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive ref={headRef} object={scene} scale={1.5} />
    </group>
  );
}

function MouseTracker({ mouse }: { mouse: THREE.Vector2 }) {
  const { viewport } = useThree();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouse, viewport]);

  return null;
}

function LoadingFallback() {
  return (
    <div className="w-full h-[400px] md:h-[500px] bg-slate-800/50 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading 3D Model...</p>
      </div>
    </div>
  );
}

export default function Robot3D() {
  const mouse = useRef(new THREE.Vector2(0, 0));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingFallback />;

  return (
    <div className="w-full h-[400px] md:h-[500px] relative">
      <Canvas
        camera={{ position: [4, 3, 5], fov: 40 }}
        shadows="soft"
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
      >
        <MouseTracker mouse={mouse.current} />

        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
        />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#67e8f9" />
        <pointLight position={[3, -2, 5]} intensity={0.3} color="#22d3ee" />
        <spotLight
          position={[0, 5, 0]}
          angle={0.5}
          penumbra={1}
          intensity={0.4}
          color="#06b6d4"
        />

        <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
          <RoverModel mouse={mouse.current} />
        </Float>

        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.5}
          scale={8}
          blur={2.5}
          far={4}
        />

        <Environment preset="night" environmentIntensity={0.4} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate
          autoRotateSpeed={0.3}
        />

        <fog attach="fog" args={['#0f172a', 10, 25]} />
      </Canvas>

      {/* Glow effect overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-cyan-500/5 via-transparent to-transparent" />
    </div>
  );
}

useGLTF.preload('/models/rov.glb');
