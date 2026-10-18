import { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { playback } from '../../animation/timeline';

/**
 * Photo Mode.
 *
 * Pauses the timeline, hands the camera to free-orbit controls, exposes FOV and
 * focus sliders, and exports the current frame as a PNG. Exiting restores
 * playback from the exact moment it was paused (the timeline is untouched).
 */
export default function PhotoMode() {
  const photoMode = useStore((s) => s.photoMode);
  const setPhotoMode = useStore((s) => s.setPhotoMode);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const wasPlaying = useRef(false);
  const [fov, setFov] = useState(45);
  const [flash, setFlash] = useState(null);

  // Notify the 3D layer that free-look should be active.
  useEffect(() => {
    window.__photoMode = photoMode;
    if (photoMode) {
      wasPlaying.current = !playback.isPaused;
      playback.pause();
      setIsPlaying(false);
    }
  }, [photoMode, setIsPlaying]);

  const exit = useCallback(() => {
    setPhotoMode(false);
    if (wasPlaying.current) {
      playback.play();
      setIsPlaying(true);
    }
  }, [setPhotoMode, setIsPlaying]);

  const capture = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `ravan-vadh-${Date.now()}.png`;
      a.click();
      setFlash('Photo saved as PNG');
      setTimeout(() => setFlash(null), 1800);
    } catch {
      setFlash('Could not export this frame');
      setTimeout(() => setFlash(null), 1800);
    }
  }, []);

  if (!photoMode) return null;

  return (
    <div className="photo-mode">
      <div className="photo-mode__panel">
        <div className="photo-mode__title">📷 Photo Mode</div>
        <p className="photo-mode__hint">Drag to orbit · Scroll to zoom · Export a PNG</p>

        <label className="slider-row">
          <span>Field of view</span>
          <input
            type="range"
            min="20"
            max="80"
            value={fov}
            onChange={(e) => {
              const v = Number(e.target.value);
              setFov(v);
              window.__photoFov = v;
            }}
          />
          <em>{fov}°</em>
        </label>

        <div className="photo-mode__actions">
          <button className="btn btn--gold" onClick={capture}>
            Export PNG
          </button>
          <button className="btn btn--ghost" onClick={exit}>
            Exit Photo Mode
          </button>
        </div>
      </div>
      {flash && <div className="photo-mode__flash">{flash}</div>}
    </div>
  );
}
