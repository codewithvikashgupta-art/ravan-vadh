import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';
import { audio } from '../audio/AudioEngine';

/**
 * The divine arrow.
 *
 * A luminous arrowhead with a persistent additive trail that flies from Ram
 * (at x = -3.4) toward Ravan (at x = 7). Flight is driven by the scene
 * progress so it is perfectly locked to the master timeline. Multiple flights
 * occur across the battle scenes with a looping sub-timer.
 */

const START = new THREE.Vector3(-3.4, 1.95, 0.2);
const END = new THREE.Vector3(6.7, 2.4, 0.0);

const TRAIL = 40;

export default function DivineArrowEffect() {
  const group = useRef();
  const head = useRef();
  const glow = useRef();
  const trailRef = useRef();

  // Trail positions (a rolling buffer of past head positions).
  const trail = useMemo(() => Array.from({ length: TRAIL }, () => START.clone()), []);

  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    return g;
  }, []);

  const trailMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#ffe6a0',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  const headMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#fff4d0',
        toneMapped: false,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  // Per-scene arrow behaviour: how many flights, and over which progress window.
  const lastFlight = useRef({ scene: -1, fired: 0 });

  useFrame((_, dt) => {
    const cdt = Math.min(dt, 0.05);
    const si = director.sceneIndex;
    const p = director.sceneProgress;

    // Determine whether an arrow is airborne in this scene right now.
    let active = false;
    let flightP = 0;
    let divine = 1;

    if (si === 5) {
      // Single, hero first arrow across the whole scene.
      active = true;
      flightP = THREE.MathUtils.clamp((p - 0.25) / 0.5, 0, 1);
      divine = 1;
      if (flightP >= 1 && lastFlight.current.scene !== 5) {
        lastFlight.current.scene = 5;
        audio.impact({ gain: 0.9, dur: 0.7 });
        director.triggerImpact(1);
        director.triggerFlash(0.8);
      }
    } else if (si === 6) {
      // Rapid successive volleys — four flights across the scene.
      const flights = 4;
      const seg = p * flights;
      const idx = Math.floor(seg);
      flightP = seg - idx;
      active = true;
      divine = 0.8;
      if (flightP < 0.02 && lastFlight.current.fired !== idx) {
        lastFlight.current.fired = idx;
        audio.arrowRelease({ gain: 0.5, dur: 0.6 });
      }
      if (flightP > 0.96 && lastFlight.current.scene !== 60 + idx) {
        lastFlight.current.scene = 60 + idx;
        audio.impact({ gain: 0.5, dur: 0.4 });
        director.triggerImpact(0.5);
      }
    } else if (si === 8) {
      // The slow, divine final arrow — golden-white and unmistakable.
      active = true;
      flightP = THREE.MathUtils.clamp((p - 0.45) / 0.5, 0, 1);
      divine = 2.2;
      if (flightP > 0 && lastFlight.current.scene !== 8 && flightP < 0.05) {
        lastFlight.current.scene = 8;
        audio.arrowRelease({ gain: 0.9, dur: 1.1 });
      }
      if (flightP >= 1 && lastFlight.current.scene !== 81) {
        lastFlight.current.scene = 81;
        audio.impact({ gain: 1, dur: 1.2 });
        director.triggerImpact(2);
        director.triggerFlash(1.6);
      }
    } else if (si === 9) {
      // The moment of impact lives at the very start of the defeat scene.
      active = p < 0.2;
      flightP = 1;
      divine = 2.2;
    }

    if (!active) {
      trailMat.opacity = THREE.MathUtils.lerp(trailMat.opacity, 0, 0.1);
      headMat.opacity = THREE.MathUtils.lerp(headMat.opacity, 0, 0.15);
      if (glow.current) glow.current.material.opacity = THREE.MathUtils.lerp(glow.current.material.opacity, 0, 0.15);
      return;
    }

    // Ease the flight for a cinematic arc (slow start, fast middle, settle).
    const eased = flightP < 0.5 ? 2 * flightP * flightP : 1 - Math.pow(-2 * flightP + 2, 2) / 2;

    const pos = START.clone().lerp(END, eased);
    // Slight parabolic lift.
    pos.y += Math.sin(eased * Math.PI) * 0.6;
    // Divine final arrow gets a wider golden arc.
    if (divine > 1.5) pos.y += Math.sin(eased * Math.PI) * 0.8;

    if (head.current) {
      head.current.position.copy(pos);
      // Point along travel direction.
      const dir = END.clone().sub(START).normalize();
      head.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    }
    if (glow.current) {
      glow.current.position.copy(pos);
      glow.current.material.opacity = 0.5 * divine;
      glow.current.scale.setScalar(0.4 + divine * 0.35 + Math.sin(director.globalTime * 12) * 0.05);
    }

    // Update the trail buffer.
    trail.pop();
    trail.unshift(pos.clone());
    const arr = trailGeo.attributes.position.array;
    for (let i = 0; i < TRAIL; i++) {
      const v = trail[i];
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    }
    trailGeo.attributes.position.needsUpdate = true;
    trailMat.opacity = 0.9;
    trailMat.color.set(divine > 1.5 ? '#fff2c8' : '#ffd27a');
    headMat.opacity = 1;
  });

  return (
    <group ref={group}>
      {/* Arrowhead */}
      <group ref={head}>
        <mesh material={headMat}>
          <coneGeometry args={[0.08, 0.3, 10]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
          <meshStandardMaterial color="#d8c8a0" emissive="#ffcf5a" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Soft glow sprite around the head */}
      <sprite ref={glow}>
        <spriteMaterial
          color="#ffd88a"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Trail */}
      <line ref={trailRef} geometry={trailGeo} material={trailMat} frustumCulled={false} />

      {/* A light that travels with the arrow to illuminate the battlefield */}
      <pointLight position={[0, 0, 0]} color="#ffd88a" intensity={6} distance={12} decay={2} ref={(l) => { if (l && head.current) l.position.copy(head.current.position); }} />
    </group>
  );
}
