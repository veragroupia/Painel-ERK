'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { salvarDadosLoja } from '@/lib/admin/settingsActions';

export function AjustesLoja({ nome, horarios }: { nome: string; horarios: { dia: string; horario: string }[] }) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(nome);
  const [linhas, setLinhas] = useState(horarios.length ? horarios : [{ dia: 'Segunda a sexta', horario: '9h às 18h' }]);
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);

  return (
    <div className="adm-card adm-card-pad" style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
      <div className="adm-field">
        <label className="adm-label" htmlFor="loja-nome">Nome da loja</label>
        <input id="loja-nome" className="adm-input" value={storeName} onChange={(e) => { setStoreName(e.target.value); setSalvo(false); }} />
      </div>

      <div className="adm-field">
        <span className="adm-label">Horários</span>
        <div style={{ display: 'grid', gap: 8 }}>
          {linhas.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input
                className="adm-input adm-input--sm"
                style={{ flex: '1 1 160px' }}
                value={l.dia}
                onChange={(e) => { setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, dia: e.target.value } : x))); setSalvo(false); }}
              />
              <input
                className="adm-input adm-input--sm"
                style={{ flex: '1 1 130px' }}
                value={l.horario}
                onChange={(e) => { setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, horario: e.target.value } : x))); setSalvo(false); }}
              />
              <button type="button" className="adm-icone-btn" aria-label="Remover horário" onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}>
                <Icon name="adm_lixeira" size={15} />
              </button>
            </div>
          ))}
          <button type="button" className="erk-btn erk-btn--s erk-btn--sm" style={{ justifySelf: 'start' }} onClick={() => setLinhas((ls) => [...ls, { dia: '', horario: '' }])}>
            + Adicionar horário
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          className="erk-btn erk-btn--p"
          disabled={pendente}
          onClick={() => start(async () => { await salvarDadosLoja({ storeName, hours: linhas.filter((l) => l.dia.trim()) }); setSalvo(true); router.refresh(); })}
        >
          {pendente ? 'Salvando…' : 'Salvar'}
        </button>
        {salvo ? <span style={{ fontSize: 13, color: 'var(--ok)' }}>Dados salvos.</span> : null}
      </div>
    </div>
  );
}
