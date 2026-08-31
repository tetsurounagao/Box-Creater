import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ContactShadows, SoftShadows } from '@react-three/drei';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {
  makeRugTexture,
  makeWallTexture,
  makeWoodTexture,
} from './roomTextures';

RectAreaLightUniformsLib.init();

/** 実寸: 1 three 単位 = 1m。原点は床。箱はテーブル天面の中央に載る。 */
export const TABLE_TOP_Y = 0.74;
export const TABLE_CENTER_Z = -0.85;

const TABLE_W = 1.36;
const TABLE_D = 0.7;
const TOP_THICK = 0.035;
const LEG = 0.05;

const WALL_Z = -1.75;
const WALL_X = -2.3;
const WALL_H = 3.2;

function Walls({
  wall,
  floor,
}: {
  wall: THREE.Texture;
  floor: THREE.Texture;
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial map={floor} roughness={0.75} metalness={0.02} />
      </mesh>
      <mesh position={[0, WALL_H / 2, WALL_Z]} receiveShadow>
        <planeGeometry args={[40, WALL_H]} />
        <meshStandardMaterial map={wall} color="#efe7d9" roughness={1} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[WALL_X, WALL_H / 2, 0]} receiveShadow>
        <planeGeometry args={[40, WALL_H]} />
        <meshStandardMaterial map={wall} color="#e7ddcb" roughness={1} />
      </mesh>
      {/* 幅木 */}
      <mesh position={[0, 0.05, WALL_Z + 0.012]}>
        <boxGeometry args={[40, 0.1, 0.02]} />
        <meshStandardMaterial color="#f4efe4" roughness={0.7} />
      </mesh>
      <mesh position={[WALL_X + 0.012, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, 40]} />
        <meshStandardMaterial color="#f0e9db" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Table({ wood }: { wood: THREE.Texture }) {
  const legY = (TABLE_TOP_Y - TOP_THICK) / 2;
  const ox = TABLE_W / 2 - LEG / 2 - 0.05;
  const oz = TABLE_D / 2 - LEG / 2 - 0.05;
  const legs: [number, number, number][] = [
    [ox, legY, oz],
    [-ox, legY, oz],
    [ox, legY, -oz],
    [-ox, legY, -oz],
  ];
  return (
    <group position={[0, 0, TABLE_CENTER_Z]}>
      <mesh position={[0, TABLE_TOP_Y - TOP_THICK / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[TABLE_W, TOP_THICK, TABLE_D]} />
        <meshStandardMaterial map={wood} roughness={0.4} metalness={0.02} />
      </mesh>
      <mesh position={[0, TABLE_TOP_Y - TOP_THICK - 0.035, 0]} castShadow>
        <boxGeometry args={[TABLE_W - 0.16, 0.055, TABLE_D - 0.16]} />
        <meshStandardMaterial color="#7f542c" roughness={0.6} />
      </mesh>
      {legs.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[LEG, TABLE_TOP_Y - TOP_THICK, LEG]} />
          <meshStandardMaterial color="#7f542c" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Window() {
  const z = -0.3;
  const y = 1.2;
  const openW = 1.34; // z 方向
  const openH = 1.1; // y 方向
  const fx = WALL_X + 0.02;
  const bar = 0.05;
  return (
    <group>
      {/* 外の光（空） */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[WALL_X - 0.05, y, z]}>
        <planeGeometry args={[openW, openH]} />
        <meshBasicMaterial color="#dbe7f3" toneMapped={false} />
      </mesh>
      {/* 枠 */}
      {(
        [
          [fx, y + openH / 2 + bar / 2, z, bar, bar, openW + bar * 2],
          [fx, y - openH / 2 - bar / 2, z, bar, bar, openW + bar * 2],
          [fx, y, z + openW / 2 + bar / 2, bar, openH + bar * 2, bar],
          [fx, y, z - openW / 2 - bar / 2, bar, openH + bar * 2, bar],
          [fx, y, z, bar * 0.6, openH, bar * 0.6],
          [fx, y, z, bar * 0.6, bar * 0.6, openW],
        ] as [number, number, number, number, number, number][]
      ).map((b, i) => (
        <mesh key={i} position={[b[0], b[1], b[2]]}>
          <boxGeometry args={[b[3], b[4], b[5]]} />
          <meshStandardMaterial color="#f4efe4" roughness={0.6} />
        </mesh>
      ))}
      {/* 窓台 */}
      <mesh position={[fx + 0.03, y - openH / 2 - bar, z]}>
        <boxGeometry args={[0.12, 0.03, openW + 0.14]} />
        <meshStandardMaterial color="#f4efe4" roughness={0.6} />
      </mesh>
      {/* レースカーテン */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[fx + 0.06, y + 0.15, z + s * (openW / 2 - 0.12)]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.34, openH + 0.4]} />
          <meshStandardMaterial
            color="#fbf7ef"
            roughness={1}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* 窓から差し込む光 */}
      <rectAreaLight
        args={['#eaf1ff', 2.6, openW, openH]}
        position={[WALL_X + 0.05, y, z]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );
}

function Plant() {
  const leaves = useMemo(() => {
    const arr: { pos: [number, number, number]; rot: [number, number, number]; s: number; c: string }[] = [];
    const cols = ['#5f7d3f', '#4c6b34', '#6b8a49', '#3f5c2c'];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + Math.random();
      const r = 0.05 + Math.random() * 0.08;
      arr.push({
        pos: [Math.cos(a) * r, 0.34 + Math.random() * 0.26, Math.sin(a) * r],
        rot: [Math.random() * 0.8 - 0.4, a, Math.random() * 0.8 - 0.2],
        s: 0.9 + Math.random() * 0.5,
        c: cols[i % cols.length],
      });
    }
    return arr;
  }, []);

  return (
    <group position={[-1.95, 0, -1.42]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.1, 0.24, 24]} />
        <meshStandardMaterial color="#b5623c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.235, 0]}>
        <cylinderGeometry args={[0.118, 0.118, 0.02, 24]} />
        <meshStandardMaterial color="#3a2a1e" roughness={1} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} position={l.pos} rotation={l.rot} scale={[0.05 * l.s, 0.16 * l.s, 0.02 * l.s]} castShadow>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color={l.c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function FloorLamp() {
  return (
    <group position={[1.78, 0, -1.35]}>
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 24]} />
        <meshStandardMaterial color="#2f2f2f" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 1.5, 12]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.13, 0.19, 0.26, 24, 1, true]} />
        <meshStandardMaterial
          color="#f3e3c6"
          emissive="#ffcf8a"
          emissiveIntensity={0.4}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#ffdca6" intensity={6} distance={4.5} decay={2} />
    </group>
  );
}

