import ParticleField from './ParticleField';

/**
 * Fire — a fast-rising additive particle field in orange/gold. Intensity is
 * driven by the battle progress inside ParticleField.
 */
export default function FireEffect({ position = [0, 0, 0], count = 400, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <ParticleField
        count={count}
        mode="fire"
        area={[10, 8, 10]}
        origin={[0, 0, 0]}
        color="#ff5a10"
        colorB="#ffd25a"
        size={0.32}
      />
    </group>
  );
}
