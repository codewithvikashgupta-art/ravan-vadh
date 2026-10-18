import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';
import { audio } from '../audio/AudioEngine';

/**
 * Lightning — procedurally generated bolts that crack across the storm sky.
 *
 * A bolt is a jagged line built by recursive midpoint displacement, rebuilt
 * each strike. A point light flashes in sync so the whole battlefield is
 * briefly illuminated. Intensity rises during the stormy battle scenes.
 */
function makeBolt(start, end, generations = 6, offset = 1.4) {
  let pts = [start.clone(), end.clone()];
  let amp = offset;
  for (let g = 0; g < generations; g++) {
    const next = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      next.push(a);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.x += (Math.random() - 0.5) * amp;
      mid.y += (Math.random() - 0.5) * amp * 0.4;
      mid.z += (Math.random() - 0.5) * amp;
      next.push(mid);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    amp *= 0.55;
  }
  return pts;
}

export default function LightningEffect({ origin = [0, 30, -30], count = 2 }) {
  const group = useRef();
  const light = useRef();
  const flash = useRef(0);

  const bolts = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        geo: new THREE.BufferGeometry(),
        start: new THREE.Vector3(),
        end: new THREE.Vector3(),
        next: Math.random() * 2,
      })),
    [count]
  );

  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#cfe0ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame((state, dt) => {
    const cdt = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;

    // Only storm during battle scenes.
    const stormy = director.sceneIndex >= 4 && director.sceneIndex <= 9;
    const heavy = director.sceneIndex === 7 || director.sceneIndex === 9;

    bolts.forEach((b, i) => {
      b.next -= cdt;
      if (b.next <= 0 && stormy) {
        b.start.set(
          origin[0] + (Math.random() - 0.5) * 60,
          origin[1],
          origin[2] + (Math.random() - 0.5) * 40
        );
        b.end.set(
          b.start.x + (Math.random() - 0.5) * 20,
          0.5,
          b.start.z + (Math.random() - 0.5) * 12
        );
        const pts = makeBolt(b.start, b.end);
        b.geo.setFromPoints(pts);
        flash.current = heavy ? 1 : 0.7;
        // Play thunder for the heaviest strikes.
        if (heavy && i === 0) {
          audio.thunder({ gain: 0.5, dur: 2.6 });
        }
        b.next = heavy ? 0.8 + Math.random() * 1.6 : 2.2 + Math.random() * 3.5;
      }
    });

    // Decay the flash.
    flash.current = Math.max(0, flash.current - cdt * 4.5);
    mat.opacity = flash.current * (stormy ? 1 : 0);
    if (light.current) {
      light.current.intensity = flash.current * 220;
      light.current.position.set(origin[0], origin[1] - 6, origin[2]);
    }
  });

  return (
    <group ref={group}>
      {bolts.map((b, i) => (
        <line key={i} geometry={b.geo} material={mat} frustumCulled={false} />
      ))}
      <pointLight ref={light} color="#bcd4ff" intensity={0} distance={160} decay={2} />
    </group>
  );
}