function WallArt({ art }: { art: THREE.Texture }) {
  return (
    <group position={[0.95, 1.32, WALL_Z + 0.02]}>
      <mesh castShadow>
        <boxGeometry args={[0.58, 0.74, 0.03]} />
        <meshStandardMaterial color="#4a3728" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[0.48, 0.64]} />
        <meshStandardMaterial map={art} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Clock() {
  return (
    <group position={[-0.75, 1.55, WALL_Z + 0.02]}>
      <mesh>
        <cylinderGeometry args={[0.14, 0.14, 0.03, 32]} />
        <meshStandardMaterial color="#f6f2e8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.018]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.012, 12, 32]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.03, 0.02]} rotation={[Math.PI / 2, 0, 0.5]}>
        <boxGeometry args={[0.008, 0.09, 0.006]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0.025, 0, 0.02]} rotation={[Math.PI / 2, 0, -1.7]}>
        <boxGeometry args={[0.006, 0.06, 0.006]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  );
}

function TableItems() {
  const books: { y: number; rot: number; c: string; w: number }[] = [
    { y: 0.015, rot: 0.12, c: '#8c4a3a', w: 0.24 },
    { y: 0.043, rot: -0.05, c: '#3f5a6b', w: 0.22 },
    { y: 0.069, rot: 0.06, c: '#c9a24a', w: 0.2 },
  ];
  return (
    <group position={[0, TABLE_TOP_Y, TABLE_CENTER_Z]}>
      {/* 本の山（箱の設置位置から離した左手前） */}
      <group position={[-0.52, 0, 0.14]}>
        {books.map((b, i) => (
          <mesh key={i} position={[0, b.y, 0]} rotation={[0, b.rot, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.17, 0.026, b.w]} />
            <meshStandardMaterial color={b.c} roughness={0.7} />
          </mesh>
        ))}
      </group>
      {/* マグカップ（右手前） */}
      <group position={[0.54, 0, 0.16]}>
        <mesh position={[0, 0.048, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.042, 0.038, 0.096, 24, 1, true]} />
          <meshStandardMaterial color="#e9e2d4" roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.001, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.006, 24]} />
          <meshStandardMaterial color="#e9e2d4" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.008, 24]} />
          <meshStandardMaterial color="#40281a" roughness={0.3} />
        </mesh>
        <mesh position={[0.056, 0.048, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.026, 0.007, 10, 20]} />
          <meshStandardMaterial color="#e9e2d4" roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

