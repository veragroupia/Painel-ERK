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
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navegar({});
        }}
        className="adm-search"
        style={{ maxWidth: 360, flex: '1 1 240px' }}
      >
        <Icon name="busca" size={15} />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Número, cliente ou telefone" />
      </form>

      <select className="adm-select adm-select--sm" style={{ width: 'auto' }} value={periodo} onChange={(e) => navegar({ periodo: e.target.value })}>
        <option value="tudo">Todo o período</option>
        <option value="7">Últimos 7 dias</option>
        <option value="30">Últimos 30 dias</option>
        <option value="90">Últimos 90 dias</option>
      </select>

      <select className="adm-select adm-select--sm" style={{ width: 'auto' }} value={pagamento} onChange={(e) => navegar({ pagamento: e.target.value })}>
        <option value="todos">Todo pagamento</option>
        <option value="pix">Pix</option>
        <option value="credito">Cartão</option>
        <option value="whats">Combinar no WhatsApp</option>
      </select>
    </div>
  );
}
