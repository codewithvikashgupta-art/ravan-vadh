import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';

/**
 * Procedural, stylised Ravan — the ten-headed (Dashanana) king of Lanka.
 *
 * The ten heads are arranged in a single horizontal arc across the shoulders so
 * they read as naturally attached rather than floating. Each head carries its
 * own crown and follows the body with a small phase offset, giving coordinated
 * but distinct motion. He stands upon a golden chariot.
 *
 * No grotesque imagery: the defeat is conveyed through posture, light and the
 * fall, not through graphic detail.
 */

const SKIN = '#8a4b3a';
const SKIN_DARK = '#6a3529';
const CLOTH = '#8e1b2e'; // royal crimson
const GOLD = '#f4c542';
const GOLD_DARK = '#b8862a';
const ARMOR = '#2a2036';
const AURA = '#5a0f18'; // dark red aura

function poseForScene(sceneIndex) {
  switch (sceneIndex) {
    case 3: // revealed in the distance
      return { laugh: 0, armsUp: 0, recoil: 0, fall: 0, heads: 1, aura: 0.3 };
    case 4: // grand entrance — laughing, confident
      return { laugh: 1, armsUp: 0.3, recoil: 0, fall: 0, heads: 1.4, aura: 0.8 };
    case 5: // hit by first arrow but unbothered
      return { laugh: 1, armsUp: 0.5, recoil: 0.15, fall: 0, heads: 1.3, aura: 0.8 };
    case 6: // deflecting volleys, laughing
      return { laugh: 1, armsUp: 0.8, recoil: 0.2, fall: 0, heads: 1.5, aura: 0.9 };
    case 7: // unleashing counterattack
      return { laugh: 0.7, armsUp: 1, recoil: 0.3, fall: 0, heads: 1.7, aura: 1 };
    case 8: // confidence fading as the final arrow is drawn
      return { laugh: 0.2, armsUp: 0.4, recoil: 0.1, fall: 0, heads: 1, aura: 0.7 };
    case 9: // struck — surprise, then the fall
      return { laugh: 0, armsUp: 0.2, recoil: 1, fall: 1, heads: 0.6, aura: 1 };
    default:
      return { laugh: 0, armsUp: 0, recoil: 0, fall: 0, heads: 1, aura: 0 };
  }
}

const damp = (c, t, l, dt) => THREE.MathUtils.lerp(c, t, 1 - Math.exp(-l * dt));

