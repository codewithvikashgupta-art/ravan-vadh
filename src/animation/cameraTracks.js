/**
 * Camera keyframe tracks.
 *
 * Every scene exposes a `standard` and an `ultra` track. A track is a list of
 * keyframes sorted by `t` (normalized 0..1 within the scene):
 *
 *   { t, pos: [x,y,z], look: [x,y,z], fov, roll? }
 *
 * The camera samples the active track at `director.sceneProgress` and smooth-
 * steps between neighbouring keyframes. Because both tracks are sampled against
 * the SAME progress value, toggling Ultra View mid-playback keeps the exact
 * same moment in time — no restart, no desync.
 *
 * World layout (metres):
 *   - Ram stands at (-4, 0, 0) facing +X toward Ravan.
 *   - Hanuman is behind Ram at (-8, 0, -2.5).
 *   - Ravan is on his chariot at (7, 0.6, 0) facing -X.
 *   - Golden Lanka sits far in the background around z = -55.
 */

const V = (x, y, z) => [x, y, z];

export const cameraTracks = {
  // 1 — Cinematic opening: crane flyover of Lanka into a dolly-zoom title.
  opening: {
    standard: [
      { t: 0.0, pos: V(-2, 26, -95), look: V(0, 8, -55), fov: 55 },
      { t: 0.5, pos: V(0, 16, -70), look: V(0, 6, -50), fov: 52 },
      { t: 1.0, pos: V(-3, 7, -22), look: V(0, 3, -6), fov: 48 },
    ],
    ultra: [
      { t: 0.0, pos: V(-14, 34, -108), look: V(0, 10, -55), fov: 60 },
      { t: 0.35, pos: V(-4, 20, -84), look: V(0, 7, -52), fov: 50 },
      { t: 0.7, pos: V(3, 11, -58), look: V(0, 4, -40), fov: 44 },
      { t: 1.0, pos: V(-4, 5.5, -20), look: V(0, 2.5, -4), fov: 40 },
    ],
  },

  // 2 — 360° orbit around Ram Ji at shallow DOF, diya bokeh in the foreground.
  'ram-puja': {
    standard: [
      { t: 0.0, pos: V(-9, 2.4, 4), look: V(-4, 1.7, 0), fov: 40 },
      { t: 0.5, pos: V(-4, 2.6, 6), look: V(-4, 1.7, 0), fov: 38 },
      { t: 1.0, pos: V(1, 2.4, 3), look: V(-4, 1.7, 0), fov: 40 },
    ],
    ultra: [
      { t: 0.0, pos: V(-9.6, 2.0, 3.2), look: V(-4, 1.6, 0), fov: 34 },
      { t: 0.28, pos: V(-6.6, 2.9, 5.6), look: V(-4, 1.6, 0), fov: 32 },
      { t: 0.62, pos: V(-1.4, 2.7, 5.2), look: V(-4, 1.65, 0), fov: 32 },
      { t: 1.0, pos: V(1.6, 2.0, 2.2), look: V(-4, 1.6, 0), fov: 34 },
    ],
  },

  // 3 — Low-angle hero shot then a slow push-in on the blessing.
  hanuman: {
    standard: [
      { t: 0.0, pos: V(-11, 1.2, 5), look: V(-6, 2.4, -1), fov: 44 },
      { t: 0.5, pos: V(-8.5, 2.2, 3.4), look: V(-6, 2.0, -0.6), fov: 40 },
      { t: 1.0, pos: V(-6.6, 2.1, 2.4), look: V(-5.4, 1.9, -0.4), fov: 38 },
    ],
    ultra: [
      { t: 0.0, pos: V(-12.5, 0.8, 6.2), look: V(-6, 2.6, -1.2), fov: 48 },
      { t: 0.3, pos: V(-9.6, 1.0, 4.6), look: V(-6, 2.2, -0.8), fov: 40 },
      { t: 0.66, pos: V(-7.2, 2.0, 3.0), look: V(-5.6, 1.9, -0.4), fov: 34 },
      { t: 1.0, pos: V(-5.9, 2.0, 2.1), look: V(-5.2, 1.8, -0.3), fov: 30 },
    ],
  },

  // 4 — Macro bow-string close-up then a pull-back reveal of Ravan's army.
  'war-prep': {
    standard: [
      { t: 0.0, pos: V(-5.4, 2.0, 1.6), look: V(-4, 1.9, 0), fov: 34 },
      { t: 0.5, pos: V(-3.2, 2.4, 2.6), look: V(-1, 1.8, -1), fov: 42 },
      { t: 1.0, pos: V(-1, 6.5, 12), look: V(7, 2.5, -6), fov: 55 },
    ],
    ultra: [
      { t: 0.0, pos: V(-5.1, 1.95, 1.1), look: V(-4.1, 1.9, 0), fov: 26 },
      { t: 0.34, pos: V(-4.2, 2.1, 1.9), look: V(-3.6, 1.9, 0), fov: 30 },
      { t: 0.7, pos: V(-1.6, 3.4, 6.5), look: V(3, 2.2, -3), fov: 48 },
      { t: 1.0, pos: V(0.5, 8.5, 16), look: V(8, 2.6, -8), fov: 60 },
    ],
  },

  // 5 — Worm's-eye hero shot of Ravan, orbiting ten-head reveal, dolly-zoom laugh.
  'ravan-entrance': {
    standard: [
      { t: 0.0, pos: V(9, 0.6, 6), look: V(7, 2.6, 0), fov: 48 },
      { t: 0.5, pos: V(4.5, 2.4, 4.5), look: V(7, 2.6, 0), fov: 44 },
      { t: 1.0, pos: V(2.5, 2.0, 1.2), look: V(7, 2.6, 0), fov: 40 },
    ],
    ultra: [
      { t: 0.0, pos: V(8.6, 0.35, 7.4), look: V(7, 3.0, 0), fov: 54 },
      { t: 0.28, pos: V(3.4, 0.9, 6.2), look: V(7, 3.0, 0), fov: 46 },
      { t: 0.58, pos: V(2.2, 3.2, 2.4), look: V(7, 2.9, 0), fov: 40 },
      { t: 1.0, pos: V(2.0, 2.2, 0.2), look: V(7, 2.7, 0), fov: 34 },
    ],
  },

  // 6 — Over-the-shoulder, macro arrow tip, tracked arrow-cam POV in slow-mo.
  'first-arrow': {
    standard: [
      { t: 0.0, pos: V(-6.2, 2.3, 2.2), look: V(-2, 1.9, 0), fov: 38 },
      { t: 0.45, pos: V(-2.6, 2.1, 1.2), look: V(3, 2.0, 0), fov: 40 },
      { t: 1.0, pos: V(3.4, 2.2, 2.6), look: V(7, 2.4, 0), fov: 44 },
    ],
    ultra: [
      { t: 0.0, pos: V(-6.0, 2.2, 1.7), look: V(-2.4, 1.95, 0), fov: 30 },
      { t: 0.3, pos: V(-4.2, 2.0, 0.9), look: V(-3.6, 1.95, 0.1), fov: 22 },
      { t: 0.55, pos: V(-0.6, 2.05, 0.8), look: V(3, 2.0, 0), fov: 40 },
      { t: 1.0, pos: V(4.4, 2.4, 1.8), look: V(7, 2.6, 0), fov: 38 },
    ],
  },

  // 7 — A distinct rig per arrow: aerial, ground whip-pan, arrow POV, macro.
  'arrow-battles': {
    standard: [
      { t: 0.0, pos: V(-1, 5.5, 9), look: V(2, 2.4, 0), fov: 50 },
      { t: 0.25, pos: V(6, 1.4, 6), look: V(1, 2.2, 0), fov: 46 },
      { t: 0.5, pos: V(-2, 9, -4), look: V(3, 2.2, 0), fov: 52 },
      { t: 0.75, pos: V(8.5, 2.2, -3), look: V(6.5, 2.6, 0), fov: 42 },
      { t: 1.0, pos: V(0, 4, 8), look: V(3, 2.4, 0), fov: 48 },
    ],
    ultra: [
      { t: 0.0, pos: V(-2.5, 6.5, 10.5), look: V(2, 2.6, 0), fov: 46 },
      { t: 0.22, pos: V(4.2, 0.9, 5.4), look: V(0.5, 2.0, 0), fov: 38 },
      { t: 0.44, pos: V(-3, 11, -6), look: V(3, 2.2, 0), fov: 56 },
      { t: 0.66, pos: V(9.2, 2.6, -3.6), look: V(6.6, 2.8, 0.1), fov: 30 },
      { t: 0.85, pos: V(6.8, 2.9, 2.2), look: V(6.8, 2.7, 0), fov: 26 },
      { t: 1.0, pos: V(1, 4.4, 9), look: V(3, 2.5, 0), fov: 44 },
    ],
  },

  // 8 — Handheld shake on impacts, lightning-lit wide aerial, bullet-time near miss.
  'battle-peak': {
    standard: [
      { t: 0.0, pos: V(1, 3.2, 7.5), look: V(3, 2.4, 0), fov: 48 },
      { t: 0.35, pos: V(-3, 12, 2), look: V(2, 2.2, -2), fov: 58 },
      { t: 0.7, pos: V(5, 2.0, 3.4), look: V(-2, 2.2, 0), fov: 40 },
      { t: 1.0, pos: V(0, 5, 9), look: V(3, 2.6, 0), fov: 50 },
    ],
    ultra: [
      { t: 0.0, pos: V(1.4, 2.8, 6.4), look: V(3, 2.5, 0), fov: 40 },
      { t: 0.3, pos: V(-4, 15, 3.5), look: V(2, 2.0, -3), fov: 64 },
      { t: 0.62, pos: V(6.4, 1.6, 2.6), look: V(-2.6, 2.2, 0), fov: 32 },
      { t: 0.82, pos: V(2.2, 2.1, 1.4), look: V(-3.4, 2.0, 0.4), fov: 26 },
      { t: 1.0, pos: V(0.5, 5.6, 10), look: V(3, 2.7, 0), fov: 46 },
    ],
  },

  // 9 — Extremely slow push-in on Ram's eyes, then a 270° bullet-time orbit.
  'final-arrow': {
    standard: [
      { t: 0.0, pos: V(-6.4, 2.2, 2.6), look: V(-4, 1.9, 0), fov: 36 },
      { t: 0.5, pos: V(-5.0, 2.05, 1.5), look: V(-4, 1.9, 0), fov: 30 },
      { t: 1.0, pos: V(-1.2, 2.3, 3.4), look: V(-3, 2.0, 0), fov: 40 },
    ],
    ultra: [
      { t: 0.0, pos: V(-6.6, 2.15, 2.2), look: V(-4, 1.9, 0), fov: 30 },
      { t: 0.45, pos: V(-5.2, 2.0, 1.2), look: V(-4, 1.9, 0), fov: 22 },
      { t: 0.72, pos: V(-3.2, 2.1, 2.6), look: V(-3.6, 1.95, 0), fov: 28 },
      { t: 1.0, pos: V(0.6, 2.6, 4.2), look: V(-2, 2.0, 0), fov: 44 },
    ],
  },

  // 10 — Impact freeze, radial shockwave pull-out, crane-up as clouds turn gold.
  'ravan-vadh': {
    standard: [
      { t: 0.0, pos: V(4.2, 2.4, 3.0), look: V(7, 2.6, 0), fov: 42 },
      { t: 0.4, pos: V(2.0, 3.4, 6.5), look: V(7, 2.4, 0), fov: 50 },
      { t: 0.75, pos: V(-1, 6, 11), look: V(5, 2.0, 0), fov: 55 },
      { t: 1.0, pos: V(-2, 12, 16), look: V(4, 1.5, 0), fov: 58 },
    ],
    ultra: [
      { t: 0.0, pos: V(5.2, 2.6, 2.4), look: V(7, 2.7, 0), fov: 34 },
      { t: 0.3, pos: V(3.0, 2.9, 5.2), look: V(7, 2.6, 0), fov: 44 },
      { t: 0.62, pos: V(-0.4, 4.4, 9.5), look: V(5.5, 2.2, 0), fov: 52 },
      { t: 1.0, pos: V(-3, 15, 19), look: V(4, 1.2, -1), fov: 62 },
    ],
  },

  // 11 — Sweeping drone flight through multi-layered fireworks.
  fireworks: {
    standard: [
      { t: 0.0, pos: V(0, 8, 14), look: V(2, 6, -6), fov: 55 },
      { t: 0.35, pos: V(-8, 12, 4), look: V(0, 8, -20), fov: 58 },
      { t: 0.7, pos: V(6, 16, -4), look: V(0, 10, -30), fov: 60 },
      { t: 1.0, pos: V(0, 10, 18), look: V(0, 6, -10), fov: 52 },
    ],
    ultra: [
      { t: 0.0, pos: V(-2, 7, 15), look: V(2, 7, -8), fov: 50 },
      { t: 0.3, pos: V(-11, 10, 2), look: V(0, 9, -22), fov: 62 },
      { t: 0.58, pos: V(3, 18, -10), look: V(-2, 11, -34), fov: 66 },
      { t: 0.82, pos: V(12, 13, -2), look: V(0, 9, -26), fov: 56 },
      { t: 1.0, pos: V(0, 11, 20), look: V(0, 6, -12), fov: 48 },
    ],
  },

  // 12 — Slow, majestic crane-down into a symmetrical hero composition.
  ending: {
    standard: [
      { t: 0.0, pos: V(0, 14, 20), look: V(-1, 2, -4), fov: 50 },
      { t: 0.5, pos: V(-1, 6, 13), look: V(-2, 2, -2), fov: 44 },
      { t: 1.0, pos: V(-1.5, 3.2, 9.5), look: V(-2.5, 1.9, -1), fov: 42 },
    ],
    ultra: [
      { t: 0.0, pos: V(0, 17, 23), look: V(-1, 2.5, -6), fov: 54 },
      { t: 0.4, pos: V(-0.6, 9, 15), look: V(-2, 2.2, -3), fov: 46 },
      { t: 0.78, pos: V(-1.4, 4.4, 10.5), look: V(-2.5, 2.0, -1.4), fov: 40 },
      { t: 1.0, pos: V(-1.6, 3.0, 8.6), look: V(-2.6, 1.9, -1), fov: 38 },
    ],
  },
};

