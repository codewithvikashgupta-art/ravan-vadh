import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';

/**
 * The world: a stylised ancient Lanka of golden palaces, a temple-lit
 * battlefield, a shifting sky dome, drifting embers and dust, and foreground
 * temple lamps (diyas) that provide Ultra View depth-of-field bokeh.
 *
 * The sky colour is driven by the current scene so the story progresses from a
 * warm devotional dawn, into a dark stormy battle night, and finally into a
 * radiant golden dawn of victory.
 */

// Sky colour keyframes per scene (top + horizon).
const SKY = [
  { top: '#0a0a1e', horizon: '#3a2a5a' }, // 0 opening night
  { top: '#2a1c3a', horizon: '#d98a3a' }, // 1 puja dawn
  { top: '#3a2440', horizon: '#e8a94a' }, // 2 hanuman
  { top: '#241830', horizon: '#c96a2a' }, // 3 war prep
  { top: '#140c1c', horizon: '#5a1a1a' }, // 4 ravan entrance
  { top: '#0c0a16', horizon: '#3a1020' }, // 5 first arrow
  { top: '#0a0814', horizon: '#2a0e1a' }, // 6 arrow battles
  { top: '#060410', horizon: '#1a0a18' }, // 7 battle peak
  { top: '#1a1030', horizon: '#7a4a2a' }, // 8 final arrow (brightening)
  { top: '#2a1c40', horizon: '#e8b04a' }, // 9 ravan vadh golden
  { top: '#1a2050', horizon: '#ff9a3a' }, // 10 fireworks
  { top: '#2a2450', horizon: '#ffcf7a' }, // 11 ending golden peace
];

function Sky() {
  const mat = useRef();
  const cTop = useMemo(() => new THREE.Color(), []);
  const cHor = useMemo(() => new THREE.Color(), []);
  const prevTop = useMemo(() => new THREE.Color(SKY[0].top), []);
  const prevHor = useMemo(() => new THREE.Color(SKY[0].horizon), []);

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(SKY[0].top) },
      uHorizon: { value: new THREE.Color(SKY[0].horizon) },
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    const i = Math.max(0, Math.min(SKY.length - 1, director.sceneIndex));
    const j = Math.min(SKY.length - 1, i + 1);
    const f = director.sceneProgress;
    cTop.set(SKY[i].top).lerp(prevTop.copy(SKY[j].top), f);
    cHor.set(SKY[i].horizon).lerp(prevHor.copy(SKY[j].horizon), f);
    uniforms.uTop.value.copy(cTop);
    uniforms.uHorizon.value.copy(cHor);
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  const vert = /* glsl */ `
    varying vec3 vWorld;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;
  const frag = /* glsl */ `
    varying vec3 vWorld;
    uniform vec3 uTop;
    uniform vec3 uHorizon;
    uniform float uTime;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    void main() {
      vec3 dir = normalize(vWorld);
      float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
      vec3 col = mix(uHorizon, uTop, pow(h, 0.75));
      // Star field that fades in toward the top.
      vec2 uv = vec2(atan(dir.x, dir.z), asin(dir.y));
      vec2 grid = floor(uv * 90.0);
      float star = step(0.985, hash(grid));
      float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + hash(grid) * 40.0);
      col += vec3(1.0, 0.95, 0.85) * star * twinkle * smoothstep(0.1, 0.6, h) * 0.8;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-1}>
      <sphereGeometry args={[400, 32, 32]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

/** Golden palace / temple block, instanced into a skyline. */
function Palace({ position, scale = 1, rotY = 0 }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 4, 5]} />
        <meshStandardMaterial color="#caa04a" metalness={0.6} roughness={0.4} emissive="#3a2a08" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 5, 0]} castShadow>
        <coneGeometry args={[4.4, 3, 4]} />
        <meshStandardMaterial color="#e0b85a" metalness={0.7} roughness={0.3} emissive="#4a3410" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 6.8, 0]}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color="#ffe08a" emissive="#ffcf5a" emissiveIntensity={1.6} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Glowing windows */}
      {[-1.6, 0, 1.6].map((x) => (
        <mesh key={x} position={[x, 2, 2.51]}>
          <planeGeometry args={[0.9, 1.4]} />
          <meshStandardMaterial color="#ffcf5a" emissive="#ffb03a" emissiveIntensity={1.4} />
        </mesh>
      ))}
    </group>
  );
}

