import * as THREE from 'three';

/**
 * `director` is the single source of truth for per-frame animation state.
 *
 * It is a plain mutable object (NOT React state) so that reading it inside
 * `useFrame` never causes a re-render. The GSAP master timeline writes to it,
 * and every character / effect / camera component reads from it each frame.
 *
 * Keeping this decoupled is also what makes Ultra View toggling perfectly
 * desync-free: there is only ever ONE timeline, and switching the camera track
 * simply changes which keyframe set we sample at the same `sceneProgress`.
 */
export const director = {
  /** Index of the currently playing scene (0..11). */
  sceneIndex: 0,

  /** Normalized progress through the current scene, 0..1. */
  sceneProgress: 0,

  /** Absolute time in seconds since the timeline started. */
  globalTime: 0,

  /** Master time scale — driven to < 1 for slow-motion / speed ramps. */
  timeScale: 1,

  /** Decaying 0..1 impulse that drives camera shake + chromatic punch. */
  impact: 0,

  /** Decaying 0..1 impulse that drives full-screen flashes. */
  flash: 0,

  /** Decaying 0..1 impulse for cinematic camera push (heartbeat in scene 9). */
  tension: 0,

  /** World-space target the camera should look at (set per scene). */
  lookAt: new THREE.Vector3(0, 2, 0),

  /** Trigger a camera-shake + chromatic impulse. */
  triggerImpact(strength = 1) {
    this.impact = Math.min(2, Math.max(this.impact, strength));
  },

  /** Trigger a screen flash (respecting the user's flash toggle downstream). */
  triggerFlash(strength = 1) {
    this.flash = Math.min(2, Math.max(this.flash, strength));
  },

  /** Trigger the slow tension build used before the final arrow. */
  triggerTension(strength = 1) {
    this.tension = Math.min(1, Math.max(this.tension, strength));
  },

  /** Advance decay timers. Called once per rendered frame. */
  update(dt) {
    this.globalTime += dt * this.timeScale;
    this.impact = Math.max(0, this.impact - dt * 2.6);
    this.flash = Math.max(0, this.flash - dt * 3.4);
    this.tension = Math.max(0, this.tension - dt * 0.5);
  },

  /** Reset every transient (used on restart). */
  reset() {
    this.sceneIndex = 0;
    this.sceneProgress = 0;
    this.globalTime = 0;
    this.timeScale = 1;
    this.impact = 0;
    this.flash = 0;
    this.tension = 0;
    this.lookAt.set(0, 2, 0);
  },
};

/** Smoothstep helper used by camera interpolation. */
export function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Damp a value toward a target (frame-rate independent). */
export function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Damp a Vector3 toward a target (frame-rate independent). */
export function dampVec3(current, target, lambda, dt) {
  const t = 1 - Math.exp(-lambda * dt);
  current.x = THREE.MathUtils.lerp(current.x, target.x, t);
  current.y = THREE.MathUtils.lerp(current.y, target.y, t);
  current.z = THREE.MathUtils.lerp(current.z, target.z, t);
  return current;
}
