import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';

/**
 * Anamorphic lens flare.
 *
 * A horizontally-stretched additive glow that blooms on lightning, the final
 * divine arrow and fireworks. It billboard-faces the camera and pulses with the
 * director's impact/flash impulses. Kept subtle so it reads as a lens
 * artefact rather than a scene object.
 */
export default function LensFlare({ position = [6.7, 2.6, 0] }) {
  const mesh = useRef();
  const lastFlash = useRef(0);

  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#bfe0ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    []
  );

  useFrame((state, dt) => {
    const cdt = Math.min(dt, 0.05);

    // Flare on fresh impacts and during the stormy battle scenes.
    const stormy = director.sceneIndex >= 5 && director.sceneIndex <= 9;
    let intensity = stormy ? 0.12 : 0;
    if (director.impact > 0.5 && lastFlash.current <= 0.5) {
      intensity = 1;
    }
    lastFlash.current = director.impact;
    intensity = Math.max(intensity, director.flash * 0.8);

    mat.opacity = THREE.MathUtils.lerp(mat.opacity, intensity, 0.2);

    if (mesh.current) {
      mesh.current.quaternion.copy(state.camera.quaternion);
      // Stretch horizontally for the anamorphic look.
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.05;
      mesh.current.scale.set(6 * pulse, 0.5 * pulse, 1);
    }
  });

  return (
    <mesh ref={mesh} position={position} material={mat}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
