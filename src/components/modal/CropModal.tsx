import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import type { FaceId } from '../../lib/faces';
import { FACE_LABEL, faceAspect } from '../../lib/faces';
import { useBoxStore } from '../../store/boxStore';

interface Props {
  faceId: FaceId;
  onClose: () => void;
}

export default function CropModal({ faceId, onClose }: Props) {
  const face = useBoxStore((s) => s.faces[faceId]);
  const { W, D, H } = useBoxStore((s) => s.dimensions);
  const setFaceCrop = useBoxStore((s) => s.setFaceCrop);

  const aspect = faceAspect(faceId, W, D, H);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  if (!face.image) return null;

  const apply = () => {
    if (pixels) {
      setFaceCrop(faceId, {
        x: pixels.x,
        y: pixels.y,
        width: pixels.width,
        height: pixels.height,
      });
    }
    onClose();
  };

  const faceSize =
    faceId === 'front' || faceId === 'back'
      ? `${W} × ${H} mm`
      : faceId === 'left' || faceId === 'right'
        ? `${D} × ${H} mm`
        : `${W} × ${D} mm`;

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{FACE_LABEL[faceId]} の画像をトリミング</h2>
          <div className="modal__meta">
            元画像 {face.image.naturalW} × {face.image.naturalH} px ／ 面 {faceSize}（比 {aspect.toFixed(2)} : 1・固定）
          </div>
        </div>

        <div className="modal__crop">
          <Cropper
            image={face.image.src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            restrictPosition
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            initialCroppedAreaPixels={face.crop}
          />
        </div>

        <div className="modal__controls">
          <span>ズーム</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <span>{zoom.toFixed(2)}×</span>
        </div>

        <div className="modal__foot">
          <button type="button" className="btn" onClick={onClose}>
            キャンセル
          </button>
          <button type="button" className="btn btn--primary" onClick={apply}>
            適用
          </button>
        </div>
      </div>
    </div>
  );
}
