'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { definirDestaque, limparDestaque } from '@/lib/admin/vitrineActions';

type Opcao = { tipo: 'product' | 'combo'; id: string; nome: string; preco: number; foto: string };
type Dia = { iso: string; rotulo: string; alvoNome: string | null; alvoFoto: string | null };

export function VitrineDestaque({ dias, opcoes }: { dias: Dia[]; opcoes: Opcao[] }) {
  const router = useRouter();
  const [escolhendo, setEscolhendo] = useState<string | null>(null);
  const [, start] = useTransition();
  const hoje = dias[0];
  const ativo = opcoes.find((o) => o.nome === hoje?.alvoNome);

  function escolher(dataISO: string, opcao: Opcao) {
    start(async () => {
      await definirDestaque(dataISO, { tipo: opcao.tipo, id: opcao.id });
      setEscolhendo(null);
      router.refresh();
    });
  }

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-stat__label" style={{ marginBottom: 14 }}>
        Destaque do dia
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        {hoje?.alvoNome ? (
          <>
            {hoje.alvoFoto ? <img src={hoje.alvoFoto} alt="" width={96} height={96} style={{ borderRadius: 12, objectFit: 'cover' }} /> : null}
            <div style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--tinta-3)' }}>No ar agora, na home do site</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, margin: '6px 0 4px' }}>{hoje.alvoNome}</h2>
              {ativo ? <b style={{ fontSize: 16 }}>{fmt(ativo.preco)}</b> : null}
            </div>
          </>
        ) : (
          <p style={{ flex: 1, fontSize: 13.5, color: 'var(--tinta-2)', margin: 0 }}>Nenhum destaque no ar hoje. Escolha uma peça ou combo para aparecer na home.</p>
        )}
        <button type="button" className="erk-btn erk-btn--p erk-btn--sm" onClick={() => setEscolhendo(hoje.iso)}>
          Trocar destaque
        </button>
      </div>

      <div className="adm-stat__label" style={{ margin: '22px 0 10px' }}>
        Programação da semana
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
        {dias.map((d) => (
          <div key={d.iso} style={{ border: '1px solid var(--linha)', borderRadius: 12, padding: 12, background: 'var(--fundo-3)', display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 11.5, color: 'var(--tinta-3)', textTransform: 'capitalize' }}>{d.rotulo}</span>
            <span style={{ fontSize: 13, minHeight: 34, lineHeight: 1.3 }}>{d.alvoNome || <em style={{ color: 'var(--tinta-3)', fontStyle: 'normal' }}>vazio</em>}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={{ fontSize: 11.5, color: 'var(--tinta-2)', background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => setEscolhendo(d.iso)}>
                escolher
              </button>
              {d.alvoNome ? (
                <button
                  type="button"
                  style={{ fontSize: 11.5, color: 'var(--tinta-3)', background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                  onClick={() => start(async () => { await limparDestaque(d.iso); router.refresh(); })}
                >
                  limpar
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {escolhendo ? (
        <div className="adm-modal-veil" onClick={() => setEscolhendo(null)}>
          <div className="adm-modal" style={{ maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, margin: '0 0 14px' }}>Escolher destaque</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {opcoes.map((o) => (
                <button
                  key={o.tipo + o.id}
                  type="button"
                  onClick={() => escolher(escolhendo, o)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 10, border: '1px solid var(--linha)', background: 'var(--fundo-3)', cursor: 'pointer', textAlign: 'left' }}
                >
                  {o.foto ? <img src={o.foto} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover' }} /> : null}
                  <span style={{ flex: 1, fontSize: 13.5, color: 'var(--tinta)' }}>
                    {o.nome}
                    <em style={{ display: 'block', fontStyle: 'normal', fontSize: 11.5, color: 'var(--tinta-3)' }}>{o.tipo === 'combo' ? 'combo' : 'peça'}</em>
                  </span>
                  <b style={{ fontSize: 13.5, color: 'var(--tinta)' }}>{fmt(o.preco)}</b>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
