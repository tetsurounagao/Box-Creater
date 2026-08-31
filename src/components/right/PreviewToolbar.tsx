import { useBoxStore } from '../../store/boxStore';

const BG_PRESETS = [
  '#ffffff',
  '#ded7c9',
  '#e8ddcb',
  '#dfe4e7',
  '#3a3a3a',
  '#101012',
];

export default function PreviewToolbar() {
  const previewMode = useBoxStore((s) => s.previewMode);
  const setPreviewMode = useBoxStore((s) => s.setPreviewMode);
  const bgColor = useBoxStore((s) => s.bgColor);
  const setBgColor = useBoxStore((s) => s.setBgColor);

  return (
    <div className="preview-toolbar">
      <div className="segmented" role="group" aria-label="プレビュー表示">
        <button
          type="button"
          className={previewMode === 'plain' ? 'is-active' : ''}
          onClick={() => setPreviewMode('plain')}
        >
          シンプル
        </button>
        <button
          type="button"
          className={previewMode === 'room' ? 'is-active' : ''}
          onClick={() => setPreviewMode('room')}
        >
          部屋
        </button>
      </div>

      {previewMode === 'plain' && (
        <div className="bg-picker">
          <span className="bg-picker__label">背景</span>
          {BG_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch${bgColor.toLowerCase() === c ? ' is-active' : ''}`}
              style={{ background: c }}
              aria-label={`背景色 ${c}`}
              onClick={() => setBgColor(c)}
            />
          ))}
          <label className="swatch swatch--custom" aria-label="背景色をカスタム指定">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
