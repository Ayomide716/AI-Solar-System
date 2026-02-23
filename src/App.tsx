import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, Info, Maximize } from 'lucide-react';

const PLANETS = [
  { name: 'Mercury', color: '#8c8c8c', size: 0.4, orbitRadius: 12, speed: 4.15, desc: 'The smallest and innermost planet.' },
  { name: 'Venus', color: '#e0c090', size: 0.9, orbitRadius: 18, speed: 1.62, desc: 'The second planet, known for its dense atmosphere.' },
  { name: 'Earth', color: '#4b90dd', size: 1, orbitRadius: 26, speed: 1, desc: 'Our home planet.' },
  { name: 'Mars', color: '#d14a28', size: 0.5, orbitRadius: 34, speed: 0.53, desc: 'The Red Planet.' },
  { name: 'Jupiter', color: '#d4a373', size: 3.5, orbitRadius: 55, speed: 0.08, desc: 'The largest planet, a gas giant.' },
  { name: 'Saturn', color: '#eaddb5', size: 3, orbitRadius: 75, speed: 0.03, hasRings: true, ringColor: '#cda87c', desc: 'Known for its prominent ring system.' },
  { name: 'Uranus', color: '#a1d8e6', size: 2, orbitRadius: 95, speed: 0.011, hasRings: true, ringColor: '#ffffff', desc: 'An ice giant with a unique sideways rotation.' },
  { name: 'Neptune', color: '#4b70dd', size: 1.9, orbitRadius: 115, speed: 0.006, desc: 'The eighth and farthest known planet.' }
];

function OrbitPath({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * 2 * Math.PI;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
    </line>
  );
}

function AsteroidBelt({ isPaused, timeScale }: { isPaused: boolean, timeScale: number }) {
  const count = 2500;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const matrices = useMemo(() => {
    const arr = new Float32Array(count * 16);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const radius = 42 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3;
      
      dummy.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      const scale = 0.05 + Math.random() * 0.15;
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      dummy.matrix.toArray(arr, i * 16);
    }
    return arr;
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.array = matrices;
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  useFrame((state, delta) => {
    if (meshRef.current && !isPaused) {
      meshRef.current.rotation.y -= delta * 0.05 * timeScale;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#888888" roughness={0.9} />
    </instancedMesh>
  );
}

function Planet({ data, timeScale, isPaused, setSelectedPlanet }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const [angle, setAngle] = useState(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (!isPaused) {
      const speed = data.speed * timeScale * 0.5;
      setAngle((prev) => prev + speed * delta);
      
      if (groupRef.current) {
        groupRef.current.position.x = Math.cos(angle) * data.orbitRadius;
        groupRef.current.position.z = Math.sin(angle) * data.orbitRadius;
      }
      if (planetRef.current) {
        planetRef.current.rotation.y += delta * 0.5 * timeScale;
      }
      if (moonGroupRef.current) {
        moonGroupRef.current.rotation.y += delta * 2 * timeScale;
      }
    }
  });

  return (
    <>
      <OrbitPath radius={data.orbitRadius} />
      <group ref={groupRef}>
        <mesh 
          ref={planetRef} 
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPlanet(data);
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <sphereGeometry args={[data.size, 32, 32]} />
          <meshStandardMaterial color={data.color} roughness={0.7} metalness={0.1} />
        </mesh>
        
        {data.hasRings && (
          <mesh rotation={[Math.PI / 2 + 0.3, 0, 0]}>
            <ringGeometry args={[data.size * 1.4, data.size * 2.2, 64]} />
            <meshStandardMaterial color={data.ringColor} side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        )}

        {data.name === 'Earth' && (
          <group ref={moonGroupRef}>
            <mesh position={[2.5, 0, 0]}>
              <sphereGeometry args={[0.27, 16, 16]} />
              <meshStandardMaterial color="#cccccc" roughness={0.8} />
            </mesh>
          </group>
        )}
        
        <Html distanceFactor={20} position={[0, data.size + 1.5, 0]} center zIndexRange={[100, 0]}>
          <div className="text-white/80 text-xs font-mono bg-black/60 px-2 py-1 rounded backdrop-blur-md border border-white/10 pointer-events-none select-none transition-opacity hover:opacity-100">
            {data.name}
          </div>
        </Html>
      </group>
    </>
  );
}

function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={sunRef}>
      <sphereGeometry args={[6, 64, 64]} />
      <meshBasicMaterial color="#ffcc00" />
      <pointLight intensity={3} distance={400} decay={1.5} color="#ffffff" />
      
      {/* Corona Glow */}
      <mesh>
        <sphereGeometry args={[6.8, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </mesh>
  );
}

export default function App() {
  const [timeScale, setTimeScale] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<any | null>(null);

  return (
    <div className="w-full h-screen bg-[#020202] text-slate-200 overflow-hidden font-sans">
      <Canvas camera={{ position: [0, 80, 120], fov: 45 }}>
        <color attach="background" args={['#020202']} />
        <ambientLight intensity={0.02} />
        <Stars radius={200} depth={100} count={8000} factor={5} saturation={0} fade speed={1} />
        
        <Sun />
        <AsteroidBelt isPaused={isPaused} timeScale={timeScale} />
        
        {PLANETS.map((planet) => (
          <Planet 
            key={planet.name} 
            data={planet} 
            timeScale={timeScale} 
            isPaused={isPaused} 
            setSelectedPlanet={setSelectedPlanet}
          />
        ))}
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          maxDistance={400}
          minDistance={10}
          zoomSpeed={0.8}
          panSpeed={0.5}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-8 left-8 z-20 pointer-events-none">
        <h1 className="text-3xl font-light tracking-[0.2em] uppercase text-white/90 drop-shadow-lg">Solar System 3D</h1>
        <p className="text-slate-400 mt-2 font-mono text-sm tracking-wider">Interactive Simulation</p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
        <button 
          onClick={() => setIsPaused(!isPaused)} 
          className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          title={isPaused ? "Play" : "Pause"}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>
        
        <div className="w-px h-8 bg-white/10 mx-2"></div>
        
        <div className="flex items-center gap-1 px-2">
          {[0.5, 1, 2, 5, 10].map(speed => (
            <button
              key={speed}
              onClick={() => setTimeScale(speed)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeScale === speed 
                  ? 'bg-indigo-500/80 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Info Panel */}
      {selectedPlanet && (
        <div className="absolute top-8 right-8 z-20 w-80 bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-light tracking-wider text-white flex items-center gap-2">
              <Info size={20} className="text-indigo-400" />
              {selectedPlanet.name}
            </h2>
            <button 
              onClick={() => setSelectedPlanet(null)}
              className="text-slate-400 hover:text-white transition-colors text-xl leading-none p-1"
            >
              ×
            </button>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm">
            {selectedPlanet.desc}
          </p>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Orbit Radius</span>
              <span className="font-mono text-slate-200">{selectedPlanet.orbitRadius * 10}M km</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Relative Speed</span>
              <span className="font-mono text-slate-200">{selectedPlanet.speed}x Earth</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Relative Size</span>
              <span className="font-mono text-slate-200">{selectedPlanet.size}x Earth</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-8 right-8 z-20 pointer-events-none flex items-center gap-2 text-slate-500 text-xs font-mono bg-black/40 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/5">
        <Maximize size={14} />
        <span>Scroll to zoom, drag to rotate</span>
      </div>
    </div>
  );
}
