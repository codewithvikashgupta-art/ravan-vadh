import { useStore } from '../../store/useStore';

/**
 * Settings panel: independent controls for every intense effect plus the
 * presentation options. Everything here is individually toggleable and respects
 * `prefers-reduced-motion`.
 */
const TOGGLES = [
  ['bloom', 'Bloom (divine glow)'],
  ['godrays', 'God rays'],
  ['dof', 'Depth of field'],
  ['flash', 'Screen flashes'],
  ['shake', 'Camera shake'],
  ['chromatic', 'Chromatic aberration'],
  ['grain', 'Film grain'],
  ['vibration', 'Haptic vibration (mobile)'],
];

export default function SettingsPanel({ open, onClose }) {
  const settings = useStore((s) => s.settings);
  const toggleSetting = useStore((s) => s.toggleSetting);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setReducedMotion = useStore((s) => s.setReducedMotion);
  const directorsCut = useStore((s) => s.directorsCut);
  const setDirectorsCut = useStore((s) => s.setDirectorsCut);
  const resolutionScale = useStore((s) => s.resolutionScale);
  const setResolutionScale = useStore((s) => s.setResolutionScale);

  if (!open) return null;

  return (
    <div className="settings" onClick={onClose}>
      <div className="settings__panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings__head">
          <h3>⚙ Settings</h3>
          <button className="ctrl" onClick={onClose}>
            ✕
          </button>
        </div>

        <section>
          <h4>Visual effects</h4>
          {TOGGLES.map(([key, label]) => (
            <label key={key} className="setting-row">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={() => toggleSetting(key)}
              />
            </label>
          ))}
        </section>

        <section>
          <h4>Presentation</h4>
          <label className="setting-row">
            <span>Director’s Cut camera track</span>
            <input
              type="checkbox"
              checked={directorsCut}
              onChange={() => setDirectorsCut(!directorsCut)}
            />
          </label>
          <label className="slider-row">
            <span>Resolution scale</span>
            <input
              type="range"
              min="0.75"
              max="2"
              step="0.05"
              value={resolutionScale}
              onChange={(e) => setResolutionScale(Number(e.target.value))}
            />
            <em>{resolutionScale.toFixed(2)}×</em>
          </label>
        </section>

        <section>
          <h4>Accessibility</h4>
          <label className="setting-row">
            <span>Reduced motion</span>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={() => setReducedMotion(!reducedMotion)}
            />
          </label>
          <p className="settings__note">
            Reduced motion automatically disables dolly-zooms, bullet-time orbits,
            camera shake and flicker. Your system preference is detected on load.
          </p>
        </section>

        <p className="settings__note">
          Keyboard: <b>Space</b> play/pause · <b>←/→</b> scene · <b>N</b> replay scene ·
          <b> R</b> restart · <b>U</b> Ultra View · <b>P</b> photo mode · <b>M</b> mute ·
          <b> F</b> fullscreen
        </p>
      </div>
    </div>
  );
}
