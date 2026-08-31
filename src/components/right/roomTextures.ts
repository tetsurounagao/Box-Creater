import * as THREE from 'three';

function makeCanvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function toTexture(canvas: HTMLCanvasElement, repeat: [number, number]) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  return tex;
}

/** 板張りの木目テクスチャ */
export function makeWoodTexture(opts: {
  planks: number;
  base: string;
  dark: string;
  light: string;
  repeat: [number, number];
  size?: number;
  /** 板の継ぎ目の濃さ (0-1) */
  seam?: number;
  /** 縦の目地を入れるか（フロア向け） */
  verticalSeams?: boolean;
}): THREE.CanvasTexture {
  const size = opts.size ?? 512;
  const seamA = opts.seam ?? 0.28;
  const c = makeCanvas(size);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = opts.base;
  ctx.fillRect(0, 0, size, size);

  const plankH = size / opts.planks;
  for (let i = 0; i < opts.planks; i++) {
    const y = i * plankH;
    // 板ごとの色ムラ
    const t = Math.random();
    ctx.fillStyle = t > 0.5 ? opts.light : opts.dark;
    ctx.globalAlpha = 0.12 + Math.random() * 0.12;
    ctx.fillRect(0, y, size, plankH);
    ctx.globalAlpha = 1;

    // 木目の筋
    const grainCount = 18 + Math.floor(Math.random() * 14);
    for (let g = 0; g < grainCount; g++) {
      const gy = y + Math.random() * plankH;
      ctx.strokeStyle = Math.random() > 0.5 ? opts.dark : opts.light;
      ctx.globalAlpha = 0.05 + Math.random() * 0.1;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      const segs = 6;
      for (let s = 1; s <= segs; s++) {
        ctx.lineTo((size / segs) * s, gy + (Math.random() - 0.5) * 4);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 板の継ぎ目
    ctx.strokeStyle = `rgba(0,0,0,${seamA})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // 縦の目地（フロア用）
  if (opts.verticalSeams) {
    const seams = 4;
    for (let s = 1; s < seams; s++) {
      const x = (size / seams) * s + (Math.random() - 0.5) * 20;
      ctx.strokeStyle = `rgba(0,0,0,${seamA * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
  }

  return toTexture(c, opts.repeat);
}

/** ざっくりした織地テクスチャ（ラグ用） */
export function makeRugTexture(opts: {
  base: string;
  accent: string;
  repeat: [number, number];
}): THREE.CanvasTexture {
  const size = 256;
  const c = makeCanvas(size);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = opts.base;
  ctx.fillRect(0, 0, size, size);

  // 織りノイズ
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  // 縁取り
  ctx.strokeStyle = opts.accent;
  ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, size - 36, size - 36);
  ctx.lineWidth = 4;
  ctx.strokeRect(34, 34, size - 68, size - 68);

  return toTexture(c, opts.repeat);
}

/** うっすらムラのある壁テクスチャ */
export function makeWallTexture(base: string): THREE.CanvasTexture {
  const size = 256;
  const c = makeCanvas(size);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.015 + Math.random() * 0.02})`;
    const r = 20 + Math.random() * 80;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c, [1, 1]);
}
