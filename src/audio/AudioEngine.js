/**
 * Procedural audio engine.
 *
 * Every sound in the experience is synthesized at runtime with the Web Audio
 * API — temple bells, conch, war drums, thunder, arrow whooshes, impacts,
 * fireworks, and the generative background score. Nothing is downloaded and no
 * copyrighted recordings are used.
 *
 * The engine is created lazily inside a user gesture (the Start button) to
 * satisfy browser autoplay policies.
 */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.reverb = null;
    this.reverbGain = null;
    this.muted = false;
    this.volume = 0.8;
    this.currentBed = null;
    this.bedNodes = [];
    this._beatTimer = null;
    this._beat = 0;
    this._initialized = false;
  }

  /** Must be called from a user gesture. */
  init() {
    if (this._initialized && this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(ctx.destination);

    // Buses feed the master; music additionally feeds a shared reverb.
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.55;
    this.musicBus.connect(this.master);

    // Procedural impulse-response reverb (no external IR file needed).
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._makeImpulse(2.6, 2.2);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.35;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.master);
    this.musicBus.connect(this.reverb);

    this._initialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  setMuted(muted) {
    this.muted = muted;
    if (!this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : this.volume, now + 0.15);
  }

  setVolume(volume) {
    this.volume = clamp(volume, 0, 1);
    if (!this.master || this.muted) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(this.volume, now + 0.1);
  }

  get time() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // -------------------------------------------------------------------------
  // Building blocks
  // -------------------------------------------------------------------------

  _makeImpulse(duration, decay) {
    const ctx = this.ctx;
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return impulse;
  }

  _noiseBuffer(seconds = 1) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  _env(node, t0, attack, peak, decay, sustain = 0.0001) {
    const g = node.gain;
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t0 + attack);
    g.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t0 + attack + decay);
  }

  // -------------------------------------------------------------------------
  // One-shot SFX
  // -------------------------------------------------------------------------

  /** Metallic temple bell with a long, shimmering tail. */
  bell({ freq = 440, gain = 0.5, decay = 2.6 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = gain;
    out.connect(this.sfxBus);
    out.connect(this.reverb);

    const partials = [1, 2.01, 2.98, 4.12, 5.4];
    partials.forEach((p, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * p;
      const g = ctx.createGain();
      this._env(g, t0, 0.004, 0.5 / (i + 1), decay / (i * 0.6 + 1));
      osc.connect(g);
      g.connect(out);
      osc.start(t0);
      osc.stop(t0 + decay + 0.2);
    });
  }

  /** Deep conch (shankha) — a breathy, swelling horn tone. */
  conch({ freq = 150, gain = 0.45, dur = 2.2 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const out = ctx.createGain();
    out.connect(this.sfxBus);
    out.connect(this.reverb);
    this._env(out, t0, dur * 0.25, gain, dur * 0.75);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 0.9, t0);
    osc.frequency.linearRampToValueAtTime(freq, t0 + dur * 0.4);

    const filter = ctx.createGain();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq * 3;
    bp.Q.value = 3;

    osc.connect(bp);
    bp.connect(filter);
    filter.connect(out);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  /** War drum / dhol hit. */
  drum({ freq = 90, gain = 0.7, decay = 0.5 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const out = ctx.createGain();
    out.gain.value = gain;
    out.connect(this.sfxBus);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 2.2, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t0 + decay);
    const g = ctx.createGain();
    this._env(g, t0, 0.002, 1, decay);
    osc.connect(g);
    g.connect(out);
    osc.start(t0);
    osc.stop(t0 + decay + 0.1);

    // Skin noise transient.
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(0.2);
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 1200;
    const ng = ctx.createGain();
    this._env(ng, t0, 0.001, 0.6, 0.12);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(out);
    noise.start(t0);
    noise.stop(t0 + 0.25);
  }

  /** Bowstring release + arrow whoosh (rising filtered noise). */
  arrowRelease({ gain = 0.6, dur = 0.7, up = true } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(dur);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.6;
    bp.frequency.setValueAtTime(up ? 400 : 2600, t0);
    bp.frequency.exponentialRampToValueAtTime(up ? 2600 : 500, t0 + dur);

    const g = ctx.createGain();
    this._env(g, t0, 0.02, gain, dur);

    noise.connect(bp);
    bp.connect(g);
    g.connect(this.sfxBus);
    noise.start(t0);
    noise.stop(t0 + dur + 0.05);

    // Wooden "thrum" of the string.
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t0);
    osc.frequency.exponentialRampToValueAtTime(120, t0 + 0.18);
    const og = ctx.createGain();
    this._env(og, t0, 0.003, 0.35, 0.2);
    osc.connect(og);
    og.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + 0.3);
  }

  /** Sharp metallic impact / spark burst. */
  impact({ gain = 0.8, dur = 0.5 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(dur);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const g = ctx.createGain();
    this._env(g, t0, 0.001, gain, dur);
    noise.connect(hp);
    hp.connect(g);
    g.connect(this.sfxBus);
    g.connect(this.reverb);
    noise.start(t0);
    noise.stop(t0 + dur + 0.05);

    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(160, t0);
    thump.frequency.exponentialRampToValueAtTime(40, t0 + dur * 0.6);
    const tg = ctx.createGain();
    this._env(tg, t0, 0.002, 0.7, dur * 0.6);
    thump.connect(tg);
    tg.connect(this.sfxBus);
    thump.start(t0);
    thump.stop(t0 + dur + 0.1);
  }

  /** Rolling thunder — layered filtered noise. */
  thunder({ gain = 0.8, dur = 3.2 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const noise = ctx.createBufferSource();
      noise.buffer = this._noiseBuffer(dur);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(600 - i * 120, t0);
      lp.frequency.exponentialRampToValueAtTime(90, t0 + dur);
      const g = ctx.createGain();
      const off = i * 0.18;
      this._env(g, t0 + off, 0.15, gain / (i + 1.2), dur - off);
      noise.connect(lp);
      lp.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.reverb);
      noise.start(t0 + off);
      noise.stop(t0 + dur + 0.1);
    }
  }

  /** Energy / divine aura shimmer. */
  energy({ gain = 0.4, dur = 1.6, freq = 660 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const out = ctx.createGain();
    out.connect(this.sfxBus);
    out.connect(this.reverb);
    this._env(out, t0, dur * 0.3, gain, dur * 0.7);

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * (1 + i * 0.5) * (1 + (Math.random() - 0.5) * 0.01);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 3 + i;
      const lg = ctx.createGain();
      lg.gain.value = freq * 0.02;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      osc.connect(out);
      osc.start(t0);
      lfo.start(t0);
      osc.stop(t0 + dur);
      lfo.stop(t0 + dur);
    }
  }

  /** Firework launch whistle then crackle burst. */
  firework({ gain = 0.55, hue = 0 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    // Launch whistle.
    const whistle = ctx.createOscillator();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(700 + hue * 300, t0);
    whistle.frequency.exponentialRampToValueAtTime(1800 + hue * 300, t0 + 0.7);
    const wg = ctx.createGain();
    this._env(wg, t0, 0.05, 0.18, 0.7);
    whistle.connect(wg);
    wg.connect(this.sfxBus);
    whistle.start(t0);
    whistle.stop(t0 + 0.8);

    // Burst crackle.
    const bt = t0 + 0.72;
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(0.9);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2200 + hue * 800;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    this._env(g, bt, 0.004, gain, 0.85);
    noise.connect(bp);
    bp.connect(g);
    g.connect(this.sfxBus);
    g.connect(this.reverb);
    noise.start(bt);
    noise.stop(bt + 0.95);

    const boom = ctx.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(120, bt);
    boom.frequency.exponentialRampToValueAtTime(35, bt + 0.5);
    const bg = ctx.createGain();
    this._env(bg, bt, 0.003, 0.6, 0.5);
    boom.connect(bg);
    bg.connect(this.sfxBus);
    boom.start(bt);
    boom.stop(bt + 0.6);
  }

  /** Low heartbeat pulse used to build tension. */
  heartbeat({ gain = 0.7 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    [0, 0.22].forEach((off, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, t0 + off);
      osc.frequency.exponentialRampToValueAtTime(30, t0 + off + 0.16);
      const g = ctx.createGain();
      this._env(g, t0 + off, 0.01, gain / (i + 1.3), 0.2);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t0 + off);
      osc.stop(t0 + off + 0.3);
    });
  }

  // -------------------------------------------------------------------------
  // Generative music beds
  // -------------------------------------------------------------------------

  /**
   * Cross-fade to a mood bed. Each mood is a generative loop built from
   * oscillators so no audio files are required.
   */
  setSceneMood(mood) {
    if (!this.ctx) return;
    if (this.currentBed === mood) return;
    this.currentBed = mood;
    this._stopBed();

    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const beds = {
      devotional: { root: 220, scale: [0, 2, 4, 7, 9], bpm: 62, type: 'sine', bright: true },
      tension: { root: 110, scale: [0, 1, 5, 7, 8], bpm: 84, type: 'sawtooth', bright: false },
      menace: { root: 98, scale: [0, 1, 3, 6, 7], bpm: 92, type: 'sawtooth', bright: false },
      battle: { root: 73, scale: [0, 3, 5, 7, 10], bpm: 128, type: 'square', bright: false },
      climax: { root: 110, scale: [0, 4, 7, 11, 14], bpm: 70, type: 'sine', bright: true },
      victory: { root: 147, scale: [0, 4, 7, 9, 11], bpm: 100, type: 'sine', bright: true },
      celebration: { root: 196, scale: [0, 2, 4, 7, 9], bpm: 116, type: 'triangle', bright: true },
      peace: { root: 175, scale: [0, 2, 4, 7, 9], bpm: 56, type: 'sine', bright: true },
    };

    const cfg = beds[mood] || beds.devotional;

    // Drone
    const drone = ctx.createOscillator();
    drone.type = cfg.type === 'sine' ? 'sine' : 'sawtooth';
    drone.frequency.value = cfg.root / 2;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = cfg.bright ? 900 : 420;
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.0001, t0);
    droneGain.gain.exponentialRampToValueAtTime(0.16, t0 + 1.5);
    drone.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.musicBus);
    drone.start(t0);
    this.bedNodes.push(drone, droneGain);

    // Pad (two detuned voices for width)
    [0, 4].forEach((detune) => {
      const pad = ctx.createOscillator();
      pad.type = cfg.bright ? 'triangle' : 'sawtooth';
      pad.frequency.value = cfg.root;
      pad.detune.value = detune;
      const pf = ctx.createBiquadFilter();
      pf.type = 'lowpass';
      pf.frequency.value = cfg.bright ? 1600 : 700;
      const pg = ctx.createGain();
      pg.gain.setValueAtTime(0.0001, t0);
      pg.gain.exponentialRampToValueAtTime(0.07, t0 + 2);
      pad.connect(pf);
      pf.connect(pg);
      pg.connect(this.musicBus);
      pad.start(t0);
      this.bedNodes.push(pad, pg);
    });

    // Generative melodic plucks scheduled on a repeating interval.
    const beatMs = (60 / cfg.bpm) * 1000;
    let step = 0;
    this._beatTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const deg = cfg.scale[Math.floor(Math.random() * cfg.scale.length)];
      const oct = Math.random() < 0.3 ? 2 : 1;
      const freq = cfg.root * oct * Math.pow(2, deg / 12);
      this._pluck(freq, cfg.bright ? 0.12 : 0.08, cfg.type);
      if (cfg.bpm > 100 && step % 2 === 0) this.drum({ freq: cfg.root, gain: 0.22, decay: 0.3 });
      step++;
    }, beatMs);
  }

  _pluck(freq, gain = 0.12, type = 'sine') {
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type === 'sawtooth' ? 'triangle' : type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    this._env(g, t0, 0.01, gain, 0.8);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.musicBus);
    g.connect(this.reverb);
    osc.start(t0);
    osc.stop(t0 + 1);
  }

  _stopBed() {
    if (this._beatTimer) {
      clearInterval(this._beatTimer);
      this._beatTimer = null;
    }
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.bedNodes.forEach((n) => {
      try {
        if (n.gain) {
          n.gain.cancelScheduledValues(now);
          n.gain.setValueAtTime(n.gain.value, now);
          n.gain.linearRampToValueAtTime(0.0001, now + 1.2);
        }
        if (n.stop) n.stop(now + 1.3);
      } catch {
        /* node already stopped */
      }
    });
    this.bedNodes = [];
  }

  /** Convenience: a scene-entry stinger appropriate to the mood. */
  playStinger(mood) {
    switch (mood) {
      case 'devotional':
        this.bell({ freq: 523, gain: 0.4, decay: 3 });
        break;
      case 'menace':
        this.thunder({ gain: 0.5, dur: 2.4 });
        break;
      case 'battle':
        this.drum({ freq: 70, gain: 0.7, decay: 0.7 });
        break;
      case 'climax':
        this.energy({ gain: 0.35, dur: 2.4, freq: 880 });
        break;
      case 'victory':
        this.conch({ freq: 180, gain: 0.5, dur: 2.6 });
        break;
      case 'celebration':
        this.firework({ gain: 0.5, hue: Math.random() });
        break;
      case 'peace':
        this.bell({ freq: 392, gain: 0.35, decay: 4 });
        break;
      default:
        this.bell({ freq: 440, gain: 0.35, decay: 2.6 });
    }
  }

  dispose() {
    this._stopBed();
    try {
      this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this._initialized = false;
  }
}

/** Singleton so every component shares one audio graph. */
export const audio = new AudioEngine();
