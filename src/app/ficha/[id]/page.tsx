import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { fmt } from '@/lib/format';
import { PrintOnLoad } from '@/components/admin/PrintOnLoad';

export default async function FichaProducaoPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id)) notFound();

  const pedido = await prisma.order.findUnique({ where: { id }, include: { items: true, cost: true } });
  if (!pedido) notFound();

  return (
    <div style={{ background: '#fff', color: '#0D0F12', minHeight: '100vh', padding: 32, fontFamily: 'Montserrat, sans-serif', maxWidth: 720, margin: '0 auto' }}>
      <style>{`@media print { .nao-imprime { display: none !important; } }`}</style>
      <PrintOnLoad />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #0D0F12', paddingBottom: 12 }}>
        <b style={{ fontFamily: 'Cinzel, serif', fontSize: 20 }}>ERK Pratas · ficha de produção</b>
        <b style={{ fontSize: 16 }}>#{10000 + pedido.id}</b>
      </div>

      <div style={{ marginTop: 16, fontSize: 13.5, lineHeight: 1.6 }}>
        <div>
          <b>Cliente:</b> {pedido.customerName} · {pedido.customerPhone}
        </div>
        <div>
          <b>Entrada:</b> {pedido.createdAt.toLocaleString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </div>
        <div>
          <b>Entrega:</b> {pedido.delivery}
        </div>
      </div>

      {pedido.items.map((it) => {
        const ficha = it.buildJson ? (JSON.parse(it.buildJson) as Record<string, string | number | null>) : null;
        return (
          <div key={it.id} style={{ marginTop: 20, border: '1px solid #0D0F12', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
              <b>
                {it.quantity}× {it.name}
              </b>
              <b>{fmt(it.unitPrice * it.quantity)}</b>
            </div>
            <div style={{ fontSize: 13, color: '#4a4f57', marginTop: 4 }}>{it.spec}</div>
            {ficha ? (
              <table style={{ marginTop: 12, fontSize: 14, width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {Object.entries(ficha)
                    .filter(([, v]) => v !== null && v !== '' && v !== undefined)
                    .map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ padding: '4px 0', textTransform: 'capitalize', color: '#4a4f57', width: 140 }}>{k}</td>
                        <td style={{ padding: '4px 0', fontWeight: 600 }}>{String(v)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : null}
          </div>
        );
      })}

      {pedido.cost ? (
        <div style={{ marginTop: 20, fontSize: 13.5 }}>
          <b>Prata prevista:</b> {pedido.cost.silverGrams} g · <b>Massa de polir:</b> {pedido.cost.polishGrams} g
        </div>
      ) : null}

      <div style={{ marginTop: 28, borderTop: '1px dashed #0D0F12', paddingTop: 12, fontSize: 12.5, color: '#4a4f57' }}>
        Conferido por ______________________ em ____ / ____ / ______
      </div>
    </div>
  );
}
