import { create } from 'zustand';
import type { Axis, FaceId } from '../lib/faces';
import { FACE_IDS } from '../lib/faces';

export interface FaceImage {
  /** object URL または dataURL */
  src: string;
  naturalW: number;
  naturalH: number;
}

/** 元画像 px を基準にしたクロップ矩形 */
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceState {
  image?: FaceImage;
  crop?: Crop;
  /** 寸法変更で面アスペクトが変わり、クロップの再調整が要る状態 */
  needsRecrop?: boolean;
}

export interface Dimensions {
  W: number;
  D: number;
  H: number;
}

export const DIM_MIN = 10;
export const DIM_MAX = 600;

export type PreviewMode = 'plain' | 'room';

export const DEFAULT_BG = '#ded7c9';

interface BoxStore {
  dimensions: Dimensions;
  faces: Record<FaceId, FaceState>;
  previewMode: PreviewMode;
  /** シンプルプレビュー時の背景色 */
  bgColor: string;
  setDimension: (axis: Axis, mm: number) => void;
  nudgeDimension: (axis: Axis, deltaMm: number) => void;
  setFaceImage: (id: FaceId, image: FaceImage) => void;
  setFaceCrop: (id: FaceId, crop: Crop) => void;
  clearFace: (id: FaceId) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  setBgColor: (color: string) => void;
}

function emptyFaces(): Record<FaceId, FaceState> {
  return FACE_IDS.reduce(
    (acc, id) => {
      acc[id] = {};
      return acc;
    },
    {} as Record<FaceId, FaceState>,
  );
}

function clampDim(mm: number) {
  return Math.max(DIM_MIN, Math.min(DIM_MAX, Math.round(mm)));
}

/** axis の変更で影響を受ける面 */
const AXIS_FACES: Record<Axis, FaceId[]> = {
  W: ['top', 'bottom', 'front', 'back'],
  D: ['top', 'bottom', 'left', 'right'],
  H: ['front', 'back', 'left', 'right'],
};

export const useBoxStore = create<BoxStore>((set) => ({
  dimensions: { W: 120, D: 80, H: 60 },
  faces: emptyFaces(),
  previewMode: 'plain',
  bgColor: DEFAULT_BG,

  setDimension: (axis, mm) =>
    set((state) => {
      const next = clampDim(mm);
      if (next === state.dimensions[axis]) return state;
      const faces = { ...state.faces };
      for (const id of AXIS_FACES[axis]) {
        if (faces[id].image) faces[id] = { ...faces[id], needsRecrop: true };
      }
      return { dimensions: { ...state.dimensions, [axis]: next }, faces };
    }),

  nudgeDimension: (axis, deltaMm) =>
    set((state) => {
      const next = clampDim(state.dimensions[axis] + deltaMm);
      if (next === state.dimensions[axis]) return state;
      const faces = { ...state.faces };
      for (const id of AXIS_FACES[axis]) {
        if (faces[id].image) faces[id] = { ...faces[id], needsRecrop: true };
      }
      return { dimensions: { ...state.dimensions, [axis]: next }, faces };
    }),

  setFaceImage: (id, image) =>
    set((state) => ({
      faces: { ...state.faces, [id]: { image, crop: undefined, needsRecrop: false } },
    })),

  setFaceCrop: (id, crop) =>
    set((state) => ({
      faces: { ...state.faces, [id]: { ...state.faces[id], crop, needsRecrop: false } },
    })),

  clearFace: (id) =>
    set((state) => {
      const prev = state.faces[id].image;
      if (prev && prev.src.startsWith('blob:')) URL.revokeObjectURL(prev.src);
      return { faces: { ...state.faces, [id]: {} } };
    }),

  setPreviewMode: (mode) => set({ previewMode: mode }),
  setBgColor: (color) => set({ bgColor: color }),
}));

if (import.meta.env.DEV) {
  (window as unknown as { __box: typeof useBoxStore }).__box = useBoxStore;
}
