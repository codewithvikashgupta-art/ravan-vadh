import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { director, dampVec3 } from '../../animation/director';
import { sampleTrack, getTrack } from '../../animation/cameraTracks';
import { scenes } from '../../scenes/sceneData';
import { useStore } from '../../store/useStore';

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _curLook = new THREE.Vector3(0, 2, 0);

/**
 * Cinematic camera controller.
 *
 * Every frame it samples the active camera track (Standard or Ultra) at the
 * master timeline's scene progress, then layers on:
 *   - eased mouse/touch parallax,
 *   - optional gyroscope parallax on mobile,
 *   - impact-driven shake (respecting the user's shake toggle),
 *   - a slow-motion "breath" during the final-arrow tension build.
 *
 * Because the track is chosen from live store state but sampled at the
 * timeline's own progress, toggling Ultra View changes the *look* while keeping
 * the exact same moment in time.
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const gyro = useRef({ x: 0, y: 0, active: false });
  const shakeSeed = useRef(0);

  // Pointer parallax.
  useFrame(() => {
    // nothing here; handled via listeners below
  });

  // Register listeners once.
  useRef(() => {});

  // We attach DOM listeners in an effect-like manner via a ref callback.
  const attached = useRef(false);
  if (!attached.current && typeof window !== 'undefined') {
    attached.current = true;
    window.addEventListener('pointermove', (e) => {
      pointer.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ty = (e.clientY / window.innerHeight) * 2 - 1;
    });
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null || e.beta == null) return;
      gyro.current.active = true;
      gyro.current.tx = THREE.MathUtils.clamp(e.gamma / 45, -1, 1);
      gyro.current.ty = THREE.MathUtils.clamp((e.beta - 45) / 45, -1, 1);
    });
  }

  useFrame((state, dt) => {
    const cdt = Math.min(dt, 0.05);
    const scene = scenes[director.sceneIndex] || scenes[0];
    const { ultraView, directorsCut, settings, photoMode, reducedMotion } = useStore.getState();

    // Photo mode: free camera handled by OrbitControls; skip cinematic drive.
    if (photoMode || window.__photoMode) return;

    const track = getTrack(scene.id, ultraView, directorsCut);
    const fov = sampleTrack(track, director.sceneProgress, _pos, _look, camera.fov);
    camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 0.15);
    camera.updateProjectionMatrix();

    // Ease the camera toward the sampled position for a weighty, cinematic feel.
    dampVec3(camera.position, _pos, 9, cdt);

    // Parallax — eased, and disabled for reduced motion.
    if (!reducedMotion) {
      const px = gyro.current.active ? gyro.current.tx : pointer.current.tx;
      const py = gyro.current.active ? gyro.current.ty : pointer.current.ty;
      pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, px, 0.05);
      pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, py, 0.05);

      const strength = ultraView ? 0.6 : 0.35;
      camera.position.x += pointer.current.x * strength;
      camera.position.y += -pointer.current.y * strength * 0.5;
    }

    // Impact shake.
    if (settings.shake && director.impact > 0.01 && !reducedMotion) {
      shakeSeed.current += cdt * 60;
      const s = director.impact * (ultraView ? 0.35 : 0.22);
      camera.position.x += Math.sin(shakeSeed.current * 1.3) * s * 0.25;
      camera.position.y += Math.cos(shakeSeed.current * 1.7) * s * 0.25;
      camera.rotation.z += Math.sin(shakeSeed.current * 0.9) * s * 0.03;
    }

    // Damped look-at.
    dampVec3(_curLook, _look, 10, cdt);
    director.lookAt.copy(_curLook);
    camera.lookAt(_curLook);
  });

  return null;
}
