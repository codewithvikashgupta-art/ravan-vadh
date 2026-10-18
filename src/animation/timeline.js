import gsap from 'gsap';
import { director } from './director';
import { scenes, TOTAL_DURATION, locateScene, sceneLabelStart } from '../scenes/sceneData';

/**
 * Build the single master timeline that drives the entire cinematic.
 *
 * There is exactly ONE timeline. It advances `director.sceneIndex` and
 * `director.sceneProgress`, which every other system samples. This is what
 * makes Ultra View / Director's Cut toggling perfectly desync-free.
 *
 * `onFrame(time, index, progress)` is invoked on every timeline update so the
 * React layer can mirror the scene index for the HUD without re-rendering at
 * 60fps (the callback only calls setState when the scene index actually changes).
 */
export function buildTimeline(onFrame) {
  const tl = gsap.timeline({ paused: true });

  // Add one placeholder tween per scene purely to establish total duration.
  let cursor = 0;
  scenes.forEach((scene, i) => {
    tl.addLabel(`scene-${i}`, cursor);
    tl.to({ v: 0 }, { v: 1, duration: scene.duration, ease: 'none' }, cursor);
    cursor += scene.duration;
  });
  tl.addLabel('end', cursor);
  // Guard so the timeline is never empty.
  tl.to({ v: 0 }, { v: 1, duration: 0.0001 }, 0);

  tl.eventCallback('onUpdate', () => {
    const time = tl.time();
    const { index, progress } = locateScene(time);
    director.sceneIndex = index;
    director.sceneProgress = progress;
    onFrame?.(time, index, progress);
  });

  return tl;
}

/**
 * A tiny reactive facade over the timeline. Components and the HUD talk to
 * this instead of touching GSAP directly.
 */
export const playback = {
  tl: null,

  bind(tl) {
    this.tl = tl;
  },

  unbind() {
    this.tl = null;
  },

  get duration() {
    return this.tl ? this.tl.duration() : TOTAL_DURATION;
  },

  get time() {
    return this.tl ? this.tl.time() : 0;
  },

  get progress() {
    return this.tl ? this.tl.progress() : 0;
  },

  get isPaused() {
    return this.tl ? this.tl.paused() : true;
  },

  get isComplete() {
    return this.tl ? this.tl.progress() >= 1 : false;
  },

  play() {
    if (!this.tl) return;
    if (this.tl.progress() >= 1) this.tl.restart();
    else this.tl.play();
  },

  pause() {
    this.tl?.pause();
  },

  toggle() {
    if (!this.tl) return;
    if (this.tl.paused() || this.tl.progress() >= 1) this.play();
    else this.pause();
  },

  restart() {
    director.reset();
    this.tl?.restart();
  },

  /** Seek to the first frame of scene `index` and pause there. */
  seekScene(index, { play = false } = {}) {
    if (!this.tl) return;
    const clamped = Math.max(0, Math.min(scenes.length - 1, index));
    const target = sceneLabelStart(clamped) + 0.0001;
    this.tl.pause();
    this.tl.time(target, false);
    director.sceneIndex = clamped;
    director.sceneProgress = 0;
    if (play) this.tl.play();
  },

  nextScene() {
    this.seekScene(director.sceneIndex + 1);
  },

  prevScene() {
    this.seekScene(director.sceneIndex - 1);
  },

  replayScene() {
    this.seekScene(director.sceneIndex, { play: true });
  },

  /** Nudge the playhead by `seconds` (used by the progress scrubber). */
  scrubTo(progress01) {
    if (!this.tl) return;
    this.tl.pause();
    this.tl.progress(Math.max(0, Math.min(1, progress01)), false);
  },
};

// Debug hook: lets tests and the browser console jump directly to a scene.
if (typeof window !== 'undefined') window.__playback = playback;

export { TOTAL_DURATION };
