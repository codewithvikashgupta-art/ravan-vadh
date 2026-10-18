import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';

/**
 * Volumetric-style god rays.
 *
 * A stack of large, additive, procedurally-textured planes that face the
 * camera and radiate from a sun/origin point. The intensity is driven by the
 * scene (strongest in the devotional and victory scenes). This is a lightweight
 * screen-facing approximation of raymarched volumetrics that reads convincingly
 * through clouds and smoke without the cost of true raymarching.
 */
function makeRayTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  // Radial streaks emanating from the centre.
  const cx = size / 2;
  for (let i = 0; i < 120; i++) {
    const ang = (i / 120) * Math.PI * 2;
    const len = size * (0.3 + Math.random() * 0.7);
    const grad = ctx.createLinearGradient(cx, cx, cx + Math.cos(ang) * len, cx + Math.sin(ang) * len);
    grad.addColorStop(0, `rgba(255,240,210,${0.06 + Math.random() * 0.08})`);
    grad.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(cx, cx);
    ctx.lineTo(cx + Math.cos(ang) * len, cx + Math.sin(ang) * len);
    ctx.stroke();
  }
  // Soft centre glow.
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, size / 2);
  g.addColorStop(0, 'rgba(255,235,190,0.5)');
  g.addColorStop(1, 'rgba(255,235,190,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function GodRays({ position = [0, 22, -46] }) {
  const group = useRef();
  const tex = useMemo(() => makeRayTexture(), []);
  const layers = useMemo(
    () => [
      { scale: 34, rot: 0, speed: 0.01 },
      { scale: 26, rot: 1, speed: -0.016 },
      { scale: 44, rot: 2, speed: 0.006 },
    ],
    []
  );

  const mats = useMemo(
    () =>
      layers.map(
        () =>
          new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            toneMapped: false,
          })
      ),
    [tex, layers]
  );

  // Scene intensity: devotional + victory scenes are the brightest.
  const intensityFor = (i) => {
    if (i === 1 || i === 2) return 0.5; // puja / hanuman golden glow
    if (i === 8) return 0.7; // final arrow divine light
    if (i === 9 || i === 10) return 0.65; // victory
    if (i === 11) return 0.5; // ending
    return 0.12;
  };

  useFrame((state, dt) => {
    const cdt = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const target = intensityFor(director.sceneIndex);

    if (group.current) group.current.quaternion.copy(state.camera.quaternion);

    layers.forEach((l, i) => {
      const m = mats[i];
      m.opacity = THREE.MathUtils.lerp(m.opacity, target * (1 - i * 0.22), 0.05);
      if (group.current && group.current.children[i]) {
        group.current.children[i].rotation.z += l.speed * cdt * 10;
        group.current.children[i].scale.setScalar(l.scale * (1 + Math.sin(t * 0.4 + i) * 0.03));
      }
    });
  });

  return (
    <group ref={group} position={position}>
      {layers.map((l, i) => (
        <mesh key={i} material={mats[i]} rotation={[0, 0, l.rot]}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}