/** One of the ten heads, with its own crown. */
function Head({ x, scale = 1, phase = 0, laugh, recoil }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ref.current) return;
    // Nod with a phase offset so the ten heads feel individually alive.
    ref.current.rotation.z = Math.sin(t * 3 + phase) * 0.06 * laugh;
    ref.current.rotation.x = Math.sin(t * 2 + phase) * 0.04 - recoil * 0.25;
    // Laughing heads open the mouth a touch.
  });
  return (
    <group ref={ref} position={[x, 0, 0]} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.55} />
      </mesh>
      {/* Beard / jaw */}
      <mesh position={[0, -0.14, 0.06]} scale={[0.9, 0.7, 0.8]} castShadow>
        <sphereGeometry args={[0.15, 14, 14]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 0.05, 0.19]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshStandardMaterial color="#1a0d08" emissive="#ff3020" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.08, 0.05, 0.19]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshStandardMaterial color="#1a0d08" emissive="#ff3020" emissiveIntensity={0.5} />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 0.26, 0]} castShadow>
        <coneGeometry args={[0.15, 0.26, 10]} />
        <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.15} emissive={GOLD_DARK} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <torusGeometry args={[0.16, 0.025, 8, 20]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function RavanCharacter({ position = [7, 0.6, 0] }) {
  const group = useRef();
  const body = useRef();
  const headsGroup = useRef();
  const arms = useRef();
  const cape = useRef();
  const aura = useRef();
  const chariot = useRef();
  const pose = useRef({ laugh: 0, armsUp: 0, recoil: 0, fall: 0, heads: 1, aura: 0 });

  const auraMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: AURA,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  // Ten head x-offsets arranged across the shoulders.
  const headXs = useMemo(() => {
    const xs = [];
    const spread = 0.34;
    for (let i = 0; i < 10; i++) {
      xs.push((i - 4.5) * spread);
    }
    return xs;
  }, []);

  useFrame((state, dt) => {
    const cdt = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const target = poseForScene(director.sceneIndex);
    const p = pose.current;

    p.laugh = damp(p.laugh, target.laugh, 5, cdt);
    p.armsUp = damp(p.armsUp, target.armsUp, 5, cdt);
    p.recoil = damp(p.recoil, target.recoil, 12, cdt);
    p.fall = damp(p.fall, target.fall, 3, cdt);
    p.aura = damp(p.aura, target.aura, 3, cdt);

    const breathe = Math.sin(t * 1.4) * 0.035;
    if (body.current) body.current.scale.set(1 + breathe, 1 + breathe * 0.5, 1 + breathe);

    // Confident sway + recoil jolt + the final cinematic fall.
    if (group.current) {
      const sway = Math.sin(t * 0.8) * 0.04 * p.laugh;
      const jolt = p.recoil * Math.sin(t * 40) * 0.05;
      group.current.rotation.z = sway + jolt - p.fall * 1.4;
      group.current.rotation.y = -Math.PI / 2 + Math.sin(t * 0.4) * 0.05 * p.laugh;
      group.current.position.y = position[1] - p.fall * 0.4;
      // As he falls he drifts back and sinks.
      group.current.position.x = position[0] + p.fall * 0.6;
    }

    // Ten heads share a base orientation with per-head life added in <Head/>.
    if (headsGroup.current) {
      headsGroup.current.scale.x = 1 + p.laugh * 0.04;
      headsGroup.current.position.y = 1.9 + p.recoil * 0.05;
    }

    if (arms.current) {
      arms.current.children.forEach((arm, i) => {
        const side = i === 0 ? 1 : -1;
        arm.rotation.x = -0.3 - p.armsUp * 1.4 + Math.sin(t * 3 + i) * 0.08 * p.laugh;
        arm.rotation.z = side * (0.3 + p.armsUp * 0.5);
      });
    }

    if (cape.current) {
      cape.current.rotation.x = 0.3 + Math.sin(t * 1.6) * 0.08 + p.armsUp * 0.15;
    }

    if (aura.current) {
      auraMat.opacity = lerp2(auraMat.opacity, p.aura * 0.5, 0.06);
      aura.current.scale.setScalar(1 + Math.sin(t * 1.8) * 0.05 + p.aura * 0.2);
    }

    if (chariot.current) {
      // The chariot shudders on the fatal impact.
      chariot.current.position.x = Math.sin(t * 50) * 0.03 * p.recoil;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Chariot base */}
      <group ref={chariot} position={[0, -0.6, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.2, 0.3, 1.6]} />
          <meshStandardMaterial color={GOLD_DARK} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[1.9, 0.2, 1.4]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Wheels */}
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, -0.2, 0.85]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[0.42, 0.08, 10, 24]} />
            <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Flag pole */}
        <mesh position={[-1, 1, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2, 8]} />
          <meshStandardMaterial color={GOLD_DARK} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[-0.7, 1.7, 0]}>
          <planeGeometry args={[0.6, 0.4]} />
          <meshStandardMaterial color={CLOTH} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Aura */}
      <mesh ref={aura} position={[0, 1.4, -0.2]} material={auraMat}>
        <ringGeometry args={[1.1, 2.0, 40]} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.2, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.6, 6, 12]} />
        <meshStandardMaterial color={ARMOR} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0.2, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.6, 6, 12]} />
        <meshStandardMaterial color={ARMOR} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Torso with heavy royal armour */}
      <group ref={body} position={[0, 1.3, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.42, 0.6, 8, 20]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.05, 0.1]} scale={[1.05, 1.15, 0.75]} castShadow>
          <sphereGeometry args={[0.42, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={ARMOR} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[0.4, 0.05, 10, 28]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD_DARK} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.44, 0.5, 0.3, 20]} />
          <meshStandardMaterial color={CLOTH} roughness={0.6} />
        </mesh>
      </group>

      {/* Cape */}
      <mesh ref={cape} position={[0, 1.5, -0.35]} rotation={[0.3, 0, 0]} castShadow>
        <planeGeometry args={[1.1, 1.4]} />
        <meshStandardMaterial color={CLOTH} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>

      {/* Arms */}
      <group ref={arms}>
        <group position={[-0.52, 1.6, 0]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.55, 6, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.55} />
          </mesh>
        </group>
        <group position={[0.52, 1.6, 0]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.55, 6, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.55} />
          </mesh>
        </group>
      </group>

      {/* Ten heads arranged across the shoulders */}
      <group ref={headsGroup} position={[0, 1.9, 0]}>
        {headXs.map((x, i) => (
          <Head
            key={i}
            x={x}
            scale={i === 4 ? 1.15 : 0.92 - Math.abs(i - 4.5) * 0.03}
            phase={i * 0.6}
            laugh={pose.current.laugh}
            recoil={pose.current.recoil}
          />
        ))}
      </group>
    </group>
  );
}

function lerp2(a, b, t) {
  return THREE.MathUtils.lerp(a, b, t);
}
