import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useBoxStore } from '../../store/boxStore';
import { MATERIAL_ORDER } from '../../lib/faces';
import type { FaceCanvasMap } from '../../hooks/useFaceCanvases';

const KRAFT = '#c8a06e';

interface Props {
  faceCanvases: FaceCanvasMap;
  /** three 単位 / mm の変換係数 */
  unitScale: number;
}

export default function BoxMesh({ faceCanvases, unitScale }: Props) {
  const { W, D, H } = useBoxStore((s) => s.dimensions);
  const texturesRef = useRef<THREE.Texture[]>([]);

  const size: [number, number, number] = [W * unitScale, H * unitScale, D * unitScale];

  const materials = useMemo(() => {
    // 前回のテクスチャを破棄
    texturesRef.current.forEach((t) => t.dispose());
    texturesRef.current = [];

    return MATERIAL_ORDER.map((faceId) => {
      const fc = faceCanvases[faceId];
      const mat = new THREE.MeshPhysicalMaterial({
        color: fc ? '#ffffff' : KRAFT,
        roughness: 0.62,
        clearcoat: 0.12,
        clearcoatRoughness: 0.45,
        sheen: 0.35,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color('#fff6e8'),
        envMapIntensity: 0.55,
      });
      if (fc) {
        const tex = new THREE.CanvasTexture(fc.canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        mat.map = tex;
        texturesRef.current.push(tex);
      }
      return mat;
    });
  }, [faceCanvases]);

  useEffect(() => {
    return () => {
      materials.forEach((m) => m.dispose());
      texturesRef.current.forEach((t) => t.dispose());
    };
  }, [materials]);

  return (
    <mesh material={materials} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}
