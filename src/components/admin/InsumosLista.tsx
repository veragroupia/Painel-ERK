'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { AdminEmptyState } from './AdminEmptyState';
import { salvarInsumo, registrarCompra, registrarConsumo } from '@/lib/admin/supplyActions';

type Insumo = { id: string; nome: string; tipo: string; unidade: string; estoque: number; custoUnit: number; minimo: number };
type Consumo = { id: string; insumo: string; quantidade: number; unidade: string; onde: string; quando: string; custo: number };

const TIPOS = [
  { id: 'massa_polir', nome: 'Massa de polir' },
  { id: 'flanela', nome: 'Flanela' },
  { id: 'liquido_limpeza', nome: 'Líquido de limpeza' },
  { id: 'escova', nome: 'Escova' },
  { id: 'caixinha', nome: 'Caixinha' },
  { id: 'saquinho', nome: 'Saquinho' },
  { id: 'cartao', nome: 'Cartão' },
  { id: 'outro', nome: 'Outro' },
];

export function InsumosLista({ insumos, historico, periodo }: { insumos: Insumo[]; historico: Consumo[]; periodo: string }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [compraDe, setCompraDe] = useState<Insumo | null>(null);
  const [consumoDe, setConsumoDe] = useState<Insumo | null>(null);
  const [novo, setNovo] = useState(false);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="adm-card adm-card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <div className="adm-stat__label">Estoque de insumos</div>
          <button type="button" className="erk-btn erk-btn--s erk-btn--sm" onClick={() => setNovo((n) => !n)}>
            {novo ? 'Fechar' : '+ Novo insumo'}
          </button>
        </div>

        {novo ? <FormInsumo aoSalvar={() => { setNovo(false); router.refresh(); }} /> : null}

        {insumos.length === 0 ? (
          <AdminEmptyState icon="adm_insumos" title="Nenhum insumo cadastrado ainda." action={<p style={{ fontSize: 13.5 }}>Comece pelo que você mais gasta: a massa de polir.</p>} />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Tipo</th>
                  <th>Em estoque</th>
                  <th>Custo por unidade</th>
                  <th style={{ width: 160 }}>Quanto resta</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => {
                  const acabando = i.estoque <= i.minimo;
                  const pct = i.minimo > 0 ? Math.min(100, (i.estoque / (i.minimo * 3)) * 100) : 100;
                  return (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 600, color: acabando ? 'var(--acento)' : undefined }}>{i.nome}</td>
                      <td style={{ color: 'var(--tinta-2)' }}>{TIPOS.find((t) => t.id === i.tipo)?.nome || i.tipo}</td>
                      <td style={{ color: acabando ? 'var(--acento)' : undefined }}>
                        {i.estoque} {i.unidade}
                      </td>
                      <td>{fmt(i.custoUnit)}</td>
                      <td>
                        <span className="adm-meter" style={{ marginTop: 0 }}>
                          <span style={{ width: pct + '%', background: acabando ? 'var(--acento)' : 'var(--ok)' }} />
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="erk-btn erk-btn--s erk-btn--sm" style={{ marginRight: 6 }} onClick={() => setCompraDe(i)}>
                          Comprei
                        </button>
                        <button type="button" className="erk-btn erk-btn--s erk-btn--sm" onClick={() => setConsumoDe(i)}>
                          Usei
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="adm-card adm-card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <div className="adm-stat__label">Histórico de consumo</div>
          <select
            className="adm-select adm-select--sm"
            style={{ width: 'auto' }}
            value={periodo}
            onChange={(e) => router.push(`/insumos?periodo=${e.target.value}`)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>

        {historico.length === 0 ? (
          <p style={{ fontSize: 13.5, color: 'var(--tinta-2)' }}>Nada consumido nesse período.</p>
        ) : (
          <div className="adm-lista">
            {historico.map((h) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 2px', borderBottom: '1px solid var(--linha)', fontSize: 13.5 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b>{h.insumo}</b>
                  <em style={{ display: 'block', fontStyle: 'normal', fontSize: 11.5, color: 'var(--tinta-3)' }}>
                    {h.onde} · {h.quando}
                  </em>
                </span>
                <span style={{ color: 'var(--tinta-2)' }}>
                  {h.quantidade} {h.unidade}
                </span>
                <b style={{ width: 80, textAlign: 'right' }}>{fmt(h.custo)}</b>
              </div>
            ))}
          </div>
        )}
      </div>

      {compraDe ? <ModalCompra insumo={compraDe} aoFechar={() => setCompraDe(null)} /> : null}
      {consumoDe ? <ModalConsumo insumo={consumoDe} aoFechar={() => setConsumoDe(null)} /> : null}
    </div>
  );
}

function FormInsumo({ aoSalvar }: { aoSalvar: () => void }) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('massa_polir');
  const [unidade, setUnidade] = useState('g');
  const [custo, setCusto] = useState(0);
  const [minimo, setMinimo] = useState(0);
  const [estoque, setEstoque] = useState(0);
  const [, start] = useTransition();

  return (
    <div style={{ border: '1px solid var(--linha-2)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'grid', gap: 12 }}>
      <div className="adm-grid-3">
        <div className="adm-field">
          <label className="adm-label" htmlFor="in-nome">Nome</label>
          <input id="in-nome" className="adm-input adm-input--sm" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="in-tipo">Tipo</label>
          <select id="in-tipo" className="adm-select adm-select--sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="in-unidade">Unidade</label>
          <select id="in-unidade" className="adm-select adm-select--sm" value={unidade} onChange={(e) => setUnidade(e.target.value)}>
            <option value="g">gramas</option>
            <option value="ml">ml</option>
            <option value="unidade">unidade</option>
          </select>
        </div>
      </div>
      <div className="adm-grid-3">
        <div className="adm-field">
          <label className="adm-label" htmlFor="in-estoque">Em estoque agora</label>
          <input id="in-estoque" className="adm-input adm-input--sm" inputMode="decimal" value={String(estoque).replace('.', ',')} onChange={(e) => setEstoque(parseFloat(e.target.value.replace(',', '.')) || 0)} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="in-custo">Custo por unidade</label>
          <input id="in-custo" className="adm-input adm-input--sm" inputMode="decimal" value={String(custo).replace('.', ',')} onChange={(e) => setCusto(parseFloat(e.target.value.replace(',', '.')) || 0)} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="in-min">Avisar quando restar</label>
          <input id="in-min" className="adm-input adm-input--sm" inputMode="decimal" value={String(minimo).replace('.', ',')} onChange={(e) => setMinimo(parseFloat(e.target.value.replace(',', '.')) || 0)} />
        </div>
      </div>
      <button
        type="button"
        className="erk-btn erk-btn--p erk-btn--sm"
        style={{ justifySelf: 'start' }}
        disabled={!nome.trim()}
        onClick={() => start(async () => { await salvarInsumo({ name: nome, type: tipo, unit: unidade, unitCost: custo, lowStockThreshold: minimo, stockQty: estoque }); aoSalvar(); })}
      >
        Salvar insumo
      </button>
    </div>
  );
}

function ModalCompra({ insumo, aoFechar }: { insumo: Insumo; aoFechar: () => void }) {
  const router = useRouter();
  const [fornecedor, setFornecedor] = useState('');
  const [quantidade, setQuantidade] = useState(0);
  const [pago, setPago] = useState(0);
  const [data, setData] = useState('');
  const [pendente, start] = useTransition();

  const novoCusto = insumo.estoque + quantidade > 0 ? (insumo.estoque * insumo.custoUnit + pago) / (insumo.estoque + quantidade) : insumo.custoUnit;

  return (
    <div className="adm-modal-veil" onClick={aoFechar}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, margin: 0 }}>Registrar compra · {insumo.nome}</h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <div className="adm-field">
            <label className="adm-label" htmlFor="c-forn">Fornecedor</label>
            <input id="c-forn" className="adm-input adm-input--sm" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
          </div>
          <div className="adm-grid-2">
            <div className="adm-field">
              <label className="adm-label" htmlFor="c-qtd">Quantidade ({insumo.unidade})</label>
              <input id="c-qtd" className="adm-input adm-input--sm" inputMode="decimal" value={String(quantidade).replace('.', ',')} onChange={(e) => setQuantidade(parseFloat(e.target.value.replace(',', '.')) || 0)} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="c-pago">Valor total pago</label>
              <input id="c-pago" className="adm-input adm-input--sm" inputMode="decimal" value={String(pago).replace('.', ',')} onChange={(e) => setPago(parseFloat(e.target.value.replace(',', '.')) || 0)} />
            </div>
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="c-data">Data</label>
            <input id="c-data" className="adm-input adm-input--sm" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--tinta-2)', margin: 0 }}>
            Novo estoque: <b>{insumo.estoque + quantidade} {insumo.unidade}</b> · custo médio recalculado para <b>{fmt(novoCusto)}</b> por {insumo.unidade}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="erk-btn erk-btn--s erk-btn--sm" onClick={aoFechar}>Voltar</button>
          <button
            type="button"
            className="erk-btn erk-btn--p erk-btn--sm"
            disabled={pendente || quantidade <= 0}
            onClick={() => start(async () => { await registrarCompra({ supplyId: insumo.id, supplier: fornecedor, quantity: quantidade, totalPaid: pago, dateISO: data || null }); aoFechar(); router.refresh(); })}
          >
            {pendente ? 'Salvando…' : 'Registrar compra'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalConsumo({ insumo, aoFechar }: { insumo: Insumo; aoFechar: () => void }) {
  const router = useRouter();
  const [quantidade, setQuantidade] = useState(0);
  const [onde, setOnde] = useState('');
  const [pendente, start] = useTransition();

  return (
    <div className="adm-modal-veil" onClick={aoFechar}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, margin: 0 }}>Baixar do estoque · {insumo.nome}</h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <div className="adm-field">
            <label className="adm-label" htmlFor="u-qtd">Quanto usou ({insumo.unidade})</label>
            <input id="u-qtd" className="adm-input adm-input--sm" inputMode="decimal" value={String(quantidade).replace('.', ',')} onChange={(e) => setQuantidade(parseFloat(e.target.value.replace(',', '.')) || 0)} />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="u-onde">Em qual peça ou pedido</label>
            <input id="u-onde" className="adm-input adm-input--sm" value={onde} onChange={(e) => setOnde(e.target.value)} placeholder="ex.: Corrente cubana" />
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--tinta-2)', margin: 0 }}>
            Sobra depois: <b>{Math.max(0, insumo.estoque - quantidade)} {insumo.unidade}</b> · custo desse uso: <b>{fmt(quantidade * insumo.custoUnit)}</b>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="erk-btn erk-btn--s erk-btn--sm" onClick={aoFechar}>Voltar</button>
          <button
            type="button"
            className="erk-btn erk-btn--p erk-btn--sm"
            disabled={pendente || quantidade <= 0}
            onClick={() => start(async () => { await registrarConsumo({ supplyId: insumo.id, quantity: quantidade, productName: onde || null, orderId: null, note: null }); aoFechar(); router.refresh(); })}
          >
            {pendente ? 'Salvando…' : 'Baixar do estoque'}
          </button>
        </div>
      </div>
    </div>
  );
}
