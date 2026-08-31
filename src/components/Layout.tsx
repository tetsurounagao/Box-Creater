import type { ReactNode } from 'react';

export type MobileView = 'net' | 'preview';

interface Props {
  left: ReactNode;
  right: ReactNode;
  isMobile: boolean;
  mobileView: MobileView;
  onMobileViewChange: (v: MobileView) => void;
}

export default function Layout({
  left,
  right,
  isMobile,
  mobileView,
  onMobileViewChange,
}: Props) {
  const showNet = !isMobile || mobileView === 'net';
  const showPreview = !isMobile || mobileView === 'preview';

  return (
    <div className={`layout${isMobile ? ' layout--mobile' : ''}`}>
      {isMobile && (
        <div className="mobile-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === 'net'}
            className={mobileView === 'net' ? 'is-active' : ''}
            onClick={() => onMobileViewChange('net')}
          >
            展開図
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === 'preview'}
            className={mobileView === 'preview' ? 'is-active' : ''}
            onClick={() => onMobileViewChange('preview')}
          >
            3D プレビュー
          </button>
        </div>
      )}

      <section className="pane pane--left" hidden={!showNet}>
        <div className="pane__header">左：展開図エディタ</div>
        {left}
      </section>
      <section className="pane pane--right" hidden={!showPreview}>
        <div className="pane__header">右：3D プレビュー</div>
        <div className="pane__body">{right}</div>
      </section>
    </div>
  );
}
