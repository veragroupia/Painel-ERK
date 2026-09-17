'use client';

import { useEffect, useRef, useState } from 'react';
import type { PecaSpec, Viewer } from './jewelryViewer';

export function Viewer3D({
  spec,
  orbitaVertical,
  className,
  style,
  legenda,
}: {
  spec: PecaSpec;
  orbitaVertical?: boolean;
  className?: string;
  style?: React.CSSProperties;
  legenda?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    import('./jewelryViewer')
      .then((m) => m.createViewer(canvas, { orbitaVertical }))
      .then((v) => {
        if (!vivo) {
          v.dispose();
          return;
        }
        viewerRef.current = v;
        v.setSpec(spec);
      })
      .catch((e) => {
        console.error('3D', e);
        setErro(true);
      });
    return () => {
      vivo = false;
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewerRef.current) viewerRef.current.setSpec(spec);
  }, [JSON.stringify(spec)]);

  if (erro) {
    return (
      <p style={{ fontSize: 13, color: 'var(--text-2)', padding: 14 }}>
        O modelo 3D não carregou. Confira a conexão e recarregue a página.
      </p>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: orbitaVertical ? 'none' : 'pan-y', cursor: 'grab', ...style }}
      aria-label={legenda}
    />
  );
}
