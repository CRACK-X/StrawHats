'use client';

import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  const bodyColor = useMemo(() => (hovered ? '#22d3ee' : '#0891b2'), [hovered]);

  return (
    <group ref={groupRef}>
      {/* Main hull - rounded box shape */}
      <mesh
        position={[0, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[2.2, 1.2, 1.6]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      {/* Top dome / viewport */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#164e63"
          metalness={0.85}
          roughness={0.15}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Front face plate */}
      <mesh position={[0, 0, 0.81]}>
        <boxGeometry args={[1.8, 0.9, 0.02]} />
        <meshStandardMaterial color="#155e75" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Camera housing */}
      <mesh position={[0.5, 0.15, 0.9]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Camera lens */}
      <mesh position={[0.5, 0.15, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.15, 16]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>

      {/* Left manipulator arm */}
      <group position={[-1.3, -0.1, 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.2, 1.0]} />
          <meshStandardMaterial color="#0e7490" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.6]}>
          <boxGeometry args={[0.15, 0.15, 0.3]} />
          <meshStandardMaterial color="#155e75" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Right manipulator arm */}
      <group position={[1.3, -0.1, 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.2, 1.0]} />
          <meshStandardMaterial color="#0e7490" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.6]}>
          <boxGeometry args={[0.15, 0.15, 0.3]} />
          <meshStandardMaterial color="#155e75" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Left side thruster */}
      <mesh position={[-1.1, -0.5, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.18, 0.5, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right side thruster */}
      <mesh position={[1.1, -0.5, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.18, 0.5, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Rear vertical thruster */}
      <mesh position={[0, -0.6, -0.5]} castShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.35, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Top lights bar */}
      <mesh position={[0, 0.55, 0.75]}>
        <boxGeometry args={[1.2, 0.08, 0.08]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Headlights */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.82]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={hovered ? 1.2 : 0.6}
          />
        </mesh>
      ))}

      {/* Bottom frame rails */}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, -0.65, 0]}>
          <boxGeometry args={[0.08, 0.08, 1.8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Side panels */}
      {[-1.12, 1.12].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.04, 0.9, 1.4]} />
          <meshStandardMaterial color="#155e75" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export default function Robot3D() {
  return (
    <div className="w-full h-[400px] md:h-[500px]">
      <Canvas
        camera={{ position: [3.5, 2.5, 3.5], fov: 45 }}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ failIfMajorPerformanceCaveat: false }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-4, 2, -4]} intensity={0.4} color="#67e8f9" />
        <pointLight position={[2, -2, 4]} intensity={0.3} color="#fbbf24" />

        <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.4}>
          <Robot />
        </Float>

        <ContactShadows
          position={[0, -1.2, 0]}
          opacity={0.4}
          scale={6}
          blur={2.5}
          far={4}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
