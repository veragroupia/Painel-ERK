'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/format';
import { StatusPill } from './StatusPill';
import { AdminEmptyState } from './AdminEmptyState';
import { paradoHaTexto, horasDesde, STATUS_LABEL } from '@/lib/admin/status';
import { definirStatusEmLote } from '@/lib/admin/orderActions';

export type PedidoLinha = {
  id: number;
  numero: number;
  cliente: string;
  telefone: string;
  itens: string;
  qtdItens: number;
  foto: string | null;
  valor: number;
  pagamento: string;
  entrega: string;
  status: string;
  desdeISO: string;
  criadoISO: string;
};

const PAGAMENTO_NOME: Record<string, string> = { pix: 'Pix', credito: 'Cartão', whats: 'A combinar' };
const ENTREGA_NOME: Record<string, string> = { motoboy: 'Motoboy', correios: 'Correios', retirada: 'Retirada' };
const STATUS_EM_LOTE = ['pago', 'producao', 'polimento', 'embalado', 'enviado', 'entregue'];

export function PedidosLista({ linhas }: { linhas: PedidoLinha[] }) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [pendente, start] = useTransition();

  function alternar(id: number) {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function alternarTodos() {
    setSelecionados((s) => (s.length === linhas.length ? [] : linhas.map((l) => l.id)));
  }

  function imprimirEtiquetas() {
    const ids = selecionados.join(',');
    window.open(`/etiquetas?ids=${ids}`, '_blank');
  }

  if (linhas.length === 0) {
    return (
      <AdminEmptyState
        icon="adm_pedidos"
        title="Nenhum pedido nesse filtro."
        action={<p style={{ fontSize: 13.5, marginTop: 4 }}>Troque a pílula acima ou limpe a busca para ver todos os pedidos.</p>}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {selecionados.length > 0 ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'var(--fundo-3)', border: '1px solid var(--linha-2)', borderRadius: 12, padding: '10px 14px' }}>
          <b style={{ fontSize: 13.5 }}>{selecionados.length} selecionado(s)</b>
          <select
            className="adm-select adm-select--sm"
            style={{ width: 'auto' }}
            defaultValue=""
            disabled={pendente}
            onChange={(e) => {
              const novo = e.target.value;
              if (!novo) return;
              e.target.value = '';
              start(async () => {
                await definirStatusEmLote(selecionados, novo);
                setSelecionados([]);
                router.refresh();
              });
            }}
          >
            <option value="">Mudar status para…</option>
            {STATUS_EM_LOTE.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button type="button" className="erk-btn erk-btn--s erk-btn--sm" onClick={imprimirEtiquetas}>
            Imprimir etiquetas
          </button>
          <button type="button" className="erk-btn erk-btn--s erk-btn--sm" onClick={() => setSelecionados([])}>
            Limpar
          </button>
        </div>
      ) : null}

      {/* desktop */}
      <div className="adm-table-wrap chrome-desktop">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>
                <input type="checkbox" checked={selecionados.length === linhas.length} onChange={alternarTodos} aria-label="Selecionar todos" />
              </th>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Valor</th>
              <th>Pagamento</th>
              <th>Entrega</th>
              <th>Status</th>
              <th>Parado há</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const horas = horasDesde(new Date(l.desdeISO));
              const travado = horas > 48 && l.status !== 'entregue' && l.status !== 'cancelado';
              return (
                <tr key={l.id}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selecionados.includes(l.id)} onChange={() => alternar(l.id)} aria-label={`Selecionar pedido ${l.numero}`} />
                  </td>
                  <td>
                    <Link href={`/pedidos/${l.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
                      {l.foto ? <img src={l.foto} alt="" width={32} height={32} style={{ borderRadius: 6, objectFit: 'cover' }} /> : null}
                      {l.numero}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/pedidos/${l.id}`}>
                      {l.cliente}
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--tinta-3)' }}>{l.telefone}</span>
                    </Link>
                  </td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--tinta-2)' }}>{l.itens}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(l.valor)}</td>
                  <td style={{ color: 'var(--tinta-2)' }}>{PAGAMENTO_NOME[l.pagamento] || l.pagamento}</td>
                  <td style={{ color: 'var(--tinta-2)' }}>{ENTREGA_NOME[l.entrega] || l.entrega}</td>
                  <td>
                    <StatusPill status={l.status} />
                  </td>
                  <td style={{ color: travado ? 'var(--acento)' : 'var(--tinta-3)', fontWeight: travado ? 600 : 400, whiteSpace: 'nowrap' }}>
                    {l.status === 'entregue' || l.status === 'cancelado' ? '—' : paradoHaTexto(new Date(l.desdeISO))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* celular */}
      <div className="adm-rowcards chrome-mobile">
        {linhas.map((l) => {
          const horas = horasDesde(new Date(l.desdeISO));
          const travado = horas > 48 && l.status !== 'entregue' && l.status !== 'cancelado';
          return (
            <div key={l.id} className="adm-rowcard">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={selecionados.includes(l.id)} onChange={() => alternar(l.id)} aria-label={`Selecionar pedido ${l.numero}`} style={{ width: 20, height: 20, flex: 'none' }} />
                {l.foto ? <img src={l.foto} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover', flex: 'none' }} /> : null}
                <Link href={`/pedidos/${l.id}`} style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 14 }}>#{l.numero}</b>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--tinta-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.cliente}</span>
                </Link>
                <StatusPill status={l.status} />
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--tinta-2)', margin: 0 }}>{l.itens}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', borderTop: '1px solid var(--linha)', paddingTop: 8 }}>
                <b style={{ fontSize: 15 }}>{fmt(l.valor)}</b>
                <span style={{ fontSize: 12, color: travado ? 'var(--acento)' : 'var(--tinta-3)', fontWeight: travado ? 600 : 400 }}>
                  {l.status === 'entregue' || l.status === 'cancelado' ? PAGAMENTO_NOME[l.pagamento] : paradoHaTexto(new Date(l.desdeISO))}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
