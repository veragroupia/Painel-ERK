'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { salvarPrecoPrata } from '@/lib/admin/settingsActions';

type Registro = { id: string; valor: number; quando: string; quem: string };

export function AjustesPrata({ atual, historico }: { atual: number; historico: Registro[] }) {
  const router = useRouter();
  const [valor, setValor] = useState(atual);
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);

  return (
    <div className="adm-grid-2" style={{ alignItems: 'start' }}>
      <div className="adm-card adm-card-pad" style={{ display: 'grid', gap: 14 }}>
        <div>
          <div className="adm-stat__label">Valor do grama da prata hoje</div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.01em', marginTop: 6 }}>{fmt(atual)}</div>
        </div>

        <div className="adm-field">
          <label className="adm-label" htmlFor="prata-novo">Novo valor</label>
          <input id="prata-novo" className="adm-input" inputMode="decimal" value={String(valor).replace('.', ',')} onChange={(e) => { setValor(parseFloat(e.target.value.replace(',', '.')) || 0); setSalvo(false); }} />
          <span style={{ fontSize: 11.5, color: 'var(--tinta-3)' }}>Mudar aqui recalcula o custo de todas as peças e entra no histórico.</span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="erk-btn erk-btn--p"
            disabled={pendente || valor === atual}
            onClick={() => start(async () => { await salvarPrecoPrata(valor); setSalvo(true); router.refresh(); })}
          >
            {pendente ? 'Salvando…' : 'Atualizar valor'}
          </button>
          {salvo ? <span style={{ fontSize: 13, color: 'var(--ok)' }}>Valor atualizado.</span> : null}
        </div>
      </div>

      <div className="adm-card adm-card-pad">
        <div className="adm-stat__label" style={{ marginBottom: 12 }}>
          Histórico de alterações
        </div>
        <div style={{ display: 'grid' }}>
          {historico.map((h, i) => {
            const anterior = historico[i + 1];
            const diff = anterior ? h.valor - anterior.valor : 0;
            return (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 2px', borderBottom: '1px solid var(--linha)' }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
                  <b>{fmt(h.valor)}</b>
                  <em style={{ display: 'block', fontStyle: 'normal', fontSize: 11.5, color: 'var(--tinta-3)' }}>
                    {h.quando} · {h.quem}
                  </em>
                </span>
                {anterior ? (
                  <span style={{ fontSize: 12.5, color: diff >= 0 ? 'var(--ok)' : 'var(--acento)' }}>
                    {diff >= 0 ? '+' : ''}
                    {fmt(diff)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
