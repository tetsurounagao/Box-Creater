import type { RefObject } from 'react';
import type CameraControlsImpl from 'camera-controls';
import { FACE_IDS, FACE_LABEL, FACE_NORMAL } from '../../lib/faces';

interface Props {
  controlsRef: RefObject<CameraControlsImpl | null>;
  /** 箱の中心（ワールド座標） */
  target: [number, number, number];
  /** 箱中心からカメラまでの距離 */
  dist: number;
}

export default function FaceViewButtons({ controlsRef, target, dist }: Props) {
  const goto = (nx: number, ny: number, nz: number) => {
    const cc = controlsRef.current;
    if (!cc) return;
    const [tx, ty, tz] = target;
    // 真上/真下はロールが乱れるので僅かに前へずらす
    const pole = Math.abs(ny) > 0.9;
    cc.setLookAt(
      tx + nx * dist,
      ty + ny * dist,
      tz + nz * dist + (pole ? 0.001 * dist : 0),
      tx,
      ty,
      tz,
      true,
    );
  };

  return (
    <div className="view-buttons">
      {FACE_IDS.map((id) => {
        const [nx, ny, nz] = FACE_NORMAL[id];
        return (
          <button key={id} type="button" onClick={() => goto(nx, ny, nz)}>
            {FACE_LABEL[id]}
          </button>
        );
      })}
      <button type="button" onClick={() => goto(0.7, 0.55, 0.85)}>
        俯瞰
      </button>
    </div>
  );
}
