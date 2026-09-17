import { prisma } from '@/lib/db';
import { fmt } from '@/lib/format';
import { PrintOnLoad } from '@/components/admin/PrintOnLoad';

const ENTREGA_NOME: Record<string, string> = { motoboy: 'Motoboy', correios: 'Correios', retirada: 'Retirada na loja' };

export default async function EtiquetasPage({ searchParams }: { searchParams: { ids?: string } }) {
  const ids = (searchParams.ids || '')
    .split(',')
    .map((n) => parseInt(n, 10))
    .filter(Number.isFinite);

  const pedidos = ids.length ? await prisma.order.findMany({ where: { id: { in: ids } }, include: { items: true, user: { include: { address: true } } }, orderBy: { id: 'asc' } }) : [];

  return (
    <div style={{ background: '#fff', color: '#0D0F12', minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`@media print { .nao-imprime { display: none !important; } body { background: #fff; } }`}</style>
      <div className="nao-imprime" style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <b style={{ fontFamily: 'Cinzel, serif', fontSize: 18 }}>ERK Pratas · etiquetas</b>
        <span style={{ fontSize: 13, color: '#6E757F' }}>{pedidos.length} etiqueta(s)</span>
      </div>
      <PrintOnLoad />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {pedidos.map((o) => (
          <div key={o.id} style={{ border: '1px solid #0D0F12', borderRadius: 8, padding: 16, breakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <b style={{ fontFamily: 'Cinzel, serif', fontSize: 15 }}>ERK Pratas</b>
              <b style={{ fontSize: 14 }}>#{10000 + o.id}</b>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5 }}>
              <b>{o.customerName}</b>
              <div>{o.customerPhone}</div>
              {o.user?.address ? (
                <div style={{ marginTop: 6 }}>
                  {o.user.address.street}
                  {o.addressNumber ? `, ${o.addressNumber}` : ''}
                  <div>
                    {o.user.address.city} · {o.user.address.state} · CEP {o.zip}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 6 }}>CEP {o.zip}</div>
              )}
            </div>
            <div style={{ marginTop: 12, borderTop: '1px solid #ccc', paddingTop: 8, fontSize: 12.5 }}>
              <div>{o.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}</div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>{ENTREGA_NOME[o.delivery] || o.delivery}</span>
                <b>{fmt(o.total)}</b>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pedidos.length === 0 ? <p style={{ fontSize: 14 }}>Nenhum pedido selecionado.</p> : null}
    </div>
  );
}
