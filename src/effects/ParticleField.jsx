import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';

/**
 * GPU-friendly additive particle field used for embers, fire and magical
 * sparks. Positions are animated on the CPU into a small recycled buffer (a
 * simple particle pool) so we never allocate per frame.
 *
 * Controlled by `mode`: 'embers' | 'fire' | 'sparks' and gated by the active
 * scene so particles only appear where the story calls for them.
 */
export default function ParticleField({
  count = 500,
  mode = 'embers',
  area = [40, 14, 40],
  origin = [0, 0, 0],
  color = '#ff9a3a',
  colorB = '#ffd27a',
  size = 0.16,
}) {
  const points = useRef();

  const { geo, mat, data } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    const cA = new THREE.Color(color);
    const cB = new THREE.Color(colorB);

    const data = [];
    for (let i = 0; i < count; i++) {
      const x = origin[0] + (Math.random() - 0.5) * area[0];
      const y = origin[1] + Math.random() * area[1];
      const z = origin[2] + (Math.random() - 0.5) * area[2];
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const c = cA.clone().lerp(cB, Math.random());
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      seeds[i] = Math.random();
      data.push({
        vy: 0.3 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
        life: Math.random(),
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.PointsMaterial({
      size,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    return { geo, mat, data };
  }, [count, color, colorB, size]);

  useFrame((state, dt) => {
    const cdt = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const pos = geo.attributes.position.array;

    // Global intensity gate based on the current scene.
    let intensity = 1;
    if (mode === 'fire') {
      intensity = director.sceneIndex >= 9 ? 1 : director.sceneIndex >= 6 ? 0.5 : 0.25;
    } else if (mode === 'sparks') {
      intensity = director.sceneIndex >= 5 && director.sceneIndex <= 9 ? 1 : 0.15;
    }
    mat.opacity = 0.35 + 0.65 * intensity;

    for (let i = 0; i < count; i++) {
      const d = data[i];
      const ix = i * 3;
      let x = pos[ix];
      let y = pos[ix + 1];
      let z = pos[ix + 2];

      const speedMul = mode === 'fire' ? 2.2 : mode === 'sparks' ? 3.2 : 1;

      y += d.vy * cdt * speedMul * intensity;
      x += Math.sin(t * 1.5 + d.phase) * d.drift * cdt;
      z += Math.cos(t * 1.3 + d.phase) * d.drift * cdt;

      // Recycle when leaving the top of the volume.
      if (y > origin[1] + area[1]) {
        y = origin[1];
        x = origin[0] + (Math.random() - 0.5) * area[0];
        z = origin[2] + (Math.random() - 0.5) * area[2];
      }

      pos[ix] = x;
      pos[ix + 1] = y;
      pos[ix + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
    if (points.current) points.current.rotation.y += cdt * 0.01;
  });

  return <points ref={points} geometry={geo} material={mat} frustumCulled={false} />;
}
