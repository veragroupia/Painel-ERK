'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarOndeEsta } from '@/lib/admin/orderActions';

const SUGESTOES = ['na bancada', 'em polimento', 'embalado, no balcão', 'com o motoboy', 'postado'];

export function PedidoOndeEsta({ orderId, valor }: { orderId: number; valor: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState(valor);
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);

  function salvar(novo: string) {
    setTexto(novo);
    start(async () => {
      await atualizarOndeEsta(orderId, novo);
      setSalvo(true);
      router.refresh();
    });
  }

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--linha)', paddingTop: 14 }}>
      <label className="adm-label" htmlFor="onde-esta">
        Onde está
      </label>
      <p style={{ fontSize: 11.5, color: 'var(--tinta-3)', margin: '4px 0 8px' }}>É isso que o cliente vê quando pergunta pelo pedido.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input id="onde-esta" className="adm-input adm-input--sm" value={texto} onChange={(e) => { setTexto(e.target.value); setSalvo(false); }} placeholder="ex.: na bancada" />
        <button type="button" className="erk-btn erk-btn--s erk-btn--sm" disabled={pendente} onClick={() => salvar(texto)}>
          {pendente ? '…' : 'Salvar'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {SUGESTOES.map((s) => (
          <button key={s} type="button" className="erk-chip" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => salvar(s)}>
            {s}
          </button>
        ))}
      </div>
      {salvo ? <p style={{ fontSize: 12, color: 'var(--ok)', marginTop: 8 }}>Atualizado.</p> : null}
    </div>
  );
}
