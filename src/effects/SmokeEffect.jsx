import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Smoke — slow, soft, rising puffs. Uses a small pooled set of sprites with a
 * procedural radial-gradient texture (no external image) so it works offline.
 */
function makePuffTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.4, 'rgba(200,200,210,0.28)');
  g.addColorStop(1, 'rgba(120,120,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function SmokeEffect({ position = [0, 0, 0], count = 24, scale = 1, color = '#6a6478' }) {
  const group = useRef();
  const tex = useMemo(() => makePuffTexture(), []);
  const puffs = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 6,
        z: (Math.random() - 0.5) * 6,
        vy: 0.3 + Math.random() * 0.6,
        s: 1.5 + Math.random() * 2.5,
        spin: (Math.random() - 0.5) * 0.4,
        rot: Math.random() * Math.PI,
      })),
    [count]
  );

  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: tex,
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    [tex, color]
  );

  useFrame((_, dt) => {
    const cdt = Math.min(dt, 0.05);
    if (!group.current) return;
    group.current.children.forEach((sprite, i) => {
      const p = puffs[i];
      p.y += p.vy * cdt;
      p.rot += p.spin * cdt;
      if (p.y > 9) {
        p.y = 0;
        p.x = (Math.random() - 0.5) * 6;
        p.z = (Math.random() - 0.5) * 6;
      }
      sprite.position.set(p.x + Math.sin(p.y) * 0.5, p.y, p.z);
      const grow = 1 + p.y * 0.12;
      sprite.scale.setScalar(p.s * grow);
      sprite.material.rotation = p.rot;
    });
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {puffs.map((_, i) => (
        <sprite key={i} material={mat} />
      ))}
    </group>
  );
}
