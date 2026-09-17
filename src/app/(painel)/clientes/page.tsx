import Link from 'next/link';
import { prisma } from '@/lib/db';
import { fmt } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { relativoTexto } from '@/lib/admin/status';

export default async function ClientesPage({ searchParams }: { searchParams: { q?: string } }) {
  const busca = (searchParams.q || '').trim();

  const clientes = await prisma.user.findMany({
    where: {
      role: 'cliente',
      ...(busca
        ? {
            OR: [{ name: { contains: busca, mode: 'insensitive' as const } }, { phone: { contains: busca } }, { email: { contains: busca, mode: 'insensitive' as const } }],
          }
        : {}),
    },
    include: { orders: { where: { status: { not: 'cancelado' } }, orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const linhas = clientes
    .map((c) => ({
      id: c.id,
      nome: c.name,
      telefone: c.phone || '—',
      pedidos: c.orders.length,
      total: c.orders.reduce((a, o) => a + o.total, 0),
      ultima: c.orders[0]?.createdAt ?? null,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 20 }}>
      <div className="adm-cab">
        <div>
          <h1 className="adm-h">Clientes</h1>
          <p className="adm-sub">{clientes.length} clientes cadastrados</p>
        </div>
        <form className="adm-search" style={{ maxWidth: 320 }}>
          <Icon name="busca" size={15} />
          <input name="q" defaultValue={busca} placeholder="Nome, WhatsApp ou e-mail" />
        </form>
      </div>

      {linhas.length === 0 ? (
        <AdminEmptyState icon="adm_clientes" title="Nenhum cliente encontrado." action={<p style={{ fontSize: 13.5 }}>Os clientes aparecem aqui assim que fazem o primeiro pedido.</p>} />
      ) : (
        <>
          <div className="adm-table-wrap chrome-desktop">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Pedidos</th>
                  <th>Total gasto</th>
                  <th>Última compra</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`/clientes/${l.id}`}>{l.nome}</Link>
                    </td>
                    <td style={{ color: 'var(--tinta-2)' }}>{l.telefone}</td>
                    <td>{l.pedidos}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(l.total)}</td>
                    <td style={{ color: 'var(--tinta-3)' }}>{l.ultima ? relativoTexto(l.ultima) : 'nunca comprou'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="adm-rowcards chrome-mobile">
            {linhas.map((l) => (
              <Link key={l.id} href={`/clientes/${l.id}`} className="adm-rowcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b style={{ fontSize: 14 }}>{l.nome}</b>
                  <b style={{ fontSize: 14 }}>{fmt(l.total)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: 'var(--tinta-3)' }}>
                  <span>{l.telefone}</span>
                  <span>
                    {l.pedidos} pedidos · {l.ultima ? relativoTexto(l.ultima) : '—'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
