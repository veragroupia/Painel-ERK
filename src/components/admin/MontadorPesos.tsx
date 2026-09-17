'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { salvarPeso } from '@/lib/admin/montadorActions';

type Linha = { id: string; elo: string; espessura: number; medida: number; gramas: number };

export function MontadorPesos({ linhas }: { linhas: Linha[] }) {
  const router = useRouter();
  const elos = [...new Set(linhas.map((l) => l.elo))];
  const [elo, setElo] = useState(elos[0] || '');
  const [editando, setEditando] = useState<string | null>(null);
  const [valor, setValor] = useState('');
  const [, start] = useTransition();

  const doElo = linhas.filter((l) => l.elo === elo);
  const espessuras = [...new Set(doElo.map((l) => l.espessura))].sort((a, b) => a - b);
  const medidas = [...new Set(doElo.map((l) => l.medida))].sort((a, b) => a - b);

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-stat__label" style={{ marginBottom: 4 }}>
        Tabela de peso
      </div>
      <p style={{ fontSize: 12, color: 'var(--tinta-3)', margin: '0 0 12px' }}>Gramas de prata por elo, espessura e medida. É o que define o preço da peça sob encomenda.</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {elos.map((e) => (
          <button key={e} type="button" className={'erk-chip' + (elo === e ? ' is-on' : '')} style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setElo(e)}>
            {e}
          </button>
        ))}
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table" style={{ minWidth: 380 }}>
          <thead>
            <tr>
              <th>mm \ medida</th>
              {medidas.map((m) => (
                <th key={m}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {espessuras.map((esp) => (
              <tr key={esp}>
                <td style={{ fontWeight: 600 }}>{String(esp).replace('.', ',')}</td>
                {medidas.map((m) => {
                  const linha = doElo.find((l) => l.espessura === esp && l.medida === m);
                  const chave = `${esp}-${m}`;
                  return (
                    <td key={m} style={{ padding: 6 }}>
                      {editando === chave ? (
                        <input
                          autoFocus
                          className="adm-input adm-input--sm"
                          style={{ width: 72, height: 32, padding: '0 8px' }}
                          value={valor}
                          onChange={(e) => setValor(e.target.value)}
                          onBlur={() => {
                            const g = parseFloat(valor.replace(',', '.'));
                            setEditando(null);
                            if (Number.isFinite(g)) {
                              start(async () => {
                                await salvarPeso(elo, esp, m, g);
                                router.refresh();
                              });
                            }
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        />
                      ) : (
                        <button
                          type="button"
                          style={{ background: 'none', border: 0, color: 'var(--tinta)', fontSize: 13, cursor: 'pointer', padding: '6px 4px' }}
                          onClick={() => {
                            setEditando(chave);
                            setValor(String(linha?.gramas ?? 0).replace('.', ','));
                          }}
                        >
                          {linha ? String(linha.gramas).replace('.', ',') : '—'}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--tinta-3)', marginTop: 8 }}>Clique em um valor para editar. Valores em gramas.</p>
    </div>
  );
}
