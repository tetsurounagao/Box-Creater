import type { Axis } from '../../lib/faces';
import { useBoxStore } from '../../store/boxStore';

const FIELDS: { axis: Axis; label: string }[] = [
  { axis: 'W', label: '幅 W' },
  { axis: 'D', label: '奥行 D' },
  { axis: 'H', label: '高さ H' },
];

export default function DimensionInputs() {
  const dimensions = useBoxStore((s) => s.dimensions);
  const setDimension = useBoxStore((s) => s.setDimension);
  const nudgeDimension = useBoxStore((s) => s.nudgeDimension);

  return (
    <div className="dims">
      {FIELDS.map(({ axis, label }) => (
        <label className="dims__field" key={axis}>
          {label}
          <span className="dims__row">
            <button
              type="button"
              className="dims__step"
              aria-label={`${label} を 1mm 減らす`}
              onClick={() => nudgeDimension(axis, -1)}
            >
              −
            </button>
            <input
              type="number"
              value={dimensions[axis]}
              min={10}
              max={600}
              onChange={(e) => setDimension(axis, Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  nudgeDimension(axis, e.shiftKey ? 10 : 1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  nudgeDimension(axis, e.shiftKey ? -10 : -1);
                }
              }}
            />
            <button
              type="button"
              className="dims__step"
              aria-label={`${label} を 1mm 増やす`}
              onClick={() => nudgeDimension(axis, 1)}
            >
              +
            </button>
            <span className="unit">mm</span>
          </span>
        </label>
      ))}
    </div>
  );
}
