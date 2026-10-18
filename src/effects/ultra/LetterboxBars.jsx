import { useStore } from '../../store/useStore';

/**
 * Anamorphic 2.39:1 letterbox frame for Ultra View.
 *
 * The bars animate in/out with a CSS transform so toggling Ultra View mid-
 * playback never disturbs the WebGL canvas or the timeline. On portrait mobile
 * we show a gentle "rotate for Ultra View" hint instead of a distorted frame.
 */
export default function LetterboxBars() {
  const ultraView = useStore((s) => s.ultraView);
  const started = useStore((s) => s.started);
  const visible = ultraView && started;

  return (
    <>
      <div className={`letterbox letterbox--top ${visible ? 'is-visible' : ''}`} />
      <div className={`letterbox letterbox--bottom ${visible ? 'is-visible' : ''}`} />
      <div className={`ultra-hint ${visible ? 'is-visible' : ''}`}>
        <span>↻ Rotate your device for the full Ultra View frame</span>
      </div>
    </>
  );
}
