import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';

/**
 * Procedural, stylised Shri Ram Ji.
 *
 * Built entirely from Three.js primitives (no external model files) and animated
 * per-scene by sampling `director.sceneIndex` / `director.sceneProgress`.
 * Poses are defined as targets and smoothly damped so transitions between
 * scenes are never snappy.
 */

const SKIN = '#5b7fe0'; // divine blue tone
const SKIN_DARK = '#3f5cc0';
const CLOTH = '#e8892a'; // saffron
const CLOTH_DARK = '#c96f18';
const GOLD = '#f4c542';
const GOLD_DARK = '#b8862a';
const HAIR = '#1c1626';

// Pose targets keyed by scene index. Each entry maps a named rig part to a
// target rotation/position offset. Values are lerped toward over time.
function poseForScene(sceneIndex) {
  switch (sceneIndex) {
    case 0: // opening — standing serene, bow lowered
      return { armL: 0.15, armR: 0.15, draw: 0, headY: 0, breathe: 1, kneel: 0, bowUp: 0 };
    case 1: // puja — hands folded, slight bow of the head
      return { armL: 1.15, armR: 1.15, draw: 0, headY: 0.18, breathe: 1, kneel: 0.25, bowUp: 0 };
    case 2: // hanuman — blessing, right hand raised
      return { armL: 0.5, armR: -0.9, draw: 0, headY: 0.05, breathe: 1, kneel: 0, bowUp: 0 };
    case 3: // war prep — lifting bow, beginning to draw
      return { armL: -0.5, armR: 0.7, draw: 0.4, headY: 0, breathe: 1, kneel: 0, bowUp: 1 };
    case 4: // ravan entrance — tense stance
      return { armL: -0.6, armR: 0.6, draw: 0.3, headY: 0, breathe: 1, kneel: 0, bowUp: 1 };
    case 5: // first arrow — full draw then release handled by progress
      return { armL: -0.7, armR: 0.8, draw: 1, headY: 0, breathe: 1, kneel: 0, bowUp: 1 };
    case 6: // arrow battles — rapid firing
      return { armL: -0.7, armR: 0.8, draw: 1, headY: 0, breathe: 1.1, kneel: 0, bowUp: 1 };
    case 7: // battle peak — dodging, dynamic
      return { armL: -0.5, armR: 0.7, draw: 0.8, headY: -0.1, breathe: 1.2, kneel: 0.1, bowUp: 1 };
    case 8: // final arrow — calm, deliberate draw
      return { armL: -0.72, armR: 0.85, draw: 1, headY: 0, breathe: 0.8, kneel: 0, bowUp: 1 };
    case 9: // ravan vadh — releasing the final arrow
      return { armL: -0.4, armR: 0.4, draw: 0.1, headY: 0, breathe: 1, kneel: 0, bowUp: 1 };
    case 10: // fireworks — victorious, bow lowered, chest out
      return { armL: 0.2, armR: -0.3, draw: 0, headY: -0.05, breathe: 1, kneel: 0, bowUp: 0 };
    case 11: // ending — serene, bow at side
    default:
      return { armL: 0.1, armR: 0.1, draw: 0, headY: 0, breathe: 1, kneel: 0, bowUp: 0 };
  }
}

const lerp = THREE.MathUtils.lerp;
const damp = (c, t, l, dt) => THREE.MathUtils.lerp(c, t, 1 - Math.exp(-l * dt));

