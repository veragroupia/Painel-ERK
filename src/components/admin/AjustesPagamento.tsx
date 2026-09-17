'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { salvarPagamentos } from '@/lib/admin/settingsActions';

type Forma = { nome: string; ativo: boolean; taxa: number };

export function AjustesPagamento({ formas }: { formas: Forma[] }) {
  const router = useRouter();
  const [linhas, setLinhas] = useState<Forma[]>(
    formas.length
      ? formas
      : [
          { nome: 'Pix', ativo: true, taxa: 0 },
          { nome: 'Cartão de crédito', ativo: true, taxa: 4.2 },
        ]
  );
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);

  return (
    <div className="adm-card adm-card-pad" style={{ display: 'grid', gap: 14, maxWidth: 640 }}>
      <div className="adm-stat__label">Formas de pagamento aceitas</div>
      <p style={{ fontSize: 12, color: 'var(--tinta-3)', margin: 0 }}>A taxa é o quanto a maquininha ou o gateway cobra. Ela entra na conta do lucro.</p>

      <div style={{ display: 'grid', gap: 8 }}>
        {linhas.map((l, i) => (
          <div key={i} className="adm-drag-row">
            <input
              className="adm-input adm-input--sm"
              style={{ flex: 1 }}
              value={l.nome}
              onChange={(e) => { setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x))); setSalvo(false); }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
              <input
                className="adm-input adm-input--sm"
                style={{ width: 76, textAlign: 'right' }}
                inputMode="decimal"
                value={String(l.taxa).replace('.', ',')}
                onChange={(e) => { setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, taxa: parseFloat(e.target.value.replace(',', '.')) || 0 } : x))); setSalvo(false); }}
              />
              <span style={{ fontSize: 12.5, color: 'var(--tinta-3)' }}>%</span>
            </div>
            <label className="adm-switch" title={l.ativo ? 'aceita' : 'desligada'}>
              <input type="checkbox" checked={l.ativo} onChange={(e) => { setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, ativo: e.target.checked } : x))); setSalvo(false); }} />
              <span className="adm-switch-track" />
            </label>
          </div>
        ))}
        <button type="button" className="erk-btn erk-btn--s erk-btn--sm" style={{ justifySelf: 'start' }} onClick={() => setLinhas((ls) => [...ls, { nome: '', ativo: true, taxa: 0 }])}>
          + Adicionar forma
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          className="erk-btn erk-btn--p"
          disabled={pendente}
          onClick={() => start(async () => { await salvarPagamentos(linhas.filter((l) => l.nome.trim())); setSalvo(true); router.refresh(); })}
        >
          {pendente ? 'Salvando…' : 'Salvar'}
        </button>
        {salvo ? <span style={{ fontSize: 13, color: 'var(--ok)' }}>Formas salvas.</span> : null}
      </div>
    </div>
  );
}
