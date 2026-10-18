import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import Environment from '../../effects/Environment';
import RamCharacter from '../../characters/RamCharacter';
import HanumanCharacter from '../../characters/HanumanCharacter';
import RavanCharacter from '../../characters/RavanCharacter';
import FireEffect from '../../effects/FireEffect';
import SmokeEffect from '../../effects/SmokeEffect';
import LightningEffect from '../../effects/LightningEffect';
import DivineArrowEffect from '../../effects/DivineArrowEffect';
import FireworksEffect from '../../effects/FireworksEffect';
import ShockwaveEffect from '../../effects/ShockwaveEffect';
import GodRays from '../../effects/GodRays';
import LensFlare from '../../effects/LensFlare';
import PostFX from '../../effects/ultra/PostFX';
import CameraRig from './CameraRig';
import { AdaptiveQuality } from '../../animation/adaptiveQuality';
import { buildTimeline, playback } from '../../animation/timeline';
import { director } from '../../animation/director';
import { audio } from '../../audio/AudioEngine';
import { useStore } from '../../store/useStore';
import { scenes } from '../../scenes/sceneData';

/**
 * The 3D world + the master timeline host.
 *
 * Mounts the whole scene graph, builds the single GSAP master timeline, and
 * drives the frame loop: advancing the director, sampling adaptive quality,
 * and switching the music bed when the scene mood changes.
 */
export default function SceneController() {
  const gl = useThree((s) => s.gl);
  const started = useStore((s) => s.started);
  const quality = useRef(new AdaptiveQuality());
  const lastScene = useRef(-1);

  // Begin playback once the landing screen hands over and the loading veil
  // has had time to finish. This is what flips the phase from 'loading' to
  // 'playing' and dismisses the loading screen.
  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => {
      try {
        audio.resume();
      } catch {
        /* audio is optional */
      }
      useStore.getState().setPhase('playing');
      playback.play();
    }, 750);
    return () => clearTimeout(t);
  }, [started]);

  // Build + bind the master timeline once.
  useEffect(() => {
    const setSceneIndex = useStore.getState().setSceneIndex;
    const setIsPlaying = useStore.getState().setIsPlaying;
    const setPhase = useStore.getState().setPhase;

    const tl = buildTimeline((time, index) => {
      if (index !== lastScene.current) {
        lastScene.current = index;
        setSceneIndex(index);
        audio.setSceneMood(scenes[index].mood);
        audio.playStinger(scenes[index].mood);
      }
    });
    playback.bind(tl);

    tl.eventCallback('onStart', () => {
      setIsPlaying(true);
      useStore.getState().setPhase('playing');
    });
    tl.eventCallback('onPause', () => setIsPlaying(false));
    tl.eventCallback('onComplete', () => {
      setIsPlaying(false);
      setPhase('ended');
    });

    return () => {
      playback.unbind();
      tl.kill();
    };
  }, []);

  // Mirror reduced-motion preference.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    useStore.getState().setReducedMotion(mq.matches);
    const onChange = (e) => useStore.getState().setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Frame loop.
  useFrame((state, dt) => {
    const cdt = Math.min(dt, 0.05);
    director.update(cdt);
    quality.current.sample(cdt);

    // Optional low-level vibration feedback on impacts (mobile only).
    const { settings, reducedMotion } = useStore.getState();
    if (
      settings.vibration &&
      !reducedMotion &&
      director.impact > 0.9 &&
      navigator.vibrate &&
      state.clock.elapsedTime - (lastVibrate.current || 0) > 0.5
    ) {
      lastVibrate.current = state.clock.elapsedTime;
      navigator.vibrate(40);
    }
  });

  return (
    <>
      <CameraRig />
      <PostFX />

      <Environment />

      {/* Characters */}
      <RamCharacter position={[-4, 0, 0]} />
      <HanumanCharacter position={[-8, 0, -2.5]} />
      <RavanCharacter position={[7, 0.6, 0]} />

      {/* Atmosphere + effects */}
      <ParticleLayers />
      <DivineArrowEffect />
      <ShockwaveEffect position={[6.7, 2.4, 0]} />
      <FireworksEffect center={[0, 16, -28]} />
      <LightningEffect origin={[0, 30, -34]} count={2} />
      <GodRays position={[0, 22, -46]} />
      <LensFlare position={[6.7, 2.6, 0]} />
    </>
  );
}

const lastVibrate = { current: 0 };

/** Scene-gated particle layers (embers, battle fire, battlefield smoke). */
function ParticleLayers() {
  return (
    <>
      {/* Floating embers / golden dust — always present, gentle. */}
      <EmberLayer />
      {/* Battle fire + smoke fade in from the war scenes. */}
      <BattleAtmosphere />
    </>
  );
}

import ParticleField from '../../effects/ParticleField';

function EmberLayer() {
  return <ParticleField count={280} mode="embers" area={[60, 18, 60]} origin={[0, 0, -10]} color="#ffb050" colorB="#ffe6a0" size={0.12} />;
}

function BattleAtmosphere() {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const on = director.sceneIndex >= 6 && director.sceneIndex <= 10;
    ref.current.visible = on;
  });
  return (
    <group ref={ref} visible={false}>
      <FireEffect position={[4, 0, -6]} count={300} scale={1.4} />
      <SmokeEffect position={[2, 0, -4]} count={20} scale={1.6} color="#4a4058" />
      <SmokeEffect position={[8, 0, -10]} count={16} scale={2.2} color="#3a3048" />
    </group>
  );
}
