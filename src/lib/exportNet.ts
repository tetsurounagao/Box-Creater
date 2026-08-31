import { buildNet } from './geometry';
import type { FaceId } from './faces';
import { FACE_LABEL, FACE_LABEL_EN } from './faces';

export interface NetExportInput {
  W: number;
  D: number;
  H: number;
  /** 面ごとの切り抜き済み画像 dataURL */
  images: Partial<Record<FaceId, string>>;
}

type LabelLang = 'ja' | 'en' | 'none';

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function viewBoxOf(svg: string): { w: number; h: number } {
  const m = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
  if (!m) throw new Error('viewBox not found');
  return { w: parseFloat(m[3]), h: parseFloat(m[4]) };
}

/**
 * 展開図を「印刷して切り抜けば箱の形が作れる」型紙（ダイライン）SVG にする。
 * - 実線 = カットライン（外周＋フラップの外郭）
 * - 破線 = 折り線（面と面／面とフラップの境界）
 * すべて 1:1（mm）。細線。
 */
export function buildNetSVG(
  input: NetExportInput,
  opts: {
    lang?: LabelLang;
    margin?: number;
    /** カット線の太さ mm */
    cutW?: number;
    /** 折り線の太さ mm */
    foldW?: number;
    /** 凡例を入れるか */
    legend?: boolean;
  } = {},
): string {
  const { W, D, H, images } = input;
  const lang = opts.lang ?? 'ja';
  const net = buildNet(W, D, H);
  // フラップの張り出し + 余白を確保
  const margin = opts.margin ?? Math.ceil(net.flapDepth + 8);
  const cutW = opts.cutW ?? 0.25;
  const foldW = opts.foldW ?? 0.2;
  const legend = opts.legend ?? true;
  const legendH = legend ? 14 : 0;
  const vbW = net.width + margin * 2;
  const vbH = net.height + margin * 2 + legendH;
  const labelMap = lang === 'en' ? FACE_LABEL_EN : FACE_LABEL;
  const fs = Math.min(8, Math.max(3, Math.min(W, D, H) * 0.12));

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `viewBox="${-margin} ${-margin} ${vbW} ${vbH}" width="${vbW}mm" height="${vbH}mm">`,
  );
  out.push(
    `<rect x="${-margin}" y="${-margin}" width="${vbW}" height="${vbH}" fill="#ffffff"/>`,
  );

  // 面画像（校正用。線は描かない）
  net.panels.forEach((p, i) => {
    const url = images[p.id];
    if (!url) return;
    out.push(
      `<clipPath id="exclip${i}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/></clipPath>`,
    );
    out.push(
      `<image xlink:href="${url}" href="${url}" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" ` +
        `preserveAspectRatio="xMidYMid slice" clip-path="url(#exclip${i})"/>`,
    );
  });

  // 折り線（破線）
  for (const l of net.folds) {
    out.push(
      `<line x1="${l.x1.toFixed(2)}" y1="${l.y1.toFixed(2)}" x2="${l.x2.toFixed(2)}" y2="${l.y2.toFixed(2)}" ` +
        `stroke="#8a8a8a" stroke-width="${foldW}" stroke-dasharray="${foldW * 8} ${foldW * 6}"/>`,
    );
  }

  // カット線（実線）: フラップ外郭 = points(a c1 c2 b) の 3 辺を polyline で。
  // 隣り合うフラップは面の角で端点を共有して外周がつながる。
  for (const f of net.flaps) {
    out.push(
      `<polyline points="${f.points}" fill="none" stroke="#111111" stroke-width="${cutW}" ` +
        `stroke-linejoin="round" stroke-linecap="round"/>`,
    );
  }

  // 面ラベルと寸法（画像なしの面のみ、薄色）
  if (lang !== 'none') {
    net.panels.forEach((p) => {
      if (images[p.id]) return;
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      out.push(
        `<text x="${cx}" y="${cy - fs * 0.2}" font-family="sans-serif" font-size="${fs}" fill="#9a948a" text-anchor="middle">${esc(
          labelMap[p.id],
        )}</text>`,
      );
      out.push(
        `<text x="${cx}" y="${cy + fs}" font-family="sans-serif" font-size="${fs * 0.75}" fill="#b0a89c" text-anchor="middle">${Math.round(
          p.w,
        )} x ${Math.round(p.h)}</text>`,
      );
    });
  }

  // 凡例（下余白の外側の帯に配置）
  if (legend) {
    const ly = net.height + margin + 7;
    const lx = 0;
    const t = lang === 'en' ? ['— cut', '- - fold', '100% scale'] : ['— 実線=切る', '- - 破線=折る', '原寸100%'];
    out.push(
      `<line x1="${lx}" y1="${ly}" x2="${lx + 8}" y2="${ly}" stroke="#111111" stroke-width="${cutW}"/>`,
    );
    out.push(
      `<text x="${lx + 10}" y="${ly + 1.4}" font-family="sans-serif" font-size="4" fill="#555">${esc(
        t[0].replace('— ', ''),
      )}</text>`,
    );
    out.push(
      `<line x1="${lx + 34}" y1="${ly}" x2="${lx + 42}" y2="${ly}" stroke="#8a8a8a" stroke-width="${foldW}" stroke-dasharray="1.6 1.2"/>`,
    );
    out.push(
      `<text x="${lx + 44}" y="${ly + 1.4}" font-family="sans-serif" font-size="4" fill="#555">${esc(
        t[1].replace('- - ', ''),
      )}</text>`,
    );
    out.push(
      `<text x="${lx + 70}" y="${ly + 1.4}" font-family="sans-serif" font-size="4" fill="#555">${esc(t[2])}</text>`,
    );
  }

  out.push(`</svg>`);
  return out.join('');
}