interface RoomProps {
  mapSize?: number;
  softShadows?: boolean;
  contactRes?: number;
}

export default function Room({
  mapSize = 2048,
  softShadows = true,
  contactRes = 512,
}: RoomProps) {
  const target = useMemo(() => new THREE.Object3D(), []);

  const floorTex = useMemo(
    () =>
      makeWoodTexture({
        planks: 9,
        base: '#c6a677',
        dark: '#ac8c62',
        light: '#d8bd91',
        repeat: [6, 6],
        seam: 0.16,
        verticalSeams: true,
      }),
    [],
  );
  const woodTex = useMemo(
    () =>
      makeWoodTexture({
        planks: 3,
        base: '#b58455',
        dark: '#9a6c40',
        light: '#c99a6c',
        repeat: [2, 1],
        seam: 0.1,
      }),
    [],
  );
  const rugTex = useMemo(
    () => makeRugTexture({ base: '#9d8567', accent: '#6f5a3f', repeat: [1, 1] }),
    [],
  );
  const wallTex = useMemo(() => makeWallTexture('#efe7d9'), []);
  const artTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#d9d0bd';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#8a9a86';
    ctx.fillRect(10, 12, 108, 64);
    ctx.fillStyle = '#c98b5b';
    ctx.fillRect(24, 82, 80, 34);
    ctx.fillStyle = '#4a5b57';
    ctx.fillRect(70, 20, 30, 44);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useEffect(() => {
    return () => {
      [floorTex, woodTex, rugTex, wallTex, artTex].forEach((t) => t.dispose());
    };
  }, [floorTex, woodTex, rugTex, wallTex, artTex]);

  return (
    <group>
      {softShadows && <SoftShadows size={24} samples={12} focus={0.9} />}

      {/* --- ライティング --- */}
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#eaf0ff', '#6b5a44', 0.4]} />
      <primitive object={target} position={[0, 0.45, TABLE_CENTER_Z]} />
      <directionalLight
        position={[-3.1, 2.5, 0.7]}
        target={target}
        color="#fff1dc"
        intensity={2.4}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={14}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
      />

      <Walls wall={wallTex} floor={floorTex} />
      <Window />

      {/* ラグ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.006, TABLE_CENTER_Z + 0.1]} receiveShadow>
        <planeGeometry args={[2.5, 1.8]} />
        <meshStandardMaterial map={rugTex} roughness={0.95} />
      </mesh>

      <Table wood={woodTex} />
      <TableItems />
      <Plant />
      <FloorLamp />
      <WallArt art={artTex} />
      <Clock />

      {/* テーブル天面の接地影（箱の直下を締める） */}
      <ContactShadows
        position={[0, TABLE_TOP_Y + 0.002, TABLE_CENTER_Z]}
        scale={0.85}
        resolution={contactRes}
        far={0.35}
        blur={2}
        opacity={0.5}
        color="#2b2015"
        frames={1}
      />
    </group>
  );
}
