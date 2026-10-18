import { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { playback } from '../../animation/timeline';
import { scenes } from '../../scenes/sceneData';
import SettingsPanel from './SettingsPanel';
import { audio } from '../../audio/AudioEngine';

function fmt(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * The minimal, auto-hiding cinematic HUD: play/pause, skip, scene title,
 * a scrubbable progress bar with scene markers, and access to settings,
 * Ultra View, Photo Mode and fullscreen.
 */
export default function HUD() {
  const started = useStore((s) => s.started);
  const phase = useStore((s) => s.phase);
  const isPlaying = useStore((s) => s.isPlaying);
  const sceneIndex = useStore((s) => s.sceneIndex);
  const ultraView = useStore((s) => s.ultraView);
  const setUltraView = useStore((s) => s.setUltraView);
  const muted = useStore((s) => s.muted);
  const setMuted = useStore((s) => s.setMuted);
  const volume = useStore((s) => s.volume);
  const setVolume = useStore((s) => s.setVolume);
  const setPhotoMode = useStore((s) => s.setPhotoMode);
  const fps = useStore((s) => s.fps);
  const qualityNotice = useStore((s) => s.qualityNotice);

  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [hudVisible, setHudVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const idleTimer = useRef(null);
  const barRef = useRef(null);

  // Tick the progress bar from the timeline.
  useEffect(() => {
    let raf;
    const loop = () => {
      setProgress(playback.progress);
      setTime(playback.time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-hide the HUD after inactivity.
  const bump = useCallback(() => {
    setHudVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setHudVisible(false), 3000);
  }, []);

  useEffect(() => {
    bump();
    window.addEventListener('pointermove', bump);
    window.addEventListener('pointerdown', bump);
    return () => {
      window.removeEventListener('pointermove', bump);
      window.removeEventListener('pointerdown', bump);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [bump]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      if (!started) return;
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          playback.toggle();
          useStore.getState().setIsPlaying(!isPlaying);
          audio.resume();
          break;
        case 'arrowright':
          playback.nextScene();
          break;
        case 'arrowleft':
          playback.prevScene();
          break;
        case 'r':
          playback.restart();
          break;
        case 'n':
          playback.replayScene();
          break;
        case 'u':
          setUltraView(!ultraView);
          break;
        case 'p':
          setPhotoMode(!useStore.getState().photoMode);
          break;
        case 'm':
          setMuted(!muted);
          audio.setMuted(!muted);
          break;
        case 'f':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, isPlaying, ultraView, muted, setUltraView, setMuted, setPhotoMode]);

  const scrub = (e) => {
    const rect = barRef.current.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    playback.scrubTo(p);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (!started) return null;

  const scene = scenes[sceneIndex];
  const isEnded = phase === 'ended';

  return (
    <div className={`hud ${hudVisible ? 'is-visible' : 'is-hidden'}`}>
      {/* Scene title, top-left */}
      <div className="hud__top">
        <div className="scene-title">
          <div className="scene-title__index">
            Scene {sceneIndex + 1} / {scenes.length}
          </div>
          <div className="scene-title__hi">{scene.titleHi}</div>
          <div className="scene-title__en">{scene.titleEn}</div>
          <div className="scene-title__sub">{scene.subtitle}</div>
        </div>

        <div className="hud__topright">
          <button className="chip" onClick={() => setUltraView(!ultraView)} title="Toggle Ultra View (U)">
            {ultraView ? '🟧 Ultra View' : '◻ Standard'}
          </button>
          <button className="chip" onClick={() => setSettingsOpen(true)} title="Settings">
            ⚙ Settings
          </button>
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="hud__bottom">
        <div className="progress" ref={barRef} onClick={scrub}>
          <div className="progress__fill" style={{ width: `${progress * 100}%` }} />
          {scenes.map((s, i) => {
            const start = scenes.slice(0, i).reduce((a, b) => a + b.duration, 0);
            const pct = (start / playback.duration) * 100;
            return (
              <span
                key={s.id}
                className={`progress__marker ${i === sceneIndex ? 'is-current' : ''}`}
                style={{ left: `${pct}%` }}
                title={`${i + 1}. ${s.titleEn}`}
                onClick={(e) => {
                  e.stopPropagation();
                  playback.seekScene(i);
                }}
              />
            );
          })}
        </div>

        <div className="controls">
          <div className="controls__left">
            <button className="ctrl" onClick={() => playback.prevScene()} title="Previous scene (←)">
              ⏮
            </button>
            <button
              className="ctrl ctrl--main"
              onClick={() => {
                audio.resume();
                if (isEnded) {
                  playback.restart();
                  useStore.getState().setPhase('playing');
                } else {
                  playback.toggle();
                }
              }}
              title="Play / Pause (Space)"
            >
              {isEnded ? '↻' : isPlaying ? '⏸' : '▶'}
            </button>
            <button className="ctrl" onClick={() => playback.nextScene()} title="Next scene (→)">
              ⏭
            </button>
            <button className="ctrl" onClick={() => playback.replayScene()} title="Replay scene (N)">
              🔁
            </button>
            <span className="timecode">
              {fmt(time)} / {fmt(playback.duration)}
            </span>
          </div>

          <div className="controls__center">
            <span className="now-playing">{scene.titleHi}</span>
          </div>

          <div className="controls__right">
            <span className="fps" title="Frames per second">
              {fps} fps
            </span>
            <button
              className="ctrl"
              onClick={() => {
                setMuted(!muted);
                audio.setMuted(!muted);
              }}
              title="Mute (M)"
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <input
              className="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                audio.setVolume(v);
              }}
              title="Volume"
            />
            <button className="ctrl" onClick={() => setPhotoMode(true)} title="Photo Mode (P)">
              📷
            </button>
            <button className="ctrl" onClick={toggleFullscreen} title="Fullscreen (F)">
              ⛶
            </button>
          </div>
        </div>
      </div>

      {/* End card */}
      {isEnded && (
        <div className="endcard">
          <h2>जय श्री राम! 🚩</h2>
          <p>सत्य की असत्य पर विजय · शुभ विजयादशमी</p>
          <div className="endcard__actions">
            <button className="btn btn--gold" onClick={() => { playback.restart(); useStore.getState().setPhase('playing'); }}>
              ▶ Watch Again
            </button>
            <button className="btn btn--ghost" onClick={() => playback.seekScene(0, { play: true })}>
              ⏮ Back to Opening
            </button>
          </div>
        </div>
      )}

      {/* Quality fallback notice */}
      {qualityNotice && <div className="quality-notice">{qualityNotice}</div>}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
