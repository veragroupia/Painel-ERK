import { prisma } from '@/lib/db';
import { fmt } from '@/lib/format';
import { InsumosLista } from '@/components/admin/InsumosLista';
import { relativoTexto } from '@/lib/admin/status';

function inicioDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function InsumosPage({ searchParams }: { searchParams: { periodo?: string } }) {
  const periodo = searchParams.periodo || '30';
  const dias = parseInt(periodo, 10) || 30;
  const desde = new Date(Date.now() - dias * 86400000);

  const [insumos, consumos, comprasMes, consumosMes] = await Promise.all([
    prisma.supply.findMany({ orderBy: { name: 'asc' } }),
    prisma.supplyConsumption.findMany({ where: { date: { gte: desde } }, include: { supply: true }, orderBy: { date: 'desc' }, take: 60 }),
    prisma.supplyPurchase.findMany({ where: { date: { gte: inicioDoMes() } }, include: { supply: true } }),
    prisma.supplyConsumption.findMany({ where: { date: { gte: inicioDoMes() } }, include: { supply: true } }),
  ]);

  const gastoMes = comprasMes.reduce((a, c) => a + c.totalPaid, 0);
  const consumoPorInsumo = new Map<string, number>();
  for (const c of consumosMes) consumoPorInsumo.set(c.supply.name, (consumoPorInsumo.get(c.supply.name) || 0) + c.quantity * c.supply.unitCost);
  const maisConsome = [...consumoPorInsumo.entries()].sort((a, b) => b[1] - a[1])[0];

  const polimentoMes = consumosMes.filter((c) => c.supply.type === 'massa_polir');
  const custoPolimento = polimentoMes.reduce((a, c) => a + c.quantity * c.supply.unitCost, 0);
  const pecasPolidas = new Set(polimentoMes.map((c) => c.productName || c.id)).size || 1;

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 20 }}>
      <div className="adm-cab">
        <div>
          <h1 className="adm-h">Insumos</h1>
          <p className="adm-sub">O que se gasta no dia a dia da oficina — é isso que fecha a conta do lucro real.</p>
        </div>
      </div>

      <div className="adm-stats adm-stats--3">
        <div className="adm-stat">
          <div className="adm-stat__label">Gasto de insumo no mês</div>
          <div className="adm-stat__value">{fmt(gastoMes)}</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">Consome mais</div>
          <div className="adm-stat__value" style={{ fontSize: 18 }}>{maisConsome ? maisConsome[0] : '—'}</div>
          {maisConsome ? <div style={{ fontSize: 12.5, color: 'var(--tinta-3)', marginTop: 6 }}>{fmt(maisConsome[1])} no mês</div> : null}
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">Polimento por peça</div>
          <div className="adm-stat__value">{fmt(custoPolimento / pecasPolidas)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--tinta-3)', marginTop: 6 }}>média do mês</div>
        </div>
      </div>

      <InsumosLista
        insumos={insumos.map((i) => ({
          id: i.id,
          nome: i.name,
          tipo: i.type,
          unidade: i.unit,
          estoque: i.stockQty,
          custoUnit: i.unitCost,
          minimo: i.lowStockThreshold,
        }))}
        historico={consumos.map((c) => ({
          id: c.id,
          insumo: c.supply.name,
          quantidade: c.quantity,
          unidade: c.supply.unit,
          onde: c.productName || (c.orderId ? `Pedido #${10000 + c.orderId}` : c.note || '—'),
          quando: relativoTexto(c.date),
          custo: c.quantity * c.supply.unitCost,
        }))}
        periodo={periodo}
      />
    </div>
  );
}
