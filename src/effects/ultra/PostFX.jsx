import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ChromaticAberration,
  Noise,
  Vignette,
  SMAA,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { useStore } from '../../store/useStore';
import { director } from '../../animation/director';

/**
 * The Ultra View visual stack.
 *
 * Mounted inside the Canvas. Individual passes read their on/off state from the
 * store, so the user can independently toggle bloom, DOF, god rays, grain and
 * chromatic aberration, and the adaptive-quality monitor can drop tiers without
 * tearing down the whole composer.
 *
 * In Standard View this component renders a minimal composer (just SMAA + a
 * touch of tone contrast) so the frame still looks clean without the heavy
 * cinematic passes.
 */
export default function PostFX() {
  const ultraView = useStore((s) => s.ultraView);
  const settings = useStore((s) => s.settings);
  const resolutionScale = useStore((s) => s.resolutionScale);
  const quality = useStore((s) => s.quality);
  const gl = useThree((s) => s.gl);

  // Drive tone mapping + resolution scaling.
  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2) * resolutionScale);
  }, [gl, resolutionScale]);

  // ACES filmic tone mapping with an HDR-ish exposure, pushed higher in Ultra.
  useEffect(() => {
    // three.js exposes ToneMapping via the renderer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    gl.toneMapping = 4; // THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = ultraView ? 1.05 : 1.0;
  }, [gl, ultraView]);

  // Chromatic aberration offset grows with the director's impact impulse so
  // big hits punch without needing a per-frame re-render of React.
  const chromaOffset = useMemo(() => [0.0006, 0.0006], []);

  const bloomIntensity = ultraView ? 0.9 : 0.5;
  const luminanceThreshold = ultraView ? 0.82 : 0.9;

  if (!ultraView) {
    // Standard view — light, cheap stack.
    return (
      <EffectComposer multisampling={quality !== 'low' ? 4 : 0} enableNormalPass={false}>
        <Bloom intensity={0.5} mipmapBlur={false} luminanceThreshold={0.6} luminanceSmoothing={0.2} />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.32} />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
        <SMAA />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={quality === 'ultra' ? 6 : 4} enableNormalPass={false}>
      {settings.bloom && (
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={luminanceThreshold}
          luminanceSmoothing={0.3}
          mipmapBlur={false}
          kernelSize={KernelSize.LARGE}
        />
      )}
      {settings.dof && (
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.05}
          bokehScale={3.2}
          height={480}
        />
      )}
      {settings.chromatic && (
        <ChromaticAberration offset={chromaOffset} radialModulation modulationOffset={0.3} />
      )}
      {settings.grain && <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.42} />}
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
      <SMAA />
    </EffectComposer>
  );
}
