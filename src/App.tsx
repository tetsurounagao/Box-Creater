import { useCallback, useState } from 'react';
import Layout from './components/Layout';
import NetEditor from './components/left/NetEditor';
import DimensionInputs from './components/left/DimensionInputs';
import NetExportMenu from './components/left/NetExportMenu';
import BoxPreview from './components/right/BoxPreview';
import CropModal from './components/modal/CropModal';
import { useFaceCanvases } from './hooks/useFaceCanvases';
import { useBoxStore } from './store/boxStore';
import type { FaceId } from './lib/faces';

export default function App() {
  const faceCanvases = useFaceCanvases();
  const setFaceImage = useBoxStore((s) => s.setFaceImage);
  const [cropTarget, setCropTarget] = useState<FaceId | null>(null);

  const handlePickFile = useCallback(
    (id: FaceId, file: File) => {
      const src = URL.createObjectURL(file);
      const probe = new Image();
      probe.onload = () => {
        setFaceImage(id, {
          src,
          naturalW: probe.naturalWidth,
          naturalH: probe.naturalHeight,
        });
        setCropTarget(id);
      };
      probe.src = src;
    },
    [setFaceImage],
  );

  return (
    <>
      <Layout
        left={
          <>
            <DimensionInputs />
            <NetExportMenu faceCanvases={faceCanvases} />
            <NetEditor
              faceCanvases={faceCanvases}
              onPickFile={handlePickFile}
              onRecrop={setCropTarget}
            />
          </>
        }
        right={<BoxPreview faceCanvases={faceCanvases} />}
      />
      {cropTarget && (
        <CropModal faceId={cropTarget} onClose={() => setCropTarget(null)} />
      )}
    </>
  );
}
