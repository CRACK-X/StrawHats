'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <mesh
        position={[0, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2, 1.5, 1.5]} />
        <meshStandardMaterial
          color={hovered ? '#22d3ee' : '#0891b2'}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Top dome */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color="#164e63"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Camera */}
      <mesh position={[0.8, 0.2, 0.8]}>
        <cylinderGeometry args={[0.15, 0.2, 0.3, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Camera lens */}
      <mesh position={[0.95, 0.2, 0.95]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Left arm */}
      <mesh position={[-1.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.3, 1.5]} />
        <meshStandardMaterial
          color="#0e7490"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Right arm */}
      <mesh position={[1.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.3, 1.5]} />
        <meshStandardMaterial
          color="#0e7490"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Left thruster */}
      <mesh position={[-1.2, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 0.4, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right thruster */}
      <mesh position={[1.2, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 0.4, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Back thruster */}
      <mesh position={[0, -0.3, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.3, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Front lights */}
      <mesh position={[0.5, 0.4, 0.8]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[-0.5, 0.4, 0.8]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

export default function Robot3D() {
  return (
    <div className="w-full h-[400px] md:h-[500px]">
      <Canvas camera={{ position: [4, 2, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <Robot />
        </Float>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        {/* Water effect */}
        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial
            color="#0891b2"
            transparent
            opacity={0.3}
          />
        </mesh>
      </Canvas>
    </div>
  );
}
