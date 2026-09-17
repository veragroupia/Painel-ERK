import Link from 'next/link';
import { prisma } from '@/lib/db';
import { fmt, fotoUrl } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { AdminYearChart, type MesGrafico } from '@/components/admin/AdminYearChart';
import { MarginBadge } from '@/components/admin/MarginBadge';
import { DespesasFixas } from '@/components/admin/DespesasFixas';
import { productCostTotal, marginPct, orderCostTotal } from '@/lib/admin/money';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default async function FinanceiroPage({ searchParams }: { searchParams: { mes?: string } }) {
  const agora = new Date();
  const [anoSel, mesSel] = (searchParams.mes || `${agora.getFullYear()}-${agora.getMonth() + 1}`).split('-').map((n) => parseInt(n, 10));
  const inicio = new Date(anoSel, mesSel - 1, 1);
  const fim = new Date(anoSel, mesSel, 1);

  const [pedidos, fixas, precoPrata, todosItens] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: inicio, lt: fim }, status: { not: 'cancelado' }, paymentStatus: 'pago' }, include: { cost: true } }),
    prisma.fixedExpense.findMany({ orderBy: { dayOfMonth: 'asc' } }),
    prisma.silverPrice.findFirst({ orderBy: { at: 'desc' } }),
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: inicio, lt: fim }, status: { not: 'cancelado' } } },
      include: { product: true },
    }),
  ]);

  const grama = precoPrata?.value ?? 6.6;
  const vendas = pedidos.reduce((a, o) => a + o.total, 0);
  const porPix = pedidos.filter((o) => o.payment === 'pix').reduce((a, o) => a + o.total, 0);
  const porCartao = pedidos.filter((o) => o.payment === 'credito').reduce((a, o) => a + o.total, 0);
  const porOutros = vendas - porPix - porCartao;
  const taxas = pedidos.reduce((a, o) => a + o.paymentFeeAmount, 0);
  const prata = pedidos.reduce((a, o) => (o.cost ? a + o.cost.silverGrams * o.cost.silverPricePerGram : a), 0);
  const maoDeObra = pedidos.reduce((a, o) => (o.cost ? a + o.cost.laborCost : a), 0);
  const insumos = pedidos.reduce((a, o) => (o.cost ? a + o.cost.polishCost + o.cost.packagingCost + o.cost.clampCost : a), 0);
  const frete = pedidos.reduce((a, o) => a + o.shipping, 0);
  const despesasFixas = fixas.filter((f) => f.active).reduce((a, f) => a + f.amount, 0);
  const lucro = vendas - taxas - prata - maoDeObra - insumos - frete - despesasFixas;
  const margem = vendas > 0 ? (lucro / vendas) * 100 : 0;

  // ---- 12 meses ----
  const dozeInicio = new Date(agora.getFullYear(), agora.getMonth() - 11, 1);
  const pedidos12 = await prisma.order.findMany({
    where: { createdAt: { gte: dozeInicio }, status: { not: 'cancelado' }, paymentStatus: 'pago' },
    include: { cost: true },
  });
  const grafico: MesGrafico[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - 11 + i, 1);
    const doMes = pedidos12.filter((o) => o.createdAt.getFullYear() === d.getFullYear() && o.createdAt.getMonth() === d.getMonth());
    const fat = doMes.reduce((a, o) => a + o.total, 0);
    const custo = doMes.reduce((a, o) => (o.cost ? a + orderCostTotal(o.cost) : a), 0);
    const tx = doMes.reduce((a, o) => a + o.paymentFeeAmount, 0);
    return { rotulo: MESES[d.getMonth()], faturamento: fat, lucro: fat > 0 ? fat - custo - tx - despesasFixas : 0 };
  });

  // ---- peças: lucro e margem ----
  const porProduto = new Map<string, { nome: string; foto: string; lucro: number; margem: number; qtd: number }>();
  for (const it of todosItens) {
    if (!it.product) continue;
    const custoUnit = productCostTotal(it.product, grama);
    const atual = porProduto.get(it.productId!) || { nome: it.product.name, foto: fotoUrl(it.product.photoId, 100), lucro: 0, margem: marginPct(it.product.price, custoUnit), qtd: 0 };
    atual.lucro += (it.unitPrice - custoUnit) * it.quantity;
    atual.qtd += it.quantity;
    porProduto.set(it.productId!, atual);
  }
  const listaPecas = [...porProduto.values()];
  const maisLucro = [...listaPecas].sort((a, b) => b.lucro - a.lucro).slice(0, 5);
  const margemApertada = [...listaPecas].filter((p) => p.margem < 30).sort((a, b) => a.margem - b.margem).slice(0, 5);

  const linhas = [
    { rotulo: 'Vendas', valor: vendas, destaque: true },
    { rotulo: '  Pix', valor: porPix, sub: true },
    { rotulo: '  Cartão', valor: porCartao, sub: true },
    ...(porOutros > 0.01 ? [{ rotulo: '  Outros', valor: porOutros, sub: true }] : []),
    { rotulo: '– Taxas de pagamento', valor: -taxas },
    { rotulo: '– Prata', valor: -prata },
    { rotulo: '– Mão de obra', valor: -maoDeObra },
    { rotulo: '– Insumos e polimento', valor: -insumos },
    { rotulo: '– Frete pago', valor: -frete },
    { rotulo: '– Despesas fixas', valor: -despesasFixas },
  ];

  const mesesOpcoes = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    return { valor: `${d.getFullYear()}-${d.getMonth() + 1}`, rotulo: `${MESES[d.getMonth()]} de ${d.getFullYear()}` };
  });

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 20 }}>
      <div className="adm-cab">
        <div>
          <h1 className="adm-h">Financeiro</h1>
          <p className="adm-sub">A conta do mês, aberta linha por linha.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <form>
            <select name="mes" className="adm-select adm-select--sm" style={{ width: 'auto' }} defaultValue={`${anoSel}-${mesSel}`}>
              {mesesOpcoes.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.rotulo}
                </option>
              ))}
            </select>
            <button type="submit" className="erk-btn erk-btn--s erk-btn--sm" style={{ marginLeft: 8 }}>
              Ver mês
            </button>
          </form>
          <a href={`/api/financeiro/csv?mes=${anoSel}-${mesSel}`} className="erk-btn erk-btn--s erk-btn--sm">
            <Icon name="adm_upload" size={15} /> Exportar CSV
          </a>
        </div>
      </div>

      <div className="adm-grid-2" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div className="adm-profit-card">
          <div className="adm-stat__label">Lucro do mês</div>
          <div className="adm-profit-value" style={lucro < 0 ? { color: 'var(--acento)' } : undefined}>
            {fmt(lucro)}
          </div>
          <div className="adm-profit-lines">
            {linhas.map((l) => (
              <div key={l.rotulo} className="adm-profit-line" style={l.sub ? { paddingLeft: 12, fontSize: 12.5, color: 'var(--tinta-3)' } : undefined}>
                <span style={{ whiteSpace: 'pre' }}>{l.rotulo}</span>
                <span>{fmt(Math.abs(l.valor))}</span>
              </div>
            ))}
            <div className="adm-profit-line total">
              <span>Lucro do mês</span>
              <span>{fmt(lucro)}</span>
            </div>
            <div className="adm-profit-line" style={{ color: 'var(--tinta-2)' }}>
              <span>Margem</span>
              <span>{margem.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="adm-card adm-card-pad">
          <div className="adm-stat__label" style={{ marginBottom: 14 }}>
            Últimos 12 meses
          </div>
          <AdminYearChart dados={grafico} />
        </div>
      </div>

      <div className="adm-grid-2">
        <div className="adm-card adm-card-pad">
          <div className="adm-stat__label" style={{ marginBottom: 14 }}>
            Peças que mais deram lucro no mês
          </div>
          {maisLucro.length === 0 ? (
            <p style={{ fontSize: 13.5, color: 'var(--tinta-2)' }}>Sem vendas neste mês.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {maisLucro.map((p) => (
                <div key={p.nome} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={p.foto} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover', flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>{p.nome}</span>
                  <b style={{ fontSize: 13.5, color: p.lucro >= 0 ? 'var(--ok)' : 'var(--acento)' }}>{fmt(p.lucro)}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adm-card adm-card-pad">
          <div className="adm-stat__label" style={{ marginBottom: 14 }}>
            Peças com margem apertada
          </div>
          {margemApertada.length === 0 ? (
            <p style={{ fontSize: 13.5, color: 'var(--tinta-2)' }}>Nenhuma peça abaixo de 30% de margem. Está tudo saudável.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {margemApertada.map((p) => (
                <div key={p.nome} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={p.foto} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover', flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>{p.nome}</span>
                  <MarginBadge pct={p.margem} />
                </div>
              ))}
              <Link href="/pecas" style={{ fontSize: 12.5, color: 'var(--tinta-2)', marginTop: 4 }}>
                Revisar preços no catálogo →
              </Link>
            </div>
          )}
        </div>
      </div>

      <DespesasFixas despesas={fixas.map((f) => ({ id: f.id, nome: f.name, valor: f.amount, dia: f.dayOfMonth, ativa: f.active }))} />
    </div>
  );
}
