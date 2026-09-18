'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { MarginBadge } from './MarginBadge';
import { AdminEmptyState } from './AdminEmptyState';
import { reordenarPecas } from '@/lib/admin/productActions';
import { BotoesMover } from './BotoesMover';

export type PecaCard = {
  id: string;
  nome: string;
  spec: string;
  foto: string;
  preco: number;
  custo: number;
  margem: number;
  estoque: number;
  situacao: string;
  categoria: string;
  modelo3d: string;
};

const SITUACAO_NOME: Record<string, string> = { published: 'Publicada', draft: 'Rascunho', soldout: 'Esgotada' };

export function PecasGrade({ cards, podeReordenar }: { cards: PecaCard[]; podeReordenar: boolean }) {
  const router = useRouter();
  const [ordem, setOrdem] = useState(cards);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [, start] = useTransition();

  if (cards.length === 0) {
    return (
      <AdminEmptyState
        icon="adm_pecas"
        title="Nenhuma peça cadastrada ainda."
        action={
          <Link href="/pecas/nova" className="erk-btn erk-btn--p erk-btn--sm" style={{ marginTop: 12 }}>
            Comece subindo as fotos da primeira
          </Link>
        }
      />
    );
  }

  function soltar(alvoId: string) {
    if (!arrastando || arrastando === alvoId) return;
    const atual = [...ordem];
    const de = atual.findIndex((c) => c.id === arrastando);
    const para = atual.findIndex((c) => c.id === alvoId);
    const [movido] = atual.splice(de, 1);
    atual.splice(para, 0, movido);
    setArrastando(null);
    aplicar(atual);
  }

  function aplicar(atual: typeof ordem) {
    setOrdem(atual);
    start(async () => {
      await reordenarPecas(atual.map((c) => c.id));
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

  return (
    <div className="adm-cards">
      {ordem.map((c, i) => (
        <div
          key={c.id}
          className="adm-piece-card"
          draggable={podeReordenar}
          onDragStart={() => setArrastando(c.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => soltar(c.id)}
          style={{ opacity: arrastando === c.id ? 0.5 : 1, cursor: podeReordenar ? 'grab' : 'default' }}
        >
          {podeReordenar ? (
            <BotoesMover
              className="adm-mover--sobre"
              eixo="horizontal"
              aoSubir={() => mover(i, i - 1)}
              aoDescer={() => mover(i, i + 1)}
              primeiro={i === 0}
              ultimo={i === ordem.length - 1}
              rotulo={c.nome}
            />
          ) : null}
          <Link href={`/pecas/${c.id}`} style={{ display: 'contents' }}>
            <div className="adm-piece-card__fig">
              <img src={c.foto} alt="" />
              {c.situacao !== 'published' ? (
                <span className="adm-pill" style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(13,15,18,.86)', color: 'var(--tinta-2)' }}>
                  {SITUACAO_NOME[c.situacao]}
                </span>
              ) : null}
              {c.modelo3d === 'pending' ? (
                <span className="adm-pill" style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(216,54,62,.9)', color: '#fff' }}>
                  3D p/ aprovar
                </span>
              ) : null}
            </div>
            <div className="adm-piece-card__b">
              <b style={{ fontSize: 13.5, lineHeight: 1.3 }}>{c.nome}</b>
              <span style={{ fontSize: 11.5, color: 'var(--tinta-3)' }}>{c.spec}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <b style={{ fontSize: 15, letterSpacing: '-.01em' }}>{fmt(c.preco)}</b>
                <MarginBadge pct={c.margem} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--tinta-3)' }}>
                <span>custo {fmt(c.custo)}</span>
                <span>{c.estoque} em estoque</span>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