const _pos = { x: 0, y: 0, z: 0 };
const _look = { x: 0, y: 0, z: 0 };

/**
 * Sample a track at normalized progress `p` (0..1), writing into the provided
 * THREE.Vector3s. Neighbouring keyframes are smooth-stepped for buttery motion.
 */
export function sampleTrack(track, p, outPos, outLook, outFov) {
  if (!track || track.length === 0) return outFov;
  const clamped = Math.min(1, Math.max(0, p));

  let i = 0;
  while (i < track.length - 2 && track[i + 1].t < clamped) i++;

  const a = track[i];
  const b = track[Math.min(i + 1, track.length - 1)];
  const span = b.t - a.t;
  const local = span > 0 ? (clamped - a.t) / span : 0;
  const e = local * local * (3 - 2 * local); // smoothstep

  _pos.x = a.pos[0] + (b.pos[0] - a.pos[0]) * e;
  _pos.y = a.pos[1] + (b.pos[1] - a.pos[1]) * e;
  _pos.z = a.pos[2] + (b.pos[2] - a.pos[2]) * e;

  _look.x = a.look[0] + (b.look[0] - a.look[0]) * e;
  _look.y = a.look[1] + (b.look[1] - a.look[1]) * e;
  _look.z = a.look[2] + (b.look[2] - a.look[2]) * e;

  outPos.set(_pos.x, _pos.y, _pos.z);
  outLook.set(_look.x, _look.y, _look.z);

  return a.fov + (b.fov - a.fov) * e;
}

/** Pick the correct track for a scene given the current Ultra View state. */
export function getTrack(sceneId, ultraMode, directorsCut) {
  const entry = cameraTracks[sceneId];
  if (!entry) return cameraTracks.opening.standard;
  if (ultraMode && directorsCut) return entry.ultra;
  return entry.standard;
}
