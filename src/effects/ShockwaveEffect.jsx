import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';

/**
 * Shockwave — an expanding, fading ring of divine light. Triggered on major
 * impacts (arrow strikes and the final blow). The ring grows and dissolves,
 * and a second, tighter ring follows for a layered feel.
 */
export default function ShockwaveEffect({ position = [6.7, 2.4, 0] }) {
  const outer = useRef();
  const inner = useRef();
  const light = useRef();

  const life = useRef(0);

  // Watch for impact triggers from the director.
  const lastImpact = useRef(0);

  const mkMat = (color) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    });

  const outerMat = useRef(mkMat('#ffe6a0'));
  const innerMat = useRef(mkMat('#ffffff'));

  useFrame((_, dt) => {
    const cdt = Math.min(dt, 0.05);

    // Fire whenever the director reports a fresh strong impact.
    if (director.impact > 0.6 && lastImpact.current < 0.6) {
      life.current = 1;
    }
    lastImpact.current = director.impact;

    if (life.current > 0) {
      life.current = Math.max(0, life.current - cdt * 1.6);
      const grow = 1 - life.current;

      if (outer.current) {
        outer.current.scale.setScalar(1 + grow * 12);
        outer.current.material.opacity = life.current * 0.8;
        outer.current.lookAt(director.lookAt);
      }
      if (inner.current) {
        inner.current.scale.setScalar(0.6 + grow * 7);
        inner.current.material.opacity = life.current * 0.6;
        inner.current.lookAt(director.lookAt);
      }
      if (light.current) {
        light.current.intensity = life.current * 60;
      }
    } else {
      if (outer.current) outer.current.material.opacity = 0;
      if (inner.current) inner.current.material.opacity = 0;
      if (light.current) light.current.intensity = 0;
    }
  });

  return (
    <group position={position}>
      <mesh ref={outer} material={outerMat.current}>
        <ringGeometry args={[0.9, 1.0, 64]} />
      </mesh>
      <mesh ref={inner} material={innerMat.current}>
        <ringGeometry args={[0.5, 0.58, 48]} />
      </mesh>
      <pointLight ref={light} color="#ffe0a0" intensity={0} distance={40} decay={2} />
    </group>
  );
}
