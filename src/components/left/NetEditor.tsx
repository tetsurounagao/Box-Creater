import { useCallback, useRef, useState } from 'react';
import { buildNet } from '../../lib/geometry';
import type { FaceId } from '../../lib/faces';
import { FACE_LABEL } from '../../lib/faces';
import { useBoxStore } from '../../store/boxStore';
import type { FaceCanvasMap } from '../../hooks/useFaceCanvases';
import NetPanel from './NetPanel';
import DragHandle from './DragHandle';

interface Props {
  faceCanvases: FaceCanvasMap;
  onPickFile: (id: FaceId, file: File) => void;
  onRecrop: (id: FaceId) => void;
}

const PAD = 34; // mm。フラップ + 余白

export default function NetEditor({ faceCanvases, onPickFile, onRecrop }: Props) {
  const { W, D, H } = useBoxStore((s) => s.dimensions);
  const faces = useBoxStore((s) => s.faces);
  const clearFace = useBoxStore((s) => s.clearFace);

  const net = buildNet(W, D, H);
  const vbW = net.width + PAD * 2;
  const vbH = net.height + PAD * 2;

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFace = useRef<FaceId | null>(null);

  const [popover, setPopover] = useState<{ id: FaceId; x: number; y: number } | null>(null);

  const getPxPerMm = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return 1;
    const rect = svg.getBoundingClientRect();
    // preserveAspectRatio="xMidYMid meet": 実スケールは幅・高さの小さい方
    return Math.min(rect.width / vbW, rect.height / vbH);
  }, [vbW, vbH]);

  const handlePanelClick = (id: FaceId, evt: React.MouseEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setPopover({ id, x: evt.clientX - rect.left, y: evt.clientY - rect.top });
  };

  const triggerUpload = () => {
    pendingFace.current = popover?.id ?? null;
    setPopover(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = pendingFace.current;
    e.target.value = '';
    if (file && id) onPickFile(id, file);
  };

  const scaleMm = Math.max(6, Math.min(W, D, H) * 0.14);

  return (
    <div className="pane__body">
      <div className="net-wrap" ref={wrapRef}>
        <svg
          ref={svgRef}
          className="net-svg"
          viewBox={`${-PAD} ${-PAD} ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* フラップ */}
          {net.flaps.map((f, i) => (
            <polygon key={`flap-${i}`} className="net-flap" points={f.points} />
          ))}
          {/* 折り線 */}
          {net.folds.map((l, i) => (
            <line
              key={`fold-${i}`}
              className="net-fold"
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
            />
          ))}
          {/* パネル */}
          {net.panels.map((panel) => (
            <NetPanel
              key={panel.id}
              panel={panel}
              wMm={panel.w}
              hMm={panel.h}
              faceCanvas={faceCanvases[panel.id]}
              needsRecrop={faces[panel.id].needsRecrop && !!faces[panel.id].image}
              onClick={(evt) => handlePanelClick(panel.id, evt)}
              onRecrop={() => onRecrop(panel.id)}
            />
          ))}
          {/* 寸法ハンドル */}
          {net.handles.map((h) => (
            <DragHandle key={h.axis} handle={h} getPxPerMm={getPxPerMm} scaleMm={scaleMm} />
          ))}
        </svg>

        {popover && (
          <>
            <div className="popover__backdrop" onClick={() => setPopover(null)} />
            <div
              className="popover"
              style={{
                left: Math.min(popover.x, (wrapRef.current?.clientWidth ?? 0) - 180),
                top: popover.y,
              }}
            >
              <div className="popover__title">{FACE_LABEL[popover.id]} の画像</div>
              <button type="button" onClick={triggerUpload}>
                画像をアップロード…
              </button>
              {faces[popover.id].image && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const id = popover.id;
                      setPopover(null);
                      onRecrop(id);
                    }}
                  >
                    トリミングを調整…
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      clearFace(popover.id);
                      setPopover(null);
                    }}
                  >
                    画像を削除
                  </button>
                </>
              )}
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
