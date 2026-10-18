import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { director } from '../animation/director';

/**
 * Procedural, stylised Hanuman Ji — devotion and strength.
 *
 * Recognisable mythological silhouette: vanara (monkey-like) face, gada (mace),
 * ornate armour and a devotional posture. Animated per-scene from the director.
 */

const FUR = '#c98a4b';
const FUR_DARK = '#9c6528';
const FACE = '#e4b884';
const CLOTH = '#c62b3a'; // crimson
const GOLD = '#f4c542';
const GOLD_DARK = '#b8862a';

function poseForScene(sceneIndex) {
  switch (sceneIndex) {
    case 0:
      return { bow: 0, handsFold: 0.6, headY: 0, gadaUp: 0, sway: 1 };
    case 1:
      return { bow: 0.2, handsFold: 0.7, headY: 0.1, gadaUp: 0, sway: 1 };
    case 2: // devotion — deep bow then rise
      return { bow: 1, handsFold: 1, headY: 0.3, gadaUp: 0, sway: 1 };
    case 3:
      return { bow: 0, handsFold: 0.3, headY: 0, gadaUp: 1, sway: 1 };
    case 4:
      return { bow: 0, handsFold: 0.2, headY: 0, gadaUp: 1, sway: 1.1 };
    case 5:
    case 6:
    case 7:
      return { bow: 0, handsFold: 0, headY: -0.1, gadaUp: 1, sway: 1.3 };
    case 8:
      return { bow: 0.5, handsFold: 0.8, headY: 0.2, gadaUp: 0.3, sway: 0.9 };
    case 9:
      return { bow: 0.2, handsFold: 0.4, headY: 0, gadaUp: 0.6, sway: 1 };
    case 10: // victory — bowing to Ram Ji
      return { bow: 0.7, handsFold: 1, headY: 0.2, gadaUp: 0, sway: 1 };
    case 11:
    default:
      return { bow: 0.1, handsFold: 0.5, headY: 0, gadaUp: 0, sway: 1 };
  }
}

const damp = (c, t, l, dt) => THREE.MathUtils.lerp(c, t, 1 - Math.exp(-l * dt));

export default function HanumanCharacter({ position = [-8, 0, -2.5] }) {
  const group = useRef();
  const torso = useRef();
  const head = useRef();
  const arms = useRef();
  const gada = useRef();
  const tail = useRef();
  const pose = useRef({ bow: 0, handsFold: 0.6, headY: 0, gadaUp: 0, sway: 1 });

  useFrame((state, dt) => {
    const cdt = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const target = poseForScene(director.sceneIndex);
    const p = pose.current;

    p.bow = damp(p.bow, target.bow, 4, cdt);
    p.handsFold = damp(p.handsFold, target.handsFold, 5, cdt);
    p.headY = damp(p.headY, target.headY, 4, cdt);
    p.gadaUp = damp(p.gadaUp, target.gadaUp, 5, cdt);
    p.sway = damp(p.sway, target.sway, 3, cdt);

    const breathe = Math.sin(t * 2) * 0.03;
    if (torso.current) torso.current.scale.set(1 + breathe, 1 + breathe * 0.5, 1 + breathe);

    if (group.current) {
      group.current.rotation.x = p.bow * 0.6;
      group.current.position.y = -p.bow * 0.18;
      group.current.rotation.y = Math.sin(t * 0.6) * 0.03 * p.sway;
    }
    if (head.current) {
      head.current.rotation.y = p.headY;
      head.current.rotation.x = -p.bow * 0.4;
    }
    if (arms.current) {
      // Folded hands converge toward the chest as handsFold rises.
      arms.current.children.forEach((arm, i) => {
        const side = i === 0 ? 1 : -1;
        arm.rotation.z = side * (0.9 - p.handsFold * 0.9);
        arm.rotation.x = -0.3 - p.handsFold * 0.2;
      });
    }
    if (gada.current) {
      gada.current.rotation.z = -0.4 + p.gadaUp * 0.6 + Math.sin(t * 1.4) * 0.05 * p.sway;
      gada.current.visible = p.gadaUp > 0.05;
    }
    if (tail.current) {
      tail.current.rotation.z = Math.sin(t * 1.1) * 0.25 * p.sway;
    }
  });

  return (
    <group ref={group} position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* Legs */}
      <mesh position={[-0.18, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.55, 6, 12]} />
        <meshStandardMaterial color={CLOTH} roughness={0.6} />
      </mesh>
      <mesh position={[0.18, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.55, 6, 12]} />
        <meshStandardMaterial color={CLOTH} roughness={0.6} />
      </mesh>

      {/* Torso with armour */}
      <group ref={torso} position={[0, 1.1, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.32, 0.5, 8, 16]} />
          <meshStandardMaterial color={FUR} roughness={0.75} />
        </mesh>
        {/* Chest armour plate */}
        <mesh position={[0, 0.05, 0.18]} scale={[1, 1.1, 0.6]} castShadow>
          <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD_DARK} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.22, 0.05]}>
          <torusGeometry args={[0.3, 0.04, 8, 24]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Head — vanara face */}
      <group ref={head} position={[0, 1.66, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.26, 24, 24]} />
          <meshStandardMaterial color={FUR} roughness={0.7} />
        </mesh>
        {/* Muzzle */}
        <mesh position={[0, -0.04, 0.2]} scale={[0.8, 0.7, 0.9]} castShadow>
          <sphereGeometry args={[0.16, 18, 18]} />
          <meshStandardMaterial color={FACE} roughness={0.6} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.09, 0.06, 0.2]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#20160c" />
        </mesh>
        <mesh position={[0.09, 0.06, 0.2]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#20160c" />
        </mesh>
        {/* Crown */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <coneGeometry args={[0.16, 0.26, 12]} />
          <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.15} emissive={GOLD_DARK} emissiveIntensity={0.25} />
        </mesh>
        {/* Tilak */}
        <mesh position={[0, 0.12, 0.22]}>
          <boxGeometry args={[0.12, 0.05, 0.01]} />
          <meshStandardMaterial color="#ff5a3c" emissive="#ff5a3c" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Arms (fold toward prayer) */}
      <group ref={arms}>
        <group position={[-0.4, 1.36, 0]}>
          <mesh position={[0, -0.26, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.48, 6, 12]} />
            <meshStandardMaterial color={FUR} roughness={0.75} />
          </mesh>
        </group>
        <group position={[0.4, 1.36, 0]}>
          <mesh position={[0, -0.26, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.48, 6, 12]} />
            <meshStandardMaterial color={FUR} roughness={0.75} />
          </mesh>
        </group>
      </group>

      {/* Gada (mace) */}
      <group ref={gada} position={[0.5, 1.0, 0.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.1, 10]} />
          <meshStandardMaterial color={GOLD_DARK} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <sphereGeometry args={[0.19, 16, 16]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD_DARK} emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Tail */}
      <group ref={tail} position={[0, 1.0, -0.3]}>
        <mesh position={[0, -0.1, -0.4]} rotation={[0.9, 0, 0]} castShadow>
          <capsuleGeometry args={[0.05, 0.8, 6, 10]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.15, -0.75]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={FUR} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