/** A burning temple lamp / diya with a flickering flame. */
function Diya({ position, scale = 1 }) {
  const flame = useRef();
  const light = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flick = 0.8 + Math.sin(t * 12 + position[0]) * 0.15 + Math.sin(t * 27) * 0.1;
    if (flame.current) {
      flame.current.scale.set(1, flick, 1);
      flame.current.material.emissiveIntensity = 2.5 * flick;
    }
    if (light.current) light.current.intensity = 6 * flick;
  });
  return (
    <group position={position} scale={scale}>
      {/* Oil bowl */}
      <mesh castShadow>
        <cylinderGeometry args={[0.16, 0.1, 0.1, 16]} />
        <meshStandardMaterial color="#8a5a20" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Flame */}
      <mesh ref={flame} position={[0, 0.18, 0]}>
        <coneGeometry args={[0.06, 0.24, 10]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ff9a2a" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.3, 0]} color="#ffb04a" intensity={6} distance={6} decay={2} />
    </group>
  );
}

/** Ground plane with a subtle battlefield scorch pattern. */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[220, 220, 1, 1]} />
      <meshStandardMaterial color="#3a2c22" roughness={0.95} metalness={0.05} />
    </mesh>
  );
}

/** Distant mountain silhouettes framing Lanka. */
function Mountains() {
  const peaks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 14; i++) {
      const x = -120 + i * 18 + (Math.random() - 0.5) * 8;
      const z = -110 - Math.random() * 40;
      const h = 18 + Math.random() * 30;
      arr.push({ x, z, h, w: 20 + Math.random() * 16 });
    }
    return arr;
  }, []);
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, p.h / 2 - 2, p.z]}>
          <coneGeometry args={[p.w / 2, p.h, 5]} />
          <meshStandardMaterial color="#1a1226" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export default function Environment() {
  const group = useRef();
  const palaces = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 9; i++) {
      const x = -40 + i * 10 + (Math.random() - 0.5) * 4;
      const z = -55 - Math.random() * 18;
      const s = 1.4 + Math.random() * 1.4;
      arr.push({ x, z, s });
    }
    return arr;
  }, []);

  // Foreground diyas positioned to create bokeh in Ultra View close-ups.
  const diyas = useMemo(
    () => [
      [-6.4, 0.2, 2.6],
      [-2.4, 0.2, 3.0],
      [-5.0, 0.2, 1.4],
      [-3.4, 0.2, -1.6],
      [1.2, 0.2, 2.4],
      [3.6, 0.2, 1.2],
      [5.6, 0.2, -2.2],
    ],
    []
  );

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.002;
  });

  return (
    <group ref={group}>
      <Sky />
      <fogExp2 attach="fog" args={['#160e22', 0.011]} />
      <Ground />
      <Mountains />

      {/* Lanka skyline */}
      {palaces.map((p, i) => (
        <Palace key={i} position={[p.x, 0, p.z]} scale={p.s} rotY={Math.random() * Math.PI} />
      ))}

      {/* Giant gateway behind the battlefield */}
      <group position={[0, 0, -30]}>
        <mesh position={[-6, 6, 0]} castShadow>
          <boxGeometry args={[2.4, 12, 2.4]} />
          <meshStandardMaterial color="#b8903a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[6, 6, 0]} castShadow>
          <boxGeometry args={[2.4, 12, 2.4]} />
          <meshStandardMaterial color="#b8903a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 12.5, 0]} castShadow>
          <boxGeometry args={[16, 2, 2.6]} />
          <meshStandardMaterial color="#d0a84a" metalness={0.7} roughness={0.3} emissive="#3a2a08" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 14.2, 0]}>
          <coneGeometry args={[4, 2.4, 4]} />
          <meshStandardMaterial color="#e0b85a" metalness={0.7} roughness={0.3} emissive="#4a3410" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Temple lamps */}
      {diyas.map((d, i) => (
        <Diya key={i} position={d} scale={1 + (i % 3) * 0.2} />
      ))}

      {/* Flags lining the battlefield */}
      {[-12, -8, 8, 12].map((x, i) => (
        <group key={i} position={[x, 0, -14]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 6, 6]} />
            <meshStandardMaterial color="#7a5a20" />
          </mesh>
          <Flag position={[0.6, 5.2, 0]} phase={i} />
        </group>
      ))}

      {/* Key + rim lighting */}
      <ambientLight intensity={0.25} color="#5a4a7a" />
      <directionalLight
        position={[14, 18, 10]}
        intensity={1.6}
        color="#ffcf8a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <pointLight position={[0, 14, -20]} intensity={60} color="#ff7a3a" distance={80} decay={2} />
      <hemisphereLight args={['#4a3a6a', '#201408', 0.5]} />
    </group>
  );
}

/** A waving cloth flag. */
function Flag({ position, phase = 0 }) {
  const ref = useRef();
  const geo = useMemo(() => new THREE.PlaneGeometry(1.4, 0.9, 12, 6), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, Math.sin(x * 3 + t * 4 + phase) * 0.12 * (x + 0.7));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return (
    <mesh ref={ref} geometry={geo} position={position}>
      <meshStandardMaterial color="#e83a3a" side={THREE.DoubleSide} roughness={0.7} />
    </mesh>
  );
}
