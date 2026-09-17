'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmButton } from './ConfirmButton';
import { salvarDadosPeca, excluirPeca, type DadosPeca } from '@/lib/admin/productActions';

const ETIQUETAS = ['Novo', 'Mais vendida', 'Presente', 'Sob encomenda'];

export function PecaDados({ categorias, inicial }: { categorias: { id: string; nome: string }[]; inicial: DadosPeca | null }) {
  const router = useRouter();
  const [form, setForm] = useState<DadosPeca>(
    inicial || { name: '', spec: '', description: '', categoryId: categorias[0]?.id || '', price: 0, oldPrice: null, tags: [], stock: 0, status: 'draft' }
  );
  const [pendente, start] = useTransition();
  const [salvo, setSalvo] = useState(false);

  function campo<K extends keyof DadosPeca>(k: K, v: DadosPeca[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setSalvo(false);
  }

  return (
    <div className="adm-card adm-card-pad" style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <div className="adm-field">
        <label className="adm-label" htmlFor="nome">Nome</label>
        <input id="nome" className="adm-input" value={form.name} onChange={(e) => campo('name', e.target.value)} placeholder="ex.: Corrente cubana" />
      </div>

      <div className="adm-grid-2">
        <div className="adm-field">
          <label className="adm-label" htmlFor="cat">Categoria</label>
          <select id="cat" className="adm-select" value={form.categoryId} onChange={(e) => campo('categoryId', e.target.value)}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="spec">Especificação curta</label>
          <input id="spec" className="adm-input" value={form.spec} onChange={(e) => campo('spec', e.target.value)} placeholder="ex.: elo cubano · 60 cm" />
        </div>
      </div>

      <div className="adm-field">
        <label className="adm-label" htmlFor="desc">Descrição</label>
        <textarea id="desc" className="adm-textarea" value={form.description} onChange={(e) => campo('description', e.target.value)} />
      </div>

      <div className="adm-field">
        <span className="adm-label">Etiquetas</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ETIQUETAS.map((t) => {
            const ativa = form.tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                className={'erk-chip' + (ativa ? ' is-on' : '')}
                onClick={() => campo('tags', ativa ? form.tags.filter((x) => x !== t) : [...form.tags, t])}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="adm-grid-3">
        <div className="adm-field">
          <label className="adm-label" htmlFor="preco">Preço de venda</label>
          <input id="preco" className="adm-input" inputMode="decimal" value={String(form.price).replace('.', ',')} onChange={(e) => campo('price', parseFloat(e.target.value.replace(',', '.')) || 0)} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="estoque">Em estoque</label>
          <input id="estoque" className="adm-input" inputMode="numeric" value={form.stock} onChange={(e) => campo('stock', parseInt(e.target.value, 10) || 0)} />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="sit">Situação</label>
          <select id="sit" className="adm-select" value={form.status} onChange={(e) => campo('status', e.target.value)}>
            <option value="published">Publicada</option>
            <option value="draft">Rascunho</option>
            <option value="soldout">Esgotada</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="erk-btn erk-btn--p"
          disabled={pendente || !form.name.trim()}
          onClick={() =>
            start(async () => {
              await salvarDadosPeca(form);
              setSalvo(true);
              router.refresh();
            })
          }
        >
          {pendente ? 'Salvando…' : inicial ? 'Salvar' : 'Criar peça'}
        </button>
        {salvo ? <span style={{ fontSize: 13, color: 'var(--ok)' }}>Dados salvos.</span> : null}
        {inicial ? (
          <ConfirmButton
            label="Excluir peça"
            title="Excluir esta peça?"
            description="A peça sai do site imediatamente. Se ela já foi vendida alguma vez, ela não é apagada do histórico — vira rascunho, para os pedidos antigos continuarem certos."
            confirmLabel="Excluir"
            onConfirm={async () => {
              await excluirPeca(inicial.id!);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
