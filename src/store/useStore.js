import { create } from 'zustand';

/**
 * Global UI / configuration store.
 *
 * Anything that changes React state (and therefore re-renders the HUD) lives
 * here. Per-frame animation values (scene progress, pulses) deliberately do
 * NOT live here — see `director.js` — so we never trigger React renders at 60fps.
 */
export const useStore = create((set, get) => ({
  // ---- lifecycle -----------------------------------------------------------
  phase: 'landing', // 'landing' | 'loading' | 'playing' | 'ended'
  started: false,
  assetsReady: false,

  // ---- playback ------------------------------------------------------------
  isPlaying: false,
  sceneIndex: 0,
  totalScenes: 12,

  // ---- presentation --------------------------------------------------------
  ultraView: false,
  directorsCut: true, // use the Ultra/Director camera track when in Ultra View
  quality: 'high', // 'low' | 'medium' | 'high' | 'ultra'
  resolutionScale: 1,
  photoMode: false,

  // ---- audio ---------------------------------------------------------------
  muted: false,
  volume: 0.8,

  // ---- effects toggles (safety / accessibility) ----------------------------
  settings: {
    bloom: true,
    godrays: true,
    dof: true,
    flash: true, // screen-space flashes
    shake: true, // camera shake
    grain: true,
    chromatic: true,
    vibration: true,
  },

  // ---- environment ---------------------------------------------------------
  reducedMotion: false,
  fps: 60,
  qualityNotice: null, // string shown when auto-fallback kicks in

  // ---- actions -------------------------------------------------------------
  setPhase: (phase) => set({ phase }),
  setStarted: (started) => set({ started }),
  setAssetsReady: (assetsReady) => set({ assetsReady }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSceneIndex: (sceneIndex) => set({ sceneIndex }),
  setUltraView: (ultraView) => set({ ultraView }),
  setDirectorsCut: (directorsCut) => set({ directorsCut }),
  setQuality: (quality) => set({ quality }),
  setResolutionScale: (resolutionScale) => set({ resolutionScale }),
  setPhotoMode: (photoMode) => set({ photoMode }),
  setMuted: (muted) => set({ muted }),
  setVolume: (volume) => set({ volume }),
  setFps: (fps) => set({ fps }),
  setQualityNotice: (qualityNotice) => set({ qualityNotice }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),

  setSetting: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } })),

  toggleSetting: (key) =>
    set((s) => ({ settings: { ...s.settings, [key]: !s.settings[key] } })),

  /** Read helper for effects code that runs outside React. */
  getSetting: (key) => get().settings[key],
}));
