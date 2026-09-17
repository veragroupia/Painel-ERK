'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { ConfirmButton } from './ConfirmButton';
import { salvarDespesaFixa, alternarDespesaFixa, excluirDespesaFixa } from '@/lib/admin/settingsActions';

type Despesa = { id: string; nome: string; valor: number; dia: number; ativa: boolean };

export function DespesasFixas({ despesas }: { despesas: Despesa[] }) {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState(0);
  const [dia, setDia] = useState(5);
  const [, start] = useTransition();

  const total = despesas.filter((d) => d.ativa).reduce((a, d) => a + d.valor, 0);

  return (
    <div className="adm-card adm-card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div className="adm-stat__label">Despesas fixas</div>
        <b style={{ fontSize: 15 }}>{fmt(total)} por mês</b>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {despesas.map((d) => (
          <div key={d.id} className="adm-drag-row" style={{ opacity: d.ativa ? 1 : 0.55 }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
              {d.nome}
              <em style={{ display: 'block', fontStyle: 'normal', fontSize: 11.5, color: 'var(--tinta-3)' }}>todo dia {d.dia}</em>
            </span>
            <b style={{ fontSize: 14 }}>{fmt(d.valor)}</b>
            <label className="adm-switch" title={d.ativa ? 'entra na conta' : 'fora da conta'}>
              <input type="checkbox" checked={d.ativa} onChange={(e) => start(async () => { await alternarDespesaFixa(d.id, e.target.checked); router.refresh(); })} />
              <span className="adm-switch-track" />
            </label>
            <ConfirmButton
              label="Excluir"
              title={`Excluir "${d.nome}"?`}
              description="A despesa deixa de entrar na conta do mês daqui pra frente. Os meses já fechados não mudam."
              confirmLabel="Excluir"
              onConfirm={async () => {
                await excluirDespesaFixa(d.id);
                router.refresh();
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <input className="adm-input adm-input--sm" style={{ flex: '1 1 160px' }} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Aluguel da oficina" />
        <input className="adm-input adm-input--sm" style={{ width: 110 }} inputMode="decimal" value={String(valor).replace('.', ',')} onChange={(e) => setValor(parseFloat(e.target.value.replace(',', '.')) || 0)} placeholder="valor" />
        <input className="adm-input adm-input--sm" style={{ width: 90 }} inputMode="numeric" value={dia} onChange={(e) => setDia(parseInt(e.target.value, 10) || 1)} placeholder="dia" />
        <button
          type="button"
          className="erk-btn erk-btn--s erk-btn--sm"
          disabled={!nome.trim()}
          onClick={() =>
            start(async () => {
              await salvarDespesaFixa({ name: nome, amount: valor, dayOfMonth: dia });
              setNome('');
              setValor(0);
              router.refresh();
            })
          }
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
