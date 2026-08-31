import type { Crop } from '../store/boxStore';

const cache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = cache.get(src);
  if (cached && cached.complete) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** 対象アスペクト（横/縦）に対する中央クロップを元画像 px で返す */
export function centerCrop(naturalW: number, naturalH: number, aspect: number): Crop {
  const imgAspect = naturalW / naturalH;
  if (imgAspect > aspect) {
    // 画像が横長すぎる → 幅を詰める
    const width = naturalH * aspect;
    return { x: (naturalW - width) / 2, y: 0, width, height: naturalH };
  }
  const height = naturalW / aspect;
  return { x: 0, y: (naturalH - height) / 2, width: naturalW, height };
}

/**
 * 画像を crop で切り抜き、長辺 maxSize px 以内の canvas に描画して返す。
 * crop 未指定時は aspect に対する中央クロップを使う。
 */
export async function cropToCanvas(
  src: string,
  naturalW: number,
  naturalH: number,
  aspect: number,
  crop: Crop | undefined,
  maxSize = 1024,
): Promise<HTMLCanvasElement> {
  const img = await loadImage(src);
  const c = crop ?? centerCrop(naturalW, naturalH, aspect);

  let outW: number;
  let outH: number;
  if (aspect >= 1) {
    outW = Math.min(maxSize, Math.round(c.width));
    outH = Math.round(outW / aspect);
  } else {
    outH = Math.min(maxSize, Math.round(c.height));
    outW = Math.round(outH * aspect);
  }
  outW = Math.max(1, outW);
  outH = Math.max(1, outH);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, c.x, c.y, c.width, c.height, 0, 0, outW, outH);
  return canvas;
}
