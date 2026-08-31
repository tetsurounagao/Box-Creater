import type { ReactNode } from 'react';

interface Props {
  left: ReactNode;
  right: ReactNode;
}

export default function Layout({ left, right }: Props) {
  return (
    <div className="layout">
      <section className="pane pane--left">
        <div className="pane__header">左：展開図エディタ</div>
        {left}
      </section>
      <section className="pane pane--right">
        <div className="pane__header">右：3D プレビュー</div>
        <div className="pane__body">{right}</div>
      </section>
    </div>
  );
}
