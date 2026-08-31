import type { Panel } from '../../lib/geometry';
import { FACE_LABEL } from '../../lib/faces';
import type { FaceCanvas } from '../../hooks/useFaceCanvases';

interface Props {
  panel: Panel;
  wMm: number;
  hMm: number;
  faceCanvas?: FaceCanvas;
  needsRecrop?: boolean;
  onClick: (evt: React.MouseEvent) => void;
  onRecrop: () => void;
}

export default function NetPanel({
  panel,
  wMm,
  hMm,
  faceCanvas,
  needsRecrop,
  onClick,
  onRecrop,
}: Props) {
  const { id, x, y, w, h } = panel;
  const clipId = `clip-${id}`;

  return (
    <g>
      {faceCanvas && (
        <>
          <clipPath id={clipId}>
            <rect x={x} y={y} width={w} height={h} />
          </clipPath>
          <image
            href={faceCanvas.url}
            x={x}
            y={y}
            width={w}
            height={h}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            style={{ pointerEvents: 'none' }}
          />
        </>
      )}
      <rect
        className={`net-panel__rect${faceCanvas ? ' net-panel__rect--has-image' : ''}`}
        x={x}
        y={y}
        width={w}
        height={h}
        onClick={onClick}
      />
      {!faceCanvas && (
        <>
          <text className="net-panel__label" x={x + w / 2} y={y + h / 2 - 6}>
            {FACE_LABEL[id]}
          </text>
          <text className="net-panel__dim" x={x + w / 2} y={y + h / 2 + 8}>
            {Math.round(wMm)} × {Math.round(hMm)}
          </text>
        </>
      )}
      {needsRecrop && (
        <text
          className="net-recrop"
          x={x + w / 2}
          y={y + h - 6}
          onClick={(e) => {
            e.stopPropagation();
            onRecrop();
          }}
        >
          ⟳ 再調整
        </text>
      )}
    </g>
  );
}
