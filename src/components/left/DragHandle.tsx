import { useRef } from 'react';
import type { HandleDef } from '../../lib/geometry';
import { useBoxStore } from '../../store/boxStore';

interface Props {
  handle: HandleDef;
  /** 画面上の 1mm が何 CSS px か */
  getPxPerMm: () => number;
  /** ハンドルの見た目サイズ（mm） */
  scaleMm: number;
  /** タッチ（粗いポインタ）: 掴みやすいよう大きくする */
  touch?: boolean;
}

export default function DragHandle({ handle, getPxPerMm, scaleMm, touch }: Props) {
  const setDimension = useBoxStore((s) => s.setDimension);
  const drag = useRef<{ startClient: number; startValue: number } | null>(null);

  const horizontal = handle.dir !== 'x'; // grip の長辺が水平か
  const gripLong = scaleMm * (touch ? 3.4 : 2.6);
  const gripShort = scaleMm * (touch ? 1.5 : 0.9);
  const hit = scaleMm * (touch ? 5.5 : 3);

  const endDrag = (e: React.PointerEvent) => {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* capture 済みでない場合は無視 */
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startClient: handle.dir === 'x' ? e.clientX : e.clientY,
      startValue: useBoxStore.getState().dimensions[handle.axis],
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    // ボタンが離れていれば drag 状態が残っていても無視（取りこぼし対策）
    if (e.buttons === 0) {
      drag.current = null;
      return;
    }
    const pxPerMm = getPxPerMm() || 1;
    const current = handle.dir === 'x' ? e.clientX : e.clientY;
    const deltaPx = current - drag.current.startClient;
    const sign = handle.dir === 'y-' ? -1 : 1;
    const deltaMm = (deltaPx / pxPerMm) * sign;
    setDimension(handle.axis, drag.current.startValue + deltaMm);
  };

  return (
    <g
      style={{ ['--handle-cursor' as string]: handle.dir === 'x' ? 'ew-resize' : 'ns-resize' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
    >
      <title>{handle.label}（ドラッグで調整）</title>
      <rect
        className="net-handle__hit"
        x={handle.x - hit / 2}
        y={handle.y - hit / 2}
        width={hit}
        height={hit}
      />
      <rect
        className="net-handle"
        x={handle.x - (horizontal ? gripLong : gripShort) / 2}
        y={handle.y - (horizontal ? gripShort : gripLong) / 2}
        width={horizontal ? gripLong : gripShort}
        height={horizontal ? gripShort : gripLong}
        rx={gripShort / 2}
      />
    </g>
  );
}
