import { useEffect, useRef, useState } from 'react';
import { cropToCanvas } from '../lib/cropToCanvas';
import type { FaceId } from '../lib/faces';
import { FACE_IDS, faceAspect } from '../lib/faces';
import { useBoxStore } from '../store/boxStore';

export interface FaceCanvas {
  canvas: HTMLCanvasElement;
  url: string;
  /** 元画像に基づく正確なクロップが未設定（中央クロップで暫定表示中） */
  provisional: boolean;
}

export type FaceCanvasMap = Partial<Record<FaceId, FaceCanvas>>;

/**
 * 各面の「切り抜き済み canvas + dataURL」を生成する。
 * 画像・クロップ・面アスペクトが変わったときだけ再生成する。
 */
export function useFaceCanvases(): FaceCanvasMap {
  const faces = useBoxStore((s) => s.faces);
  const { W, D, H } = useBoxStore((s) => s.dimensions);
  const [map, setMap] = useState<FaceCanvasMap>({});
  const keysRef = useRef<Partial<Record<FaceId, string>>>({});

  useEffect(() => {
    let cancelled = false;

    FACE_IDS.forEach((id) => {
      const face = faces[id];
      const aspect = faceAspect(id, W, D, H);

      if (!face.image) {
        if (keysRef.current[id] !== undefined) {
          keysRef.current[id] = undefined;
          setMap((m) => {
            const next = { ...m };
            delete next[id];
            return next;
          });
        }
        return;
      }

      // 寸法変更でアスペクト比が変わった面は、古いクロップを捨てて中央クロップで暫定表示
      const effectiveCrop = face.needsRecrop ? undefined : face.crop;
      const provisional = !effectiveCrop;

      const key = [
        face.image.src,
        effectiveCrop
          ? `${effectiveCrop.x},${effectiveCrop.y},${effectiveCrop.width},${effectiveCrop.height}`
          : 'auto',
        aspect.toFixed(4),
      ].join('|');

      if (keysRef.current[id] === key) return;
      keysRef.current[id] = key;

      cropToCanvas(
        face.image.src,
        face.image.naturalW,
        face.image.naturalH,
        aspect,
        effectiveCrop,
      )
        .then((canvas) => {
          if (cancelled || keysRef.current[id] !== key) return;
          setMap((m) => ({
            ...m,
            [id]: {
              canvas,
              url: canvas.toDataURL('image/png'),
              provisional,
            },
          }));
        })
        .catch(() => {
          /* 画像読み込み失敗は無視 */
        });
    });

    return () => {
      cancelled = true;
    };
  }, [faces, W, D, H]);

  return map;
}