export default function RamCharacter({ position = [-4, 0, 0] }) {
  const group = useRef();
  const chest = useRef();
  const head = useRef();
  const armL = useRef();
  const armR = useRef();
  const bowGroup = useRef();
  const bowString = useRef();
  const aura = useRef();
  const arrow = useRef();

  // Live pose state (damped toward targets).
  const pose = useRef({ armL: 0.15, armR: 0.15, draw: 0, headY: 0, breathe: 1, kneel: 0, bowUp: 0 });

  const auraMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffd980',
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  useFrame((state, dt) => {
    const clampedDt = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const target = poseForScene(director.sceneIndex);
    const p = pose.current;

    p.armL = damp(p.armL, target.armL, 6, clampedDt);
    p.armR = damp(p.armR, target.armR, 6, clampedDt);
    p.headY = damp(p.headY, target.headY, 5, clampedDt);
    p.breathe = damp(p.breathe, target.breathe, 4, clampedDt);
    p.kneel = damp(p.kneel, target.kneel, 5, clampedDt);
    p.bowUp = damp(p.bowUp, target.bowUp, 6, clampedDt);

    // Draw progresses quickly at the start of a release scene then resets.
    let drawTarget = target.draw;
    if (director.sceneIndex === 5 || director.sceneIndex === 6) {
      // Snap draw -> release -> redraw within the scene.
      const ph = (director.sceneProgress * 3) % 1;
      drawTarget = ph < 0.6 ? ph / 0.6 : 1 - (ph - 0.6) / 0.4;
    } else if (director.sceneIndex === 8) {
      // Slow, deliberate draw toward the climax.
      drawTarget = Math.min(1, director.sceneProgress * 1.4);
    }
    p.draw = damp(p.draw, drawTarget, 10, clampedDt);

    // Breathing.
    const breathe = Math.sin(t * 1.6) * 0.03 * p.breathe;
    if (chest.current) chest.current.scale.set(1 + breathe, 1 + breathe * 0.6, 1 + breathe);

    // Apply pose.
    if (armL.current) armL.current.rotation.x = -0.2 + p.armL;
    if (armR.current) armR.current.rotation.x = -0.2 + p.armR;
    if (head.current) {
      head.current.rotation.y = p.headY + Math.sin(t * 0.5) * 0.04;
      head.current.rotation.x = p.kneel * 0.4;
    }
    if (group.current) {
      group.current.position.y = -p.kneel * 0.35;
      group.current.rotation.z = Math.sin(t * 0.7) * 0.01;
    }

    // Bow + string + arrow.
    if (bowGroup.current) {
      bowGroup.current.rotation.z = -p.bowUp * 0.2;
      bowGroup.current.position.z = 0.55 + p.draw * 0.02;
    }
    if (bowString.current) {
      // The string is a thin box; scaling Z approximates the draw.
      bowString.current.scale.z = 1 - p.draw * 0.5;
      bowString.current.position.z = -p.draw * 0.28;
    }
    if (arrow.current) {
      arrow.current.position.z = 0.1 + p.draw * 0.35;
      arrow.current.visible = p.draw > 0.05;
    }

    // Divine aura intensity — strongest during the final arrow (scene 8/9).
    if (aura.current) {
      const divine =
        director.sceneIndex === 8
          ? 0.35 + director.sceneProgress * 0.4
          : director.sceneIndex === 9
            ? 0.7
            : director.sceneIndex === 1
              ? 0.25
              : 0.12;
      auraMat.opacity = lerp(auraMat.opacity, divine, 0.08);
      aura.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.04 + divine * 0.3);
      aura.current.rotation.z += clampedDt * 0.2;
    }
  });

  return (
    <group ref={group} position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* Aura */}
      <mesh ref={aura} position={[0, 1.5, -0.3]} material={auraMat}>
        <ringGeometry args={[0.9, 1.5, 48]} />
      </mesh>

      {/* Legs */}
      <group>
        <mesh position={[-0.16, 0.45, 0]} castShadow>
          <capsuleGeometry args={[0.14, 0.6, 6, 12]} />
          <meshStandardMaterial color={CLOTH_DARK} roughness={0.7} />
        </mesh>
        <mesh position={[0.16, 0.45, 0]} castShadow>
          <capsuleGeometry args={[0.14, 0.6, 6, 12]} />
          <meshStandardMaterial color={CLOTH_DARK} roughness={0.7} />
        </mesh>
      </group>

      {/* Torso */}
      <group ref={chest} position={[0, 1.15, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.28, 0.5, 8, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.5} metalness={0.05} />
        </mesh>
        {/* Sash / dhoti top */}
        <mesh position={[0, -0.32, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.42, 0.34, 16]} />
          <meshStandardMaterial color={CLOTH} roughness={0.6} />
        </mesh>
        {/* Sacred thread + ornaments */}
        <mesh position={[0, 0.05, 0.22]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.03, 0.5, 0.02]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.18, 0.24]}>
          <torusGeometry args={[0.12, 0.03, 8, 20]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Head */}
      <group ref={head} position={[0, 1.72, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color={SKIN} roughness={0.45} />
        </mesh>
        {/* Hair / crown base */}
        <mesh position={[0, 0.13, -0.02]} scale={[1, 0.7, 1]} castShadow>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        {/* Crown (mukut) */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <coneGeometry args={[0.15, 0.24, 12]} />
          <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.15} emissive={GOLD_DARK} emissiveIntensity={0.25} />
        </mesh>
        {/* Tilak */}
        <mesh position={[0, 0.04, 0.22]}>
          <boxGeometry args={[0.03, 0.08, 0.01]} />
          <meshStandardMaterial color="#ff5a3c" emissive="#ff5a3c" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={armL} position={[-0.34, 1.42, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.5, 6, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <torusGeometry args={[0.1, 0.02, 8, 16]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      <group ref={armR} position={[0.34, 1.42, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.5, 6, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <torusGeometry args={[0.1, 0.02, 8, 16]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Bow (held in the left hand) */}
      <group ref={bowGroup} position={[-0.36, 1.1, 0.55]}>
        <mesh rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[0.6, 0.035, 10, 32, Math.PI]} />
          <meshStandardMaterial color={GOLD_DARK} metalness={0.6} roughness={0.4} emissive="#3a2a00" emissiveIntensity={0.3} />
        </mesh>
        {/* Bowstring */}
        <mesh ref={bowString} position={[0, 0, 0]}>
          <boxGeometry args={[0.01, 1.2, 0.01]} />
          <meshStandardMaterial color="#eee" roughness={0.4} />
        </mesh>
        {/* Nocked divine arrow */}
        <group ref={arrow} position={[0, 0, 0.1]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.9, 6]} />
            <meshStandardMaterial color="#d8c8a0" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.48]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.035, 0.12, 8]} />
            <meshStandardMaterial
              color="#fff2c0"
              emissive="#ffcf5a"
              emissiveIntensity={2.4}
              metalness={0.3}
              roughness={0.2}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
