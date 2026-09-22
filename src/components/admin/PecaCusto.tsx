'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { salvarCustoPeca, salvarInsumosDaPeca, type CustoPeca } from '@/lib/admin/productActions';

type Insumo = { id: string; nome: string; unidade: string; custoUnit: number };
type Uso = { supplyId: string; quantity: number };

export function PecaCusto({ productId, grama, inicial, insumos, usos }: { productId: string; grama: number; inicial: CustoPeca; insumos: Insumo[]; usos: Uso[] }) {
  const router = useRouter();
  const [form, setForm] = useState<CustoPeca>(inicial);
  const [linhas, setLinhas] = useState<Uso[]>(usos.length ? usos : []);
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);

  const custoInsumos = linhas.reduce((a, l) => {
    const i = insumos.find((x) => x.id === l.supplyId);
    return a + (i ? i.custoUnit * l.quantity : 0);
  }, 0);

  const custoPrata = form.costSilverGrams * grama;
  const custoTotal = custoPrata + form.costLaborValue + form.costPackaging + form.costThirdParty + custoInsumos;
  const sobra = form.price - custoTotal;
  const pct = form.price > 0 ? (sobra / form.price) * 100 : 0;

  function campo<K extends keyof CustoPeca>(k: K, v: number) {
    setForm((f) => ({ ...f, [k]: v }));
    setSalvo(false);
  }
  const numero = (s: string) => parseFloat(s.replace(',', '.')) || 0;

  return (
    <div className="adm-grid-2" style={{ ['--adm-cols' as string]: '1.35fr .65fr', alignItems: 'start' }}>
      <div className="adm-card adm-card-pad" style={{ display: 'grid', gap: 18 }}>
        <div>
          <div className="adm-stat__label" style={{ marginBottom: 10 }}>
            Prata
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="adm-field" style={{ flex: '1 1 130px' }}>
              <label className="adm-label" htmlFor="gramas">Peso em gramas</label>
              <input id="gramas" className="adm-input adm-input--sm" inputMode="decimal" value={String(form.costSilverGrams).replace('.', ',')} onChange={(e) => campo('costSilverGrams', numero(e.target.value))} />
            </div>
            <div style={{ flex: '1 1 130px', fontSize: 13, color: 'var(--tinta-2)', paddingBottom: 10 }}>
              × {fmt(grama)} o grama = <b style={{ color: 'var(--tinta)' }}>{fmt(custoPrata)}</b>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--tinta-3)' }}>o valor do grama vem dos Ajustes</span>
            </div>
          </div>
        </div>

        <div>
          <div className="adm-stat__label" style={{ marginBottom: 10 }}>
            Mão de obra
          </div>
          <div className="adm-grid-2">
            <div className="adm-field">
              <label className="adm-label" htmlFor="horas">Horas</label>
              <input id="horas" className="adm-input adm-input--sm" inputMode="decimal" value={String(form.costLaborHours).replace('.', ',')} onChange={(e) => campo('costLaborHours', numero(e.target.value))} />
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="maodeobra">Valor fechado</label>
              <input id="maodeobra" className="adm-input adm-input--sm" inputMode="decimal" value={String(form.costLaborValue).replace('.', ',')} onChange={(e) => campo('costLaborValue', numero(e.target.value))} />
            </div>
          </div>
        </div>

        <div>
          <div className="adm-stat__label" style={{ marginBottom: 10 }}>
            Insumos (fecho, argola, polimento, banho)
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {linhas.map((l, i) => {
              const insumo = insumos.find((x) => x.id === l.supplyId);
              return (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    className="adm-select adm-select--sm"
                    style={{ flex: 1 }}
                    value={l.supplyId}
                    onChange={(e) => setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, supplyId: e.target.value } : x)))}
                  >
                    <option value="">escolha o insumo…</option>
                    {insumos.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nome}
                      </option>
                    ))}
                  </select>
                  <input
                    className="adm-input adm-input--sm"
                    style={{ width: 90 }}
                    inputMode="decimal"
                    value={String(l.quantity).replace('.', ',')}
                    onChange={(e) => setLinhas((ls) => ls.map((x, j) => (j === i ? { ...x, quantity: numero(e.target.value) } : x)))}
                  />
                  <span style={{ width: 62, fontSize: 12, color: 'var(--tinta-3)' }}>{insumo?.unidade || ''}</span>
                  <button type="button" aria-label="Remover linha" style={{ background: 'none', border: 0, color: 'var(--tinta-3)', cursor: 'pointer' }} onClick={() => setLinhas((ls) => ls.filter((_, j) => j !== i))}>
                    <Icon name="adm_lixeira" size={15} />
                  </button>
                </div>
              );
            })}
            <button type="button" className="erk-btn erk-btn--s erk-btn--sm" style={{ justifySelf: 'start' }} onClick={() => setLinhas((ls) => [...ls, { supplyId: '', quantity: 0 }])}>
              + Adicionar insumo
            </button>
            <p style={{ fontSize: 11.5, color: 'var(--tinta-3)', margin: 0 }}>A quantidade informada baixa do estoque de insumos quando a peça é produzida.</p>
          </div>
        </div>

        <div className="adm-grid-2">
          <div className="adm-field">
            <label className="adm-label" htmlFor="embalagem">Embalagem</label>
            <input id="embalagem" className="adm-input adm-input--sm" inputMode="decimal" value={String(form.costPackaging).replace('.', ',')} onChange={(e) => campo('costPackaging', numero(e.target.value))} />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="terceiros">Serviços de terceiros</label>
            <input id="terceiros" className="adm-input adm-input--sm" inputMode="decimal" value={String(form.costThirdParty).replace('.', ',')} onChange={(e) => campo('costThirdParty', numero(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="adm-card adm-card-pad" style={{ position: 'sticky', top: 84, display: 'grid', gap: 14 }}>
        <div>
          <div className="adm-stat__label">Custo total</div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.01em' }}>{fmt(custoTotal)}</div>
        </div>

        <div className="adm-field">
          <label className="adm-label" htmlFor="venda">Preço de venda</label>
          <input id="venda" className="adm-input" inputMode="decimal" value={String(form.price).replace('.', ',')} onChange={(e) => campo('price', numero(e.target.value))} />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[2, 2.5, 3].map((m) => (
            <button key={m} type="button" className="erk-chip" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => campo('price', Math.round(custoTotal * m))}>
              {String(m).replace('.', ',')}× do custo
            </button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--linha)', paddingTop: 14 }}>
          <div className="adm-stat__label">Sobra</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: sobra >= 0 ? 'var(--ok)' : 'var(--acento)' }}>
            {fmt(sobra)} <span style={{ fontSize: 16 }}>({pct.toFixed(1)}%)</span>
          </div>
          {pct < 20 ? <p style={{ fontSize: 12, color: 'var(--acento)', marginTop: 6 }}>Margem apertada. Confira o custo ou suba o preço.</p> : null}
        </div>

        <button
          type="button"
          className="erk-btn erk-btn--p"
          disabled={pendente}
          onClick={() =>
            start(async () => {
              await salvarCustoPeca(productId, form);
              await salvarInsumosDaPeca(productId, linhas);
              setSalvo(true);
              router.refresh();
            })
          }
        >
          {pendente ? 'Salvando…' : 'Salvar custo e preço'}
        </button>
        {salvo ? <span style={{ fontSize: 12.5, color: 'var(--ok)' }}>Salvo.</span> : null}
      </div>
    </div>
  );
}
