'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { reordenarSecoes, alternarSecao } from '@/lib/admin/vitrineActions';
import { BotoesMover } from './BotoesMover';

const NOME_SECAO: Record<string, string> = {
  destaque: 'Destaque do dia',
  lancamentos: 'Lançamentos',
  mais_vendidos: 'Mais vendidos',
  combos: 'Combos',
  promocoes: 'Promoções',
};

export function VitrineOrdem({ secoes }: { secoes: { id: string; ativa: boolean }[] }) {
  const router = useRouter();
  const [ordem, setOrdem] = useState(secoes);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [, start] = useTransition();

  function aplicar(atual: typeof ordem) {
    setOrdem(atual);
    start(async () => {
      await reordenarSecoes(atual.map((s) => s.id));
      router.refresh();
    });
  }

  function mover(de: number, para: number) {
    if (para < 0 || para >= ordem.length) return;
    const atual = [...ordem];
    const [movido] = atual.splice(de, 1);
    atual.splice(para, 0, movido);
    aplicar(atual);
  }

  function soltar(alvoId: string) {
    if (!arrastando || arrastando === alvoId) return;
    const atual = [...ordem];
    const de = atual.findIndex((s) => s.id === arrastando);
    const para = atual.findIndex((s) => s.id === alvoId);
    const [movido] = atual.splice(de, 1);
    atual.splice(para, 0, movido);
    setArrastando(null);
    aplicar(atual);
  }

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-stat__label" style={{ marginBottom: 4 }}>
        Ordem da vitrine
      </div>
      <p style={{ fontSize: 12, color: 'var(--tinta-3)', margin: '0 0 14px' }}>Decida em que ordem as seções aparecem na home do site.</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {ordem.map((s, i) => (
          <div
            key={s.id}
            className="adm-drag-row"
            draggable
            onDragStart={() => setArrastando(s.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => soltar(s.id)}
            style={{ opacity: arrastando === s.id ? 0.5 : 1 }}
          >
            <Icon name="adm_arrasto" size={16} className="adm-drag-handle" />
            <BotoesMover
              aoSubir={() => mover(i, i - 1)}
              aoDescer={() => mover(i, i + 1)}
              primeiro={i === 0}
              ultimo={i === ordem.length - 1}
              rotulo={NOME_SECAO[s.id] || s.id}
            />
            <span style={{ flex: 1, fontSize: 13.5 }}>{NOME_SECAO[s.id] || s.id}</span>
            <label className="adm-switch" title={s.ativa ? 'aparece na home' : 'escondida'}>
              <input type="checkbox" checked={s.ativa} onChange={(e) => start(async () => { await alternarSecao(s.id, e.target.checked); router.refresh(); })} />
              <span className="adm-switch-track" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
