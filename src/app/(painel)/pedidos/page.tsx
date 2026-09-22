import Link from 'next/link';
import { prisma } from '@/lib/db';
import { fotoUrl } from '@/lib/format';
import { PedidosLista, type PedidoLinha } from '@/components/admin/PedidosLista';
import { FiltroSelect } from '@/components/admin/FiltroSelect';
import { PedidosFiltros } from '@/components/admin/PedidosFiltros';

const PILULAS = [
  { id: 'todos', nome: 'Todos' },
  { id: 'hoje', nome: 'Hoje' },
  { id: 'novo', nome: 'Novos' },
  { id: 'pago', nome: 'Pagos' },
  { id: 'producao', nome: 'Em produção' },
  { id: 'embalado', nome: 'Prontos' },
  { id: 'enviado', nome: 'Enviados' },
  { id: 'entregue', nome: 'Entregues' },
  { id: 'cancelado', nome: 'Cancelados' },
];

function inicioDeHoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function PedidosPage({ searchParams }: { searchParams: { status?: string; q?: string; periodo?: string; pagamento?: string } }) {
  const status = searchParams.status || 'todos';
  const busca = (searchParams.q || '').trim();
  const periodo = searchParams.periodo || 'tudo';
  const pagamento = searchParams.pagamento || 'todos';

  const desde = periodo === '7' ? 7 : periodo === '30' ? 30 : periodo === '90' ? 90 : null;
  const dataCorte = desde ? new Date(Date.now() - desde * 86400000) : null;

  const where: any = {};
  if (status === 'hoje') where.createdAt = { gte: inicioDeHoje() };
  else if (status === 'producao') where.status = { in: ['producao', 'preparo'] };
  else if (status !== 'todos') where.status = status;
  if (dataCorte) where.createdAt = { ...(where.createdAt || {}), gte: dataCorte };
  if (pagamento !== 'todos') where.payment = pagamento;
  if (busca) {
    const comoNumero = parseInt(busca.replace(/\D/g, ''), 10);
    where.OR = [
      { customerName: { contains: busca, mode: 'insensitive' } },
      { customerPhone: { contains: busca } },
      ...(Number.isFinite(comoNumero) ? [{ id: comoNumero > 10000 ? comoNumero - 10000 : comoNumero }] : []),
    ];
  }

  const [pedidos, porStatus, totalHoje, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        statusEvents: { orderBy: { at: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.count({ where: { createdAt: { gte: inicioDeHoje() } } }),
    prisma.order.count(),
  ]);

  const contagem: Record<string, number> = { todos: total, hoje: totalHoje };
  for (const g of porStatus) contagem[g.status] = (contagem[g.status] ?? 0) + g._count._all;
  // pedidos antigos da loja entram na contagem de "em produção"
  contagem['producao'] = (contagem['producao'] ?? 0) + (contagem['preparo'] ?? 0);

  const linhas: PedidoLinha[] = pedidos.map((o) => ({
    id: o.id,
    numero: 10000 + o.id,
    cliente: o.customerName,
    telefone: o.customerPhone,
    itens: o.items.map((i) => i.name).join(' · ') || '—',
    qtdItens: o.items.reduce((a, i) => a + i.quantity, 0),
    foto: o.items[0]?.product ? fotoUrl(o.items[0].product.photoId, 80) : null,
    valor: o.total,
    pagamento: o.payment,
    entrega: o.delivery,
    status: o.status,
    desdeISO: (o.statusEvents[0]?.at ?? o.createdAt).toISOString(),
    criadoISO: o.createdAt.toISOString(),
  }));

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 20 }}>
      <div className="adm-cab">
        <div>
          <h1 className="adm-h">Pedidos</h1>
          <p className="adm-sub">{total} pedidos no total · {contagem['pago'] || 0} esperando produção</p>
        </div>
      </div>

      <div className="adm-filtros">
        <FiltroSelect
          rotulo="Situação"
          valor={status}
          opcoes={PILULAS.map((pl) => {
            const params = new URLSearchParams();
            if (pl.id !== 'todos') params.set('status', pl.id);
            if (busca) params.set('q', busca);
            if (periodo !== 'tudo') params.set('periodo', periodo);
            if (pagamento !== 'todos') params.set('pagamento', pagamento);
            const qs = params.toString();
            return { valor: pl.id, nome: pl.nome, contagem: contagem[pl.id] ?? 0, href: `/pedidos${qs ? '?' + qs : ''}` };
          })}
        />
      </div>

      <PedidosFiltros q={busca} periodo={periodo} pagamento={pagamento} status={status} />

      <PedidosLista linhas={linhas} />
    </div>
  );
}
