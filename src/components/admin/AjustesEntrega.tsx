'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { salvarEntrega } from '@/lib/admin/settingsActions';

type Zona = { nome: string; valor: number; prazo: string };

export function AjustesEntrega({ zonas }: { zonas: Zona[] }) {
  const router = useRouter();
  const [linhas, setLinhas] = useState<Zona[]>(zonas.length ? zonas : [{ nome: '', valor: 0, prazo: '' }]);
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);

  function mudar(i: number, campo: keyof Zona, valor: string) {
    setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, [campo]: campo === 'valor' ? parseFloat(valor.replace(',', '.')) || 0 : valor } : x)));
    setSalvo(false);
  }

  return (
    <div className="adm-card adm-card-pad" style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
      <div className="adm-stat__label">Áreas de entrega e frete</div>

      <div style={{ display: 'grid', gap: 8 }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="adm-input adm-input--sm" style={{ flex: '2 1 160px' }} value={l.nome} onChange={(e) => mudar(i, 'nome', e.target.value)} placeholder="cidade ou região" />
            <input className="adm-input adm-input--sm" style={{ flex: '1 1 100px' }} inputMode="decimal" value={String(l.valor).replace('.', ',')} onChange={(e) => mudar(i, 'valor', e.target.value)} placeholder="valor" />
            <input className="adm-input adm-input--sm" style={{ flex: '2 1 150px' }} value={l.prazo} onChange={(e) => mudar(i, 'prazo', e.target.value)} placeholder="prazo (ex.: no mesmo dia)" />
            <button type="button" style={{ background: 'none', border: 0, color: 'var(--tinta-3)', cursor: 'pointer' }} aria-label="Remover área" onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}>
              <Icon name="adm_lixeira" size={15} />
            </button>
          </div>
        ))}
        <button type="button" className="erk-btn erk-btn--s erk-btn--sm" style={{ justifySelf: 'start' }} onClick={() => setLinhas((ls) => [...ls, { nome: '', valor: 0, prazo: '' }])}>
          + Adicionar área
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          className="erk-btn erk-btn--p"
          disabled={pendente}
          onClick={() => start(async () => { await salvarEntrega(linhas.filter((l) => l.nome.trim())); setSalvo(true); router.refresh(); })}
        >
          {pendente ? 'Salvando…' : 'Salvar'}
        </button>
        {salvo ? <span style={{ fontSize: 13, color: 'var(--ok)' }}>Áreas salvas.</span> : null}
      </div>
    </div>
  );
}
