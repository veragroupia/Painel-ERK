'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adicionarNota } from '@/lib/admin/orderActions';

export type NotaLinha = { id: string; texto: string; autor: string; quando: string };

export function PedidoNotas({ orderId, notas }: { orderId: number; notas: NotaLinha[] }) {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [pendente, start] = useTransition();

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-stat__label" style={{ marginBottom: 6 }}>
        Anotações internas
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--tinta-3)', margin: '0 0 12px' }}>Só a equipe vê. O cliente não recebe nada disso.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          start(async () => {
            await adicionarNota(orderId, texto);
            setTexto('');
            router.refresh();
          });
        }}
        style={{ display: 'grid', gap: 10 }}
      >
        <textarea className="adm-textarea" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="ex.: cliente pediu para entregar depois das 18h" />
        <button type="submit" className="erk-btn erk-btn--s erk-btn--sm" style={{ justifySelf: 'start' }} disabled={pendente || !texto.trim()}>
          {pendente ? 'Salvando…' : 'Anotar'}
        </button>
      </form>

      {notas.length > 0 ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          {notas.map((n) => (
            <div key={n.id} style={{ borderTop: '1px solid var(--linha)', paddingTop: 12 }}>
              <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>{n.texto}</p>
              <span style={{ fontSize: 11.5, color: 'var(--tinta-3)' }}>
                {n.autor} · {n.quando}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
