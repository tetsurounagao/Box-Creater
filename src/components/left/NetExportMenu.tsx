import { useState } from 'react';
import { FACE_IDS } from '../../lib/faces';
import { exportNet, type ExportFormat } from '../../lib/exportNet';
import { useBoxStore } from '../../store/boxStore';
import type { FaceCanvasMap } from '../../hooks/useFaceCanvases';

interface Props {
  faceCanvases: FaceCanvasMap;
}

const FORMATS: { key: ExportFormat; label: string }[] = [
  { key: 'png', label: 'PNG' },
  { key: 'jpeg', label: 'JPEG' },
  { key: 'pdf', label: 'PDF' },
];

export default function NetExportMenu({ faceCanvases }: Props) {
  const { W, D, H } = useBoxStore((s) => s.dimensions);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState(false);

  const run = async (format: ExportFormat) => {
    if (busy) return;
    setBusy(format);
    setError(false);
    try {
      const images = Object.fromEntries(
        FACE_IDS.filter((id) => faceCanvases[id]).map((id) => [id, faceCanvases[id]!.url]),
      );
      await exportNet(format, { W, D, H, images });
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="net-export">
      <span className="net-export__label">展開図を書き出し</span>
      {FORMATS.map((f) => (
        <button
          key={f.key}
          type="button"
          className="net-export__btn"
          disabled={busy !== null}
          onClick={() => run(f.key)}
        >
          {busy === f.key ? '…' : f.label}
        </button>
      ))}
      {error && <span className="net-export__err">書き出しに失敗しました</span>}
    </div>
  );
}
