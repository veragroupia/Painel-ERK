'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

export function PedidosFiltros({ q, periodo, pagamento, status }: { q: string; periodo: string; pagamento: string; status: string }) {
  const router = useRouter();
  const [busca, setBusca] = useState(q);

  function navegar(campos: { q?: string; periodo?: string; pagamento?: string }) {
    const params = new URLSearchParams();
    if (status !== 'todos') params.set('status', status);
    const novaBusca = campos.q ?? busca;
    const novoPeriodo = campos.periodo ?? periodo;
    const novoPagamento = campos.pagamento ?? pagamento;
    if (novaBusca) params.set('q', novaBusca);
    if (novoPeriodo !== 'tudo') params.set('periodo', novoPeriodo);
    if (novoPagamento !== 'todos') params.set('pagamento', novoPagamento);
    const qs = params.toString();
    router.push(`/pedidos${qs ? '?' + qs : ''}`);
  }

  return (
    <div className="adm-filtros">
      <label className="adm-filtro adm-filtro--busca">
        <span>Buscar</span>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navegar({});
          }}
          className="adm-search"
        >
          <Icon name="busca" size={15} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Número, cliente ou telefone" />
        </form>
      </label>

      <label className="adm-filtro">
        <span>Período</span>
      <select className="adm-select adm-select--sm" value={periodo} onChange={(e) => navegar({ periodo: e.target.value })}>
        <option value="tudo">Todo o período</option>
        <option value="7">Últimos 7 dias</option>
        <option value="30">Últimos 30 dias</option>
        <option value="90">Últimos 90 dias</option>
      </select>
      </label>

      <label className="adm-filtro">
        <span>Pagamento</span>
      <select className="adm-select adm-select--sm" value={pagamento} onChange={(e) => navegar({ pagamento: e.target.value })}>
        <option value="todos">Todo pagamento</option>
        <option value="pix">Pix</option>
        <option value="credito">Cartão</option>
        <option value="whats">Combinar no WhatsApp</option>
      </select>
      </label>
    </div>
  );
}
