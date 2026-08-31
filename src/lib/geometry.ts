import type { Axis, FaceId } from './faces';

export interface Panel {
  id: FaceId;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Flap {
  /** SVG polygon points 文字列 */
  points: string;
}

export interface FoldLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface HandleDef {
  axis: Axis;
  /** ハンドル中心 */
  x: number;
  y: number;
  /** ドラッグ方向: 'x' なら右へ引くと増加, 'y' なら下へ引くと増加, 'y-' なら上へ引くと増加 */
  dir: 'x' | 'y' | 'y-';
  label: string;
}

export interface NetLayout {
  panels: Panel[];
  flaps: Flap[];
  folds: FoldLine[];
  handles: HandleDef[];
  width: number;
  height: number;
  /** フラップが外側へ張り出す量 mm */
  flapDepth: number;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * 十字（クルス）展開図のレイアウトを mm 座標で構築する。
 *
 *                 [ top   W x D ]
 *  [ left D x H ][ front W x H ][ right D x H ][ back W x H ]
 *                 [ bottom W x D ]
 */
export function buildNet(W: number, D: number, H: number): NetLayout {
  const fd = clamp(Math.min(W, D, H) * 0.4, 8, 28); // フラップ奥行
  const taper = fd * 0.35; // 台形の先細り

  const frontX = D;
  const frontW = W;
  const midY = D;
  const midH = H;

  const panels: Panel[] = [
    { id: 'top', x: frontX, y: 0, w: W, h: D },
    { id: 'left', x: 0, y: midY, w: D, h: H },
    { id: 'front', x: frontX, y: midY, w: frontW, h: midH },
    { id: 'right', x: frontX + W, y: midY, w: D, h: H },
    { id: 'back', x: frontX + W + D, y: midY, w: W, h: H },
    { id: 'bottom', x: frontX, y: midY + H, w: W, h: D },
  ];

  const width = 2 * D + 2 * W;
  const height = 2 * D + H;

  // --- フラップ（各パネルの非接合エッジに台形タブ） ---
  const flaps: Flap[] = [];
  const folds: FoldLine[] = [];

  const p = (px: number, py: number) => `${px.toFixed(2)},${py.toFixed(2)}`;

  const edgeFlap = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    outX: number,
    outY: number,
  ) => {
    // a->b がパネルのエッジ。(outX,outY) は外向き単位ベクトル。
    const perpX = bx - ax;
    const perpY = by - ay;
    const len = Math.hypot(perpX, perpY);
    const ux = perpX / len;
    const uy = perpY / len;
    const c1x = ax + ux * taper + outX * fd;
    const c1y = ay + uy * taper + outY * fd;
    const c2x = bx - ux * taper + outX * fd;
    const c2y = by - uy * taper + outY * fd;
    flaps.push({ points: [p(ax, ay), p(c1x, c1y), p(c2x, c2y), p(bx, by)].join(' ') });
    folds.push({ x1: ax, y1: ay, x2: bx, y2: by });
  };

  const top = panels[0];
  const left = panels[1];
  const right = panels[3];
  const back = panels[4];
  const bottom = panels[5];

  // top: 上・左・右エッジが自由
  edgeFlap(top.x, top.y, top.x + top.w, top.y, 0, -1);
  edgeFlap(top.x, top.y + top.h, top.x, top.y, -1, 0);
  edgeFlap(top.x + top.w, top.y, top.x + top.w, top.y + top.h, 1, 0);
  // bottom: 下・左・右エッジが自由
  edgeFlap(bottom.x + bottom.w, bottom.y + bottom.h, bottom.x, bottom.y + bottom.h, 0, 1);
  edgeFlap(bottom.x, bottom.y, bottom.x, bottom.y + bottom.h, -1, 0);
  edgeFlap(bottom.x + bottom.w, bottom.y + bottom.h, bottom.x + bottom.w, bottom.y, 1, 0);
  // left: 外(左)・上・下エッジが自由
  edgeFlap(left.x, left.y + left.h, left.x, left.y, -1, 0);
  edgeFlap(left.x, left.y, left.x + left.w, left.y, 0, -1);
  edgeFlap(left.x + left.w, left.y + left.h, left.x, left.y + left.h, 0, 1);
  // right: 上・下エッジが自由（外エッジは back と接合）
  edgeFlap(right.x, right.y, right.x + right.w, right.y, 0, -1);
  edgeFlap(right.x + right.w, right.y + right.h, right.x, right.y + right.h, 0, 1);
  // back: 外(右)・上・下エッジが自由
  edgeFlap(back.x + back.w, back.y, back.x + back.w, back.y + back.h, 1, 0);
  edgeFlap(back.x, back.y, back.x + back.w, back.y, 0, -1);
  edgeFlap(back.x + back.w, back.y + back.h, back.x, back.y + back.h, 0, 1);

  // パネル同士の接合エッジも折り線として描く
  folds.push({ x1: frontX, y1: midY, x2: frontX + W, y2: midY }); // front-top
  folds.push({ x1: frontX, y1: midY + H, x2: frontX + W, y2: midY + H }); // front-bottom
  folds.push({ x1: frontX, y1: midY, x2: frontX, y2: midY + H }); // front-left
  folds.push({ x1: frontX + W, y1: midY, x2: frontX + W, y2: midY + H }); // front-right
  folds.push({ x1: frontX + W + D, y1: midY, x2: frontX + W + D, y2: midY + H }); // right-back

  // --- 寸法ハンドル ---
  const handles: HandleDef[] = [
    {
      axis: 'W',
      x: frontX + W,
      y: midY + H / 2,
      dir: 'x',
      label: '幅 W',
    },
    {
      axis: 'H',
      x: frontX + W / 2,
      y: midY + H,
      dir: 'y',
      label: '高さ H',
    },
    {
      axis: 'D',
      x: frontX + W / 2,
      y: 0,
      dir: 'y-',
      label: '奥行 D',
    },
  ];

  return { panels, flaps, folds, handles, width, height, flapDepth: fd };
}
