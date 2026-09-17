'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { salvarCustoPedido, type CustoPedidoInput } from '@/lib/admin/orderActions';

const LINHAS: { campo: keyof CustoPedidoInput; rotulo: string; sufixo?: string }[] = [
  { campo: 'silverGrams', rotulo: 'Prata (gramas)', sufixo: 'g' },
  { campo: 'silverPricePerGram', rotulo: 'Valor do grama' },
  { campo: 'laborCost', rotulo: 'Mão de obra' },
  { campo: 'polishGrams', rotulo: 'Polimento (gramas de massa)', sufixo: 'g' },
  { campo: 'polishCost', rotulo: 'Polimento' },
  { campo: 'packagingCost', rotulo: 'Embalagem' },
  { campo: 'clampCost', rotulo: 'Fecho e argolas' },
  { campo: 'thirdPartyCost', rotulo: 'Serviços de terceiros' },
];

export function PedidoCusto({ orderId, venda, taxa, inicial }: { orderId: number; venda: number; taxa: number; inicial: CustoPedidoInput }) {
  const router = useRouter();
  const [valores, setValores] = useState<CustoPedidoInput>(inicial);
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);

  const custoTotal = valores.silverGrams * valores.silverPricePerGram + valores.laborCost + valores.polishCost + valores.packagingCost + valores.clampCost + valores.thirdPartyCost;
  const sobrou = venda - taxa - custoTotal;
  const pct = venda > 0 ? (sobrou / venda) * 100 : 0;

  function mudar(campo: keyof CustoPedidoInput, valor: string) {
    const n = parseFloat(valor.replace(',', '.'));
    setValores((v) => ({ ...v, [campo]: Number.isFinite(n) ? n : 0 }));
    setSalvo(false);
  }

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-stat__label" style={{ marginBottom: 14 }}>
        Custo e lucro deste pedido
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {LINHAS.map((l) => (
          <div key={l.campo} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label htmlFor={`custo-${l.campo}`} style={{ flex: 1, fontSize: 13.5, color: 'var(--tinta-2)' }}>
              {l.rotulo}
            </label>
            <input
              id={`custo-${l.campo}`}
              className="adm-input adm-input--sm"
              style={{ width: 110, textAlign: 'right' }}
              inputMode="decimal"
              value={String(valores[l.campo]).replace('.', ',')}
              onChange={(e) => mudar(l.campo, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--linha)', marginTop: 16, paddingTop: 14, display: 'grid', gap: 8, fontSize: 13.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--tinta-2)' }}>Custo total</span>
          <b>{fmt(custoTotal)}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--tinta-2)' }}>Venda</span>
          <span>{fmt(venda)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--tinta-2)' }}>Taxa de pagamento</span>
          <span>– {fmt(taxa)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--linha)', paddingTop: 12, marginTop: 4 }}>
          <span style={{ fontWeight: 600 }}>Sobrou</span>
          <b style={{ fontSize: 22, fontWeight: 600, color: sobrou >= 0 ? 'var(--ok)' : 'var(--acento)' }}>
            {fmt(sobrou)} ({pct.toFixed(1)}%)
          </b>
        </div>
        {sobrou < 0 ? <p style={{ color: 'var(--acento)', fontSize: 12.5, margin: 0 }}>Esse pedido está saindo no prejuízo. Confira o custo da prata e o preço de venda.</p> : null}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
        <button
          type="button"
          className="erk-btn erk-btn--p erk-btn--sm"
          disabled={pendente}
          onClick={() =>
            start(async () => {
              await salvarCustoPedido(orderId, valores);
              setSalvo(true);
              router.refresh();
            })
          }
        >
          {pendente ? 'Salvando…' : 'Salvar custo'}
        </button>
        {salvo ? <span style={{ fontSize: 12.5, color: 'var(--ok)' }}>Custo salvo.</span> : null}
      </div>
    </div>
  );
}
