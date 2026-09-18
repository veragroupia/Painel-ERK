'use client';

import { useEffect, useRef, useState } from 'react';

/** Mede a largura real do container do gráfico.
 *
 *  Sem isso o SVG nasce com um viewBox largo (760) e altura fixa: no celular
 *  o navegador encolhe o desenho inteiro para caber na largura, e o gráfico
 *  vira uma faixa baixa com os números do eixo em 5px, ilegíveis.
 *
 *  Medindo, o viewBox passa a ter a mesma largura que o elemento na tela —
 *  uma unidade do SVG vira um pixel — então a altura é a que se pede e a
 *  fonte sai do tamanho que se escreveu, em qualquer largura de tela. */
export function useLarguraGrafico(inicial = 760) {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(inicial);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entradas) => {
      const w = Math.round(entradas[0].contentRect.width);
      if (w > 0) setLargura(Math.max(240, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, largura };
}
