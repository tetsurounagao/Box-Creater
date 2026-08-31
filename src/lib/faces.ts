export type FaceId = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';
export type Axis = 'W' | 'D' | 'H';

export const FACE_IDS: FaceId[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];

export const FACE_LABEL: Record<FaceId, string> = {
  top: '天板',
  bottom: '底板',
  front: '前面',
  back: '背面',
  left: '左側面',
  right: '右側面',
};

/** PDF など日本語フォントを埋め込めない書き出し用の ASCII ラベル */
export const FACE_LABEL_EN: Record<FaceId, string> = {
  top: 'TOP',
  bottom: 'BOTTOM',
  front: 'FRONT',
  back: 'BACK',
  left: 'LEFT',
  right: 'RIGHT',
};

/** THREE.BoxGeometry のマテリアル配列の並び順に対応する faceId。
 *  index: 0:+X 1:-X 2:+Y 3:-Y 4:+Z 5:-Z */
export const MATERIAL_ORDER: FaceId[] = ['right', 'left', 'top', 'bottom', 'front', 'back'];

/** 面を正対で見るためのカメラ方向（箱ローカル座標の外向き法線） */
export const FACE_NORMAL: Record<FaceId, [number, number, number]> = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};

/** その面に貼る画像のアスペクト比（横 / 縦）を寸法から返す */
export function faceAspect(id: FaceId, W: number, D: number, H: number): number {
  switch (id) {
    case 'front':
    case 'back':
      return W / H;
    case 'left':
    case 'right':
      return D / H;
    case 'top':
    case 'bottom':
      return W / D;
  }
}
