'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { ConfirmButton } from './ConfirmButton';
import { salvarCombo, alternarCombo, excluirCombo } from '@/lib/admin/vitrineActions';

type ComboLinha = {
  id: string;
  nome: string;
  preco: number;
  ativo: boolean;
  limite: number | null;
  itens: { id: string; nome: string; preco: number }[];
  somaIndividual: number;
  custo: number;
  foto: string;
};
type PecaOpcao = { id: string; nome: string; preco: number; custo: number };

export function VitrineCombos({ combos, pecas }: { combos: ComboLinha[]; pecas: PecaOpcao[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState(0);
  const [limite, setLimite] = useState<string>('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [itens, setItens] = useState<string[]>([]);
  const [, start] = useTransition();

  const escolhidas = pecas.filter((p) => itens.includes(p.id));
  const soma = escolhidas.reduce((a, p) => a + p.preco, 0);
  const custo = escolhidas.reduce((a, p) => a + p.custo, 0);
  const economia = soma - preco;
  const economiaPct = soma > 0 ? (economia / soma) * 100 : 0;
  const sobra = preco - custo;
  const sobraPct = preco > 0 ? (sobra / preco) * 100 : 0;

  function limpar() {
    setAberto(false);
    setNome('');
    setPreco(0);
    setLimite('');
    setInicio('');
    setFim('');
    setItens([]);
  }

  return (
    <div className="adm-card adm-card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div className="adm-stat__label">Combos</div>
        <button type="button" className="erk-btn erk-btn--s erk-btn--sm" onClick={() => setAberto((a) => !a)}>
          {aberto ? 'Fechar' : '+ Criar combo'}
        </button>
      </div>

      {aberto ? (
        <div style={{ border: '1px solid var(--linha-2)', borderRadius: 12, padding: 16, marginBottom: 18, display: 'grid', gap: 14 }}>
          <div className="adm-field">
            <label className="adm-label" htmlFor="combo-nome">Nome do combo</label>
            <input id="combo-nome" className="adm-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Conjunto casal cubano" />
          </div>

          <div className="adm-field">
            <span className="adm-label">Peças que compõem</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {pecas.map((p) => {
                const dentro = itens.includes(p.id);
                return (
                  <button key={p.id} type="button" className={'erk-chip' + (dentro ? ' is-on' : '')} onClick={() => setItens((i) => (dentro ? i.filter((x) => x !== p.id) : [...i, p.id]))}>
                    {p.nome}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="adm-grid-3">
            <div className="adm-field">
              <label className="adm-label" htmlFor="combo-preco">Preço do combo</label>
              <input id="combo-preco" className="adm-input adm-input--sm" inputMode="decimal" value={String(preco).replace('.', ',')} onChange={(e) => setPreco(parseFloat(e.target.value.replace(',', '.')) || 0)} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="combo-limite">Estoque limitado</label>
              <input id="combo-limite" className="adm-input adm-input--sm" inputMode="numeric" value={limite} onChange={(e) => setLimite(e.target.value)} placeholder="sem limite" />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="combo-inicio">Vigência</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input id="combo-inicio" className="adm-input adm-input--sm" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                <input className="adm-input adm-input--sm" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--fundo-3)', borderRadius: 10, padding: 14, display: 'grid', gap: 6, fontSize: 13.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tinta-2)' }}>Soma dos preços individuais</span>
              <span>{fmt(soma)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tinta-2)' }}>Custo somado</span>
              <span>{fmt(custo)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: economia > 0 ? 'var(--ok)' : 'var(--tinta-2)' }}>
              <span>O cliente economiza</span>
              <b>
                {fmt(Math.max(0, economia))} ({Math.max(0, economiaPct).toFixed(0)}%)
              </b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--linha)', paddingTop: 8 }}>
              <span style={{ color: 'var(--tinta-2)' }}>Sobra do combo</span>
              <b style={{ color: sobra >= 0 ? 'var(--ok)' : 'var(--acento)' }}>
                {fmt(sobra)} ({sobraPct.toFixed(1)}%)
              </b>
            </div>
            {sobra < 0 ? <p style={{ color: 'var(--acento)', fontSize: 12.5, margin: 0 }}>Nesse preço o combo sai no prejuízo.</p> : null}
          </div>

          <button
            type="button"
            className="erk-btn erk-btn--p erk-btn--sm"
            style={{ justifySelf: 'start' }}
            disabled={!nome.trim() || itens.length === 0}
            onClick={() =>
              start(async () => {
                await salvarCombo({ name: nome, priceOverride: preco, stockLimit: limite ? parseInt(limite, 10) : null, startAt: inicio || null, endAt: fim || null, itens });
                limpar();
                router.refresh();
              })
            }
          >
            Salvar combo
          </button>
        </div>
      ) : null}

      {combos.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--tinta-2)' }}>Nenhum combo ainda. Junte duas peças que saem bem e ofereça com desconto.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {combos.map((c) => {
            const economiaC = c.somaIndividual - c.preco;
            const sobraC = c.preco - c.custo;
            return (
              <div key={c.id} className="adm-drag-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {c.foto ? <img src={c.foto} alt="" width={44} height={44} style={{ borderRadius: 8, objectFit: 'cover', flex: 'none' }} /> : null}
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <b style={{ fontSize: 14 }}>{c.nome}</b>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--tinta-3)' }}>{c.itens.map((i) => i.nome).join(' + ')}</span>
                  <span style={{ display: 'block', fontSize: 12, color: economiaC > 0 ? 'var(--ok)' : 'var(--tinta-3)', marginTop: 2 }}>
                    o cliente economiza {fmt(Math.max(0, economiaC))} · sobra {fmt(sobraC)}
                  </span>
                </div>
                <b style={{ fontSize: 15 }}>{fmt(c.preco)}</b>
                <label className="adm-switch" title={c.ativo ? 'ativo' : 'pausado'}>
                  <input type="checkbox" checked={c.ativo} onChange={(e) => start(async () => { await alternarCombo(c.id, e.target.checked); router.refresh(); })} />
                  <span className="adm-switch-track" />
                </label>
                <ConfirmButton
                  label="Excluir"
                  title="Excluir este combo?"
                  description="O combo sai do site na hora. As peças continuam no catálogo, cada uma pelo seu preço."
                  confirmLabel="Excluir combo"
                  onConfirm={async () => {
                    await excluirCombo(c.id);
                    router.refresh();
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
