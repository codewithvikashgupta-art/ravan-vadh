import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import SceneController from './components/SceneController/SceneController';
import Landing from './components/CinematicUI/Landing';
import HUD from './components/CinematicUI/HUD';
import LoadingScreen from './components/LoadingScreen';
import LetterboxBars from './effects/ultra/LetterboxBars';
import PhotoMode from './effects/ultra/PhotoMode';
import { useStore } from './store/useStore';
import { audio } from './audio/AudioEngine';

/**
 * Root component.
 *
 * The WebGL canvas is always mounted so the landing screen has a live 3D
 * background. UI layers (landing, HUD, letterbox, photo mode, loading veil)
 * are overlaid on top. All overlays are plain DOM so they never force the 3D
 * scene to re-render.
 */
export default function App() {
  const started = useStore((s) => s.started);
  const ultraView = useStore((s) => s.ultraView);
  const photoMode = useStore((s) => s.photoMode);
  const quality = useStore((s) => s.quality);

  // Clean up audio when the tab unloads.
  useEffect(() => {
    const onUnload = () => audio.dispose();
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  // Choose a sensible default pixel ratio cap per quality preset.
  const dpr = quality === 'ultra' ? 2 : quality === 'low' ? 1 : 1.5;

  return (
    <div className={`app ${ultraView ? 'app--ultra' : ''}`}>
      <Canvas
        className="app__canvas"
        dpr={[1, dpr]}
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          preserveDrawingBuffer: photoMode, // needed for PNG export
        }}
        camera={{ fov: 45, near: 0.1, far: 500, position: [0, 8, 24] }}
        onCreated={({ gl }) => {
          gl.setClearColor('#05030a');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <Suspense fallback={null}>
          <SceneController />
        </Suspense>
      </Canvas>

      <LetterboxBars />
      <Landing />
      <HUD />
      <PhotoMode />
      <LoadingScreen />
    </div>
  );
}