/** SVG 文字列をラスタライズして PNG / JPEG Blob にする */
/** 約 300dpi 相当 */
export const PRINT_PX_PER_MM = 11.811;

export async function rasterizeSVG(
  svg: string,
  type: 'image/png' | 'image/jpeg',
  pxPerMm = PRINT_PX_PER_MM,
  quality = 0.95,
): Promise<Blob> {
  const { w, h } = viewBoxOf(svg);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * pxPerMm);
  canvas.height = Math.round(h * pxPerMm);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('SVG 画像の読み込みに失敗しました'));
  });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('画像の生成に失敗しました'))),
      type,
      quality,
    );
  });
}

/** SVG 文字列をベクター PDF Blob にする（ラベルは ASCII 前提） */
export async function svgToPDF(svg: string): Promise<Blob> {
  // 重い依存はクリック時に動的読み込み
  const [{ jsPDF }] = await Promise.all([import('jspdf'), import('svg2pdf.js')]);
  const { w, h } = viewBoxOf(svg);
  const orientation = w >= h ? 'landscape' : 'portrait';
  const doc = new jsPDF({ unit: 'mm', format: [w, h], orientation, compress: true });
  const el = new DOMParser().parseFromString(svg, 'image/svg+xml')
    .documentElement as unknown as Element;
  // svg2pdf.js が jsPDF に生やす svg() を使用
  await (doc as unknown as { svg: (e: Element, o: object) => Promise<unknown> }).svg(el, {
    x: 0,
    y: 0,
    width: w,
    height: h,
  });
  return doc.output('blob');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ExportFormat = 'png' | 'jpeg' | 'pdf';

export async function exportNet(
  format: ExportFormat,
  input: NetExportInput,
): Promise<void> {
  const base = `box-net-${input.W}x${input.D}x${input.H}`;
  if (format === 'pdf') {
    const svg = buildNetSVG(input, { lang: 'en' });
    downloadBlob(await svgToPDF(svg), `${base}.pdf`);
    return;
  }
  const svg = buildNetSVG(input, { lang: 'ja' });
  if (format === 'png') {
    downloadBlob(await rasterizeSVG(svg, 'image/png'), `${base}.png`);
  } else {
    downloadBlob(await rasterizeSVG(svg, 'image/jpeg'), `${base}.jpg`);
  }
}
