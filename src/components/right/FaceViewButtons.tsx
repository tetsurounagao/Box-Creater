import type { RefObject } from 'react';
import type CameraControlsImpl from 'camera-controls';
import { FACE_IDS, FACE_LABEL, FACE_NORMAL } from '../../lib/faces';

interface Props {
  controlsRef: RefObject<CameraControlsImpl | null>;
  /** 箱の中心（ワールド座標） */
  target: [number, number, number];
  /** 箱中心からカメラまでの距離 */
  dist: number;
  /** モバイル: プルダウンで表示 */
  compact?: boolean;
}

const EXTRA_VIEWS = { overview: [0.7, 0.55, 0.85] } as const;

export default function FaceViewButtons({ controlsRef, target, dist, compact }: Props) {
  const goto = (nx: number, ny: number, nz: number) => {
    const cc = controlsRef.current;
    if (!cc) return;
    const [tx, ty, tz] = target;
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

  if (compact) {
    return (
      <div className="view-select">
        <label>
          視点
          <select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              e.target.value = '';
              if (!v) return;
              if (v === 'overview') {
                goto(...EXTRA_VIEWS.overview);
              } else {
                goto(...FACE_NORMAL[v as (typeof FACE_IDS)[number]]);
              }
            }}
          >
            <option value="">選択…</option>
            {FACE_IDS.map((id) => (
              <option key={id} value={id}>
                {FACE_LABEL[id]}
              </option>
            ))}
            <option value="overview">俯瞰</option>
          </select>
        </label>
      </div>
    );
  }

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
      <button type="button" onClick={() => goto(...EXTRA_VIEWS.overview)}>
        俯瞰
      </button>
    </div>
  );
}
