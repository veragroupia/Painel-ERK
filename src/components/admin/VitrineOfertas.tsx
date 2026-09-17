'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { ConfirmButton } from './ConfirmButton';
import { salvarOferta, alternarOferta, excluirOferta } from '@/lib/admin/vitrineActions';

type OfertaLinha = { id: string; nome: string; tipo: string; valor: number; productId: string | null; categoryId: string | null; cupom: string | null; ativa: boolean; vendidos: number };

export function VitrineOfertas({ ofertas, pecas, categorias }: { ofertas: OfertaLinha[]; pecas: { id: string; nome: string }[]; categorias: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('percent');
  const [valor, setValor] = useState(10);
  const [alvo, setAlvo] = useState('');
  const [cupom, setCupom] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [, start] = useTransition();

  function alvoTexto(o: OfertaLinha) {
    if (o.productId) return pecas.find((p) => p.id === o.productId)?.nome || 'peça';
    if (o.categoryId) return `categoria ${categorias.find((c) => c.id === o.categoryId)?.nome || ''}`;
    return 'a loja toda';
  }

  return (
    <div className="adm-card adm-card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div className="adm-stat__label">Ofertas</div>
        <button type="button" className="erk-btn erk-btn--s erk-btn--sm" onClick={() => setAberto((a) => !a)}>
          {aberto ? 'Fechar' : '+ Criar oferta'}
        </button>
      </div>

      {aberto ? (
        <div style={{ border: '1px solid var(--linha-2)', borderRadius: 12, padding: 16, marginBottom: 18, display: 'grid', gap: 14 }}>
          <div className="adm-grid-2">
            <div className="adm-field">
              <label className="adm-label" htmlFor="of-nome">Nome da oferta</label>
              <input id="of-nome" className="adm-input adm-input--sm" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Correntes com 10% off" />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="of-alvo">Aplicar em</label>
              <select id="of-alvo" className="adm-select adm-select--sm" value={alvo} onChange={(e) => setAlvo(e.target.value)}>
                <option value="">a loja toda</option>
                <optgroup label="Categoria">
                  {categorias.map((c) => (
                    <option key={c.id} value={`cat:${c.id}`}>{c.nome}</option>
                  ))}
                </optgroup>
                <optgroup label="Peça">
                  {pecas.map((p) => (
                    <option key={p.id} value={`prod:${p.id}`}>{p.nome}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="adm-grid-3">
            <div className="adm-field">
              <label className="adm-label" htmlFor="of-tipo">Desconto</label>
              <select id="of-tipo" className="adm-select adm-select--sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="percent">Em porcentagem</option>
                <option value="amount">Em reais</option>
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="of-valor">Valor</label>
              <input id="of-valor" className="adm-input adm-input--sm" inputMode="decimal" value={String(valor).replace('.', ',')} onChange={(e) => setValor(parseFloat(e.target.value.replace(',', '.')) || 0)} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="of-cupom">Cupom (opcional)</label>
              <input id="of-cupom" className="adm-input adm-input--sm" value={cupom} onChange={(e) => setCupom(e.target.value.toUpperCase())} placeholder="ERK10" />
            </div>
          </div>

          <div className="adm-grid-2">
            <div className="adm-field">
              <label className="adm-label" htmlFor="of-inicio">Começa</label>
              <input id="of-inicio" className="adm-input adm-input--sm" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="of-fim">Termina</label>
              <input id="of-fim" className="adm-input adm-input--sm" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>

          <button
            type="button"
            className="erk-btn erk-btn--p erk-btn--sm"
            style={{ justifySelf: 'start' }}
            disabled={!nome.trim()}
            onClick={() =>
              start(async () => {
                await salvarOferta({
                  name: nome,
                  discountType: tipo,
                  discountValue: valor,
                  productId: alvo.startsWith('prod:') ? alvo.slice(5) : null,
                  categoryId: alvo.startsWith('cat:') ? alvo.slice(4) : null,
                  coupon: cupom || null,
                  startAt: inicio || null,
                  endAt: fim || null,
                });
                setAberto(false);
                setNome('');
                setCupom('');
                router.refresh();
              })
            }
          >
            Salvar oferta
          </button>
        </div>
      ) : null}

      {ofertas.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--tinta-2)' }}>Nenhuma oferta ativa. Crie uma quando quiser girar estoque parado.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {ofertas.map((o) => (
            <div key={o.id} className="adm-drag-row" style={{ flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <b style={{ fontSize: 14 }}>{o.nome}</b>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--tinta-3)' }}>
                  {o.tipo === 'percent' ? `${o.valor}% off` : `${fmt(o.valor)} off`} · {alvoTexto(o)}
                  {o.cupom ? ` · cupom ${o.cupom}` : ''}
                </span>
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--tinta-2)' }}>{o.vendidos} vendas</span>
              <label className="adm-switch" title={o.ativa ? 'ativa' : 'pausada'}>
                <input type="checkbox" checked={o.ativa} onChange={(e) => start(async () => { await alternarOferta(o.id, e.target.checked); router.refresh(); })} />
                <span className="adm-switch-track" />
              </label>
              <ConfirmButton
                label="Excluir"
                title="Excluir esta oferta?"
                description="O desconto para de valer na hora e o cupom, se houver, deixa de funcionar. As vendas já feitas continuam registradas."
                confirmLabel="Excluir oferta"
                onConfirm={async () => {
                  await excluirOferta(o.id);
                  router.refresh();
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
