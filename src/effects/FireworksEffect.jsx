import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';
import { audio } from '../audio/AudioEngine';

/**
 * Fireworks — a pooled multi-burst particle system for the Vijayadashami
 * celebration (scene 11) and the victory transition.
 *
 * Each burst is a set of particles launched from a random origin high in the
 * sky, expanding spherically under gravity with a colour fade. Bursts are
 * recycled; nothing is allocated during playback.
 */

const BURSTS = 6;
const PER_BURST = 90;

const PALETTE = ['#ff5a5a', '#ffd25a', '#5affa0', '#5ab0ff', '#ff5af0', '#ffffff', '#ff9a3a'];

export default function FireworksEffect({ center = [0, 16, -28] }) {
  const points = useRef();
  const light = useRef();
  const lastScene = useRef(-1);
  const nextLaunch = useRef(0);

  const { geo, mat, bursts } = useMemo(() => {
    const total = BURSTS * PER_BURST;
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const sizes = new Float32Array(total);

    const bursts = [];
    for (let b = 0; b < BURSTS; b++) {
      const color = new THREE.Color(PALETTE[b % PALETTE.length]);
      const vel = [];
      for (let i = 0; i < PER_BURST; i++) {
        // Spherical distribution.
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 3 + Math.random() * 4;
        vel.push(
          new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.cos(phi) * speed,
            Math.sin(phi) * Math.sin(theta) * speed
          )
        );
        const idx = b * PER_BURST + i;
        colors[idx * 3] = color.r;
        colors[idx * 3 + 1] = color.g;
        colors[idx * 3 + 2] = color.b;
        sizes[idx] = 0.4 + Math.random() * 0.3;
      }
      bursts.push({
        origin: new THREE.Vector3(),
        vel,
        active: false,
        life: 0,
        color,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    return { geo, mat, bursts };
  }, []);

  useFrame((state, dt) => {
    const cdt = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;

    const celebrating = director.sceneIndex === 10 || director.sceneIndex === 11;
    mat.opacity = celebrating ? 1 : 0;

    if (!celebrating) {
      // Ensure everything is hidden.
      if (light.current) light.current.intensity = 0;
      return;
    }

    // Launch new bursts on a timer.
    nextLaunch.current -= cdt;
    if (nextLaunch.current <= 0) {
      const b = bursts.find((x) => !x.active);
      if (b) {
        b.origin.set(
          center[0] + (Math.random() - 0.5) * 60,
          center[1] + (Math.random() - 0.5) * 14,
          center[2] + (Math.random() - 0.5) * 30
        );
        b.active = true;
        b.life = 1;
        audio.firework({ gain: 0.4, hue: Math.random() });
        if (light.current) {
          light.current.position.copy(b.origin);
          light.current.color.copy(b.color);
        }
      }
      nextLaunch.current = 0.35 + Math.random() * 0.6;
    }

    // Integrate.
    const pos = geo.attributes.position.array;
    let brightest = 0;
    bursts.forEach((b, bi) => {
      if (!b.active) return;
      b.life -= cdt * 0.45;
      if (b.life <= 0) {
        b.active = false;
        // Park the particles out of view.
        for (let i = 0; i < PER_BURST; i++) {
          const idx = (bi * PER_BURST + i) * 3;
          pos[idx] = 0;
          pos[idx + 1] = -9999;
          pos[idx + 2] = 0;
        }
        return;
      }
      brightest = Math.max(brightest, b.life);
      for (let i = 0; i < PER_BURST; i++) {
        const v = b.vel[i];
        v.y -= cdt * 2.2; // gravity
        v.multiplyScalar(1 - cdt * 0.6); // drag
        const idx = (bi * PER_BURST + i) * 3;
        pos[idx] += v.x * cdt;
        pos[idx + 1] += v.y * cdt;
        pos[idx + 2] += v.z * cdt;
      }
    });
    geo.attributes.position.needsUpdate = true;

    if (light.current) light.current.intensity = brightest * 40;

    // Reset the pool when leaving the celebration.
    if (director.sceneIndex !== lastScene.current) lastScene.current = director.sceneIndex;
  });

  return (
    <group>
      <points ref={points} geometry={geo} material={mat} frustumCulled={false} />
      <pointLight ref={light} intensity={0} distance={90} decay={2} />
    </group>
  );
}
