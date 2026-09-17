'use client';

import { useRef, useState } from 'react';

/** Visualizador de giro 360: arrasta para girar os quadros, como no site. */
export function GiroViewer({ quadros, altura = 260 }: { quadros: string[]; altura?: number }) {
  const [indice, setIndice] = useState(0);
  const arrastando = useRef(false);
  const ultimoX = useRef(0);

  function mover(x: number) {
    if (!arrastando.current || quadros.length === 0) return;
    const delta = x - ultimoX.current;
    if (Math.abs(delta) < 6) return;
    ultimoX.current = x;
    setIndice((i) => (i + (delta > 0 ? 1 : -1) + quadros.length) % quadros.length);
  }

  if (quadros.length === 0) return null;

  return (
    <div
      style={{ position: 'relative', height: altura, background: 'var(--fundo-3)', borderRadius: 12, overflow: 'hidden', cursor: 'grab', touchAction: 'pan-y' }}
      onPointerDown={(e) => {
        arrastando.current = true;
        ultimoX.current = e.clientX;
      }}
      onPointerUp={() => (arrastando.current = false)}
      onPointerLeave={() => (arrastando.current = false)}
      onPointerMove={(e) => mover(e.clientX)}
    >
      <img src={quadros[indice]} alt={`Quadro ${indice + 1} de ${quadros.length}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
      <span style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', fontSize: 11.5, color: 'var(--tinta-2)', background: 'rgba(13,15,18,.8)', padding: '4px 10px', borderRadius: 999 }}>
        arraste para girar · {indice + 1}/{quadros.length}
      </span>
    </div>
  );
}
