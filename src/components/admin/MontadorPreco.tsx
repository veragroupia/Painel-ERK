'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { salvarPrecoMontador } from '@/lib/admin/montadorActions';

export function MontadorPreco({ grama, laborMultiplier, gravacaoSurcharge }: { grama: number; laborMultiplier: number; gravacaoSurcharge: number }) {
  const router = useRouter();
  const [g, setG] = useState(grama);
  const [mult, setMult] = useState(laborMultiplier);
  const [grav, setGrav] = useState(gravacaoSurcharge);
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);
  const numero = (s: string) => parseFloat(s.replace(',', '.')) || 0;

  return (
    <div className="adm-card adm-card-pad" style={{ display: 'grid', gap: 14 }}>
      <div className="adm-stat__label">Preço</div>

      <div className="adm-field">
        <label className="adm-label" htmlFor="mp-grama">Valor do grama da prata</label>
        <input id="mp-grama" className="adm-input adm-input--sm" inputMode="decimal" value={String(g).replace('.', ',')} onChange={(e) => { setG(numero(e.target.value)); setSalvo(false); }} />
        <span style={{ fontSize: 11.5, color: 'var(--tinta-3)' }}>Mudar aqui registra no histórico dos Ajustes.</span>
      </div>

      <div className="adm-field">
        <label className="adm-label" htmlFor="mp-mult">Multiplicador de mão de obra</label>
        <input id="mp-mult" className="adm-input adm-input--sm" inputMode="decimal" value={String(mult).replace('.', ',')} onChange={(e) => { setMult(numero(e.target.value)); setSalvo(false); }} />
      </div>

      <div className="adm-field">
        <label className="adm-label" htmlFor="mp-grav">Acréscimo por gravação</label>
        <input id="mp-grav" className="adm-input adm-input--sm" inputMode="decimal" value={String(grav).replace('.', ',')} onChange={(e) => { setGrav(numero(e.target.value)); setSalvo(false); }} />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          className="erk-btn erk-btn--p erk-btn--sm"
          disabled={pendente}
          onClick={() =>
            start(async () => {
              await salvarPrecoMontador({ grama: g, laborMultiplier: mult, gravacaoSurcharge: grav });
              setSalvo(true);
              router.refresh();
            })
          }
        >
          {pendente ? 'Salvando…' : 'Salvar preço'}
        </button>
        {salvo ? <span style={{ fontSize: 12.5, color: 'var(--ok)' }}>Salvo.</span> : null}
      </div>
    </div>
  );
}
