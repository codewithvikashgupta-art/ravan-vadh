import { useStore } from '../store/useStore';

/**
 * Watches the frame rate and progressively degrades visual fidelity so the
 * experience stays smooth on weaker hardware.
 *
 * Tiers (highest -> lowest):
 *   3 : full post stack (bloom + DOF + god rays + chromatic + grain)
 *   2 : drop DOF and god rays
 *   1 : drop chromatic + grain, keep bloom
 *   0 : post-processing off, reduced resolution scale
 *
 * The monitor is deliberately conservative (hysteresis) so it does not flicker
 * between tiers. It reports the active tier back to the store so the UI can
 * show a small, unobtrusive notice when a fallback happens.
 */
export class AdaptiveQuality {
  constructor() {
    this.samples = [];
    this.maxSamples = 45;
    this.tier = 3;
    this.lowFpsTime = 0;
    this.highFpsTime = 0;
    this.cooldown = 0;
    this.enabled = true;
  }

  /** Push one frame-time sample (seconds). */
  sample(dt) {
    if (!this.enabled || dt <= 0) return;
    this.samples.push(1 / dt);
    if (this.samples.length > this.maxSamples) this.samples.shift();

    if (this.samples.length < this.maxSamples) return;

    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    useStore.getState().setFps(Math.round(avg));

    if (this.cooldown > 0) {
      this.cooldown -= dt;
      return;
    }

    if (avg < 30) {
      this.lowFpsTime += dt;
      this.highFpsTime = 0;
    } else if (avg < 45) {
      this.lowFpsTime += dt * 0.5;
      this.highFpsTime = 0;
    } else if (avg > 55) {
      this.highFpsTime += dt;
      this.lowFpsTime = 0;
    } else {
      this.lowFpsTime = 0;
      this.highFpsTime = 0;
    }

    // Degrade after a sustained dip.
    if (this.lowFpsTime > 2.5 && this.tier > 0) {
      this.setTier(this.tier - 1);
      this.lowFpsTime = 0;
      this.cooldown = 3;
    }

    // Recover only after a long, comfortable stretch above 55fps.
    if (this.highFpsTime > 8 && this.tier < 3) {
      this.setTier(this.tier + 1);
      this.highFpsTime = 0;
      this.cooldown = 3;
    }
  }

  setTier(next) {
    if (next === this.tier) return;
    const improving = next > this.tier;
    this.tier = next;
    const store = useStore.getState();

    // Reflect the tier into the individual effect toggles.
    if (improving) {
      // Only restore effects the user has not explicitly turned off.
      const s = store.settings;
      store.setSetting('dof', s.dof || next >= 2);
      store.setSetting('godrays', next >= 2);
      store.setSetting('chromatic', next >= 1);
      store.setSetting('grain', next >= 1);
      store.setQualityNotice(null);
    } else {
      if (next < 2) {
        store.setSetting('dof', false);
        store.setSetting('godrays', false);
      }
      if (next < 1) {
        store.setSetting('chromatic', false);
        store.setSetting('grain', false);
      }
      store.setQualityNotice(
        next === 0
          ? 'Reduced effects for smooth playback'
          : 'Lighter effects for smooth playback'
      );
    }

    // Adjust the resolution scale alongside the tier.
    const scaleByTier = { 3: 1, 2: 1, 1: 0.85, 0: 0.7 };
    store.setResolutionScale(scaleByTier[next] ?? 1);
  }

  reset() {
    this.samples.length = 0;
    this.lowFpsTime = 0;
    this.highFpsTime = 0;
    this.cooldown = 0;
    this.setTier(3);
  }
}
