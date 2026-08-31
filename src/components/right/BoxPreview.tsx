import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  CameraControls,
  ContactShadows,
  Environment,
  Lightformer,
} from '@react-three/drei';
import * as THREE from 'three';
import type CameraControlsImpl from 'camera-controls';
import BoxMesh from './BoxMesh';
import FaceViewButtons from './FaceViewButtons';
import PreviewToolbar from './PreviewToolbar';
import Room, { TABLE_CENTER_Z, TABLE_TOP_Y } from './Room';
import { useBoxStore } from '../../store/boxStore';
import type { FaceCanvasMap } from '../../hooks/useFaceCanvases';

interface Props {
  faceCanvases: FaceCanvasMap;
}

function ExposureRig({ exposure }: { exposure: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

export default function BoxPreview({ faceCanvases }: Props) {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const previewMode = useBoxStore((s) => s.previewMode);
  const bgColor = useBoxStore((s) => s.bgColor);
  const { W, D, H } = useBoxStore((s) => s.dimensions);

  const isRoom = previewMode === 'room';
  const maxDim = Math.max(W, D, H);
  const unitScale = isRoom ? 0.001 : 2 / maxDim;
  const boxH = H * unitScale;

  const boxPos: [number, number, number] = isRoom
    ? [0, TABLE_TOP_Y + boxH / 2, TABLE_CENTER_Z]
    : [0, 0, 0];
  const fitDist = maxDim * unitScale * 2.6 + (isRoom ? 0.6 : 0.5);

  // モード切替時にカメラを定位置へ寄せる
  useEffect(() => {
    const cc = controlsRef.current;
    if (!cc) return;
    if (isRoom) {
      // 箱を主役にしつつテーブル・壁・小物が入る 3/4 ビュー
      cc.setLookAt(
        1.05,
        1.16,
        TABLE_CENTER_Z + 1.35,
        -0.02,
        TABLE_TOP_Y + 0.05,
        TABLE_CENTER_Z - 0.02,
        true,
      );
    } else {
      // シンプルモードは箱を最大辺 2 単位に正規化しているので固定視点でよい
      cc.setLookAt(3.4, 2.7, 4.2, 0, 0, 0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoom]);

  return (
    <div className="preview-wrap" style={{ background: isRoom ? '#d7cdbc' : bgColor }}>
      <Canvas
        shadows
        frameloop="always"
        dpr={[1, 2]}
        camera={{ position: [3.4, 2.6, 4.2], fov: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ExposureRig exposure={isRoom ? 0.95 : 1.05} />
        <color attach="background" args={[isRoom ? '#cfc4b1' : bgColor]} />
        {isRoom && <fog attach="fog" args={['#cfc4b1', 6, 24]} />}

        {!isRoom && (
          <>
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[4, 6, 3]}
              intensity={2.1}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <directionalLight position={[-3, 2, -4]} intensity={0.5} />
          </>
        )}

        {/* 紙のツヤ用ローカル環境光（外部 HDR 不要）— 部屋モードでも反射に使う */}
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer
              form="rect"
              intensity={isRoom ? 0.6 : 1.6}
              position={[0, 4, 2]}
              scale={[8, 3, 1]}
              color="#fff4e2"
            />
            <Lightformer
              form="rect"
              intensity={isRoom ? 0.35 : 0.8}
              position={[-4, 1, -3]}
              scale={[4, 4, 1]}
              color="#e8eefc"
            />
            <Lightformer
              form="ring"
              intensity={isRoom ? 0.25 : 0.5}
              position={[4, 2, 3]}
              scale={2}
              color="#ffffff"
            />
          </Environment>
        </Suspense>

        {isRoom && <Room />}

        <group position={boxPos}>
          <BoxMesh faceCanvases={faceCanvases} unitScale={unitScale} />
        </group>

        {!isRoom && (
          <ContactShadows
            position={[0, -boxH / 2, 0]}
            scale={maxDim * unitScale * 2.6}
            resolution={1024}
            blur={2.6}
            far={maxDim * unitScale}
            opacity={0.4}
            color="#3a3128"
          />
        )}

        <CameraControls
          ref={controlsRef}
          minDistance={isRoom ? 0.4 : 2}
          maxDistance={isRoom ? 8 : 9}
          maxPolarAngle={isRoom ? Math.PI / 2 - 0.02 : Math.PI}
          smoothTime={0.28}
        />
      </Canvas>

      <PreviewToolbar />
      <FaceViewButtons controlsRef={controlsRef} target={boxPos} dist={fitDist} />
      <div className="hint">ドラッグで回転／ホイールでズーム</div>
    </div>
  );
}
