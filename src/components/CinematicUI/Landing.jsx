import { useStore } from '../../store/useStore';
import { scenes, TOTAL_DURATION } from '../../scenes/sceneData';
import { audio } from '../../audio/AudioEngine';

/**
 * The premium landing screen: a full-frame title card over the live 3D
 * background, with quality / Ultra View / sound options and the start button.
 */
export default function Landing() {
  const started = useStore((s) => s.started);
  const ultraView = useStore((s) => s.ultraView);
  const setUltraView = useStore((s) => s.setUltraView);
  const quality = useStore((s) => s.quality);
  const setQuality = useStore((s) => s.setQuality);
  const muted = useStore((s) => s.muted);
  const setMuted = useStore((s) => s.setMuted);
  const setAssetsReady = useStore((s) => s.setAssetsReady);

  if (started) return null;

  const start = () => {
    setAssetsReady(true);
    useStore.getState().setPhase('loading');
    // Small delay so the loading veil can animate before playback begins.
    setTimeout(() => {
      audio.init();
      audio.resume();
      useStore.getState().setStarted(true);
    }, 600);
  };

  const minutes = Math.floor(TOTAL_DURATION / 60);
  const seconds = Math.round(TOTAL_DURATION % 60);

  return (
    <div className="landing">
      <div className="landing__vignette" />

      <div className="landing__content">
        <div className="landing__badge">◈ Interactive 5D Cinematic Experience ◈</div>

        <h1 className="landing__title">॥ श्री रामाय नमः ॥</h1>
        <h2 className="landing__subtitle">श्री राम विजय — रावण वध</h2>
        <p className="landing__tagline">
          The triumph of truth over untruth — an immersive {scenes.length}-scene journey
          through the Ramayana, rendered in real-time 3D.
        </p>

        <div className="landing__meta">
          <span>⏱ {minutes}m {seconds}s</span>
          <span>🎬 {scenes.length} scenes</span>
          <span>✨ Ultra View ready</span>
        </div>

        <div className="landing__options">
          <div className="opt-group">
            <label>Quality</label>
            <div className="seg">
              {['low', 'medium', 'high', 'ultra'].map((q) => (
                <button
                  key={q}
                  className={`seg__btn ${quality === q ? 'is-active' : ''}`}
                  onClick={() => setQuality(q)}
                >
                  {q[0].toUpperCase() + q.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="opt-group opt-row">
            <button
              className={`toggle ${ultraView ? 'is-on' : ''}`}
              onClick={() => setUltraView(!ultraView)}
              title="Premium cinematic presentation (key: U)"
            >
              <span className="toggle__dot" />
              Ultra View
            </button>

            <button
              className={`toggle ${!muted ? 'is-on' : ''}`}
              onClick={() => {
                const next = !muted;
                setMuted(next);
                audio.setMuted(next);
              }}
            >
              <span className="toggle__dot" />
              {muted ? 'Sound Off' : 'Sound On'}
            </button>
          </div>
        </div>

        <button className="btn btn--hero" onClick={start}>
          ▶ Start Cinematic Experience
        </button>

        <p className="landing__photosafety">
          ⚠️ This experience contains flashing lights and camera movement.
          A photosensitivity warning is shown on first play, and every intense
          effect can be tuned in Settings.
        </p>

        <details className="landing__story">
          <summary>Read the story</summary>
          <p>
            On the eve of the great battle, Shri Ram prays for strength while Hanuman Ji
            bows in devotion. The ten-headed Ravan laughs, certain no arrow can end him.
            Volley after volley fails. Then a silence falls, a final divine arrow is drawn
            in golden light — and truth triumphs over untruth. सत्य की असत्य पर विजय।
          </p>
        </details>
      </div>
    </div>
  );
}
