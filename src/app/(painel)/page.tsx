import Link from 'next/link';
import { prisma } from '@/lib/db';
import { fmt, fotoUrl } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/admin/StatusPill';
import { AdminMonthChart, type DiaGrafico } from '@/components/admin/AdminMonthChart';
import { paradoHaTexto } from '@/lib/admin/status';
import { orderCostTotal } from '@/lib/admin/money';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export default async function VisaoGeralPage() {
  const agora = new Date();
  const hojeInicio = startOfDay(agora);
  const hojeFim = addDays(hojeInicio, 1);
  const ontemInicio = addDays(hojeInicio, -1);
  const mesInicio = startOfMonth(agora);
  const mesFim = addMonths(mesInicio, 1);
  const mesAnteriorInicio = addMonths(mesInicio, -1);

  const [pedidosHoje, pedidosOntem, aDespachar, silverAtual, fixas] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: hojeInicio, lt: hojeFim }, status: { not: 'cancelado' } } }),
    prisma.order.findMany({ where: { createdAt: { gte: ontemInicio, lt: hojeInicio }, status: { not: 'cancelado' } } }),
    prisma.order.count({ where: { status: 'embalado' } }),
    prisma.silverPrice.findFirst({ orderBy: { at: 'desc' } }),
    prisma.fixedExpense.findMany({ where: { active: true } }),
  ]);

  const faturamentoHoje = pedidosHoje.reduce((a, o) => a + o.total, 0);
  const faturamentoOntem = pedidosOntem.reduce((a, o) => a + o.total, 0);
  const ticketHoje = pedidosHoje.length ? faturamentoHoje / pedidosHoje.length : 0;
  const ticketOntem = pedidosOntem.length ? faturamentoOntem / pedidosOntem.length : 0;

  const variacao = (atual: number, anterior: number) => (anterior === 0 ? (atual === 0 ? 0 : 100) : ((atual - anterior) / anterior) * 100);

  const faixa = [
    { label: 'Pedidos de hoje', valor: String(pedidosHoje.length), delta: variacao(pedidosHoje.length, pedidosOntem.length) },
    { label: 'A despachar', valor: String(aDespachar), delta: null },
    { label: 'Faturamento de hoje', valor: fmt(faturamentoHoje), delta: variacao(faturamentoHoje, faturamentoOntem) },
    { label: 'Ticket médio', valor: fmt(ticketHoje), delta: variacao(ticketHoje, ticketOntem) },
  ];

  async function contaDoMes(inicio: Date, fim: Date) {
    const pedidos = await prisma.order.findMany({
      where: { createdAt: { gte: inicio, lt: fim }, status: { not: 'cancelado' }, paymentStatus: 'pago' },
      include: { cost: true },
    });
    const vendas = pedidos.reduce((a, o) => a + o.total, 0);
    const taxas = pedidos.reduce((a, o) => a + o.paymentFeeAmount, 0);
    const custoPecas = pedidos.reduce((a, o) => (o.cost ? a + o.cost.silverGrams * o.cost.silverPricePerGram + o.cost.laborCost : a), 0);
    const insumos = pedidos.reduce((a, o) => (o.cost ? a + o.cost.polishCost + o.cost.packagingCost + o.cost.clampCost : a), 0);
    const frete = pedidos.reduce((a, o) => a + o.shipping, 0);
    const despesasFixas = fixas.reduce((a, e) => a + e.amount, 0);
    const lucro = vendas - taxas - custoPecas - insumos - frete - despesasFixas;
    return { vendas, taxas, custoPecas, insumos, frete, despesasFixas, lucro, pedidos };
  }

  const [mesAtual, mesAnterior] = await Promise.all([contaDoMes(mesInicio, mesFim), contaDoMes(mesAnteriorInicio, mesInicio)]);
  const margemMes = mesAtual.vendas > 0 ? (mesAtual.lucro / mesAtual.vendas) * 100 : 0;
  const progressoVsAnterior = mesAnterior.lucro > 0 ? Math.min(140, (mesAtual.lucro / mesAnterior.lucro) * 100) : mesAtual.lucro > 0 ? 100 : 0;

  // ---- precisa de você ----
  const [pagosAguardando, prontasEnvio, modelos3d, insumosBaixos] = await Promise.all([
    prisma.order.count({ where: { status: 'pago' } }),
    prisma.order.count({ where: { status: 'embalado' } }),
    prisma.product.count({ where: { model3dStatus: 'pending' } }),
    prisma.supply.findMany({ where: {} }),
  ]);
  const insumosAcabando = insumosBaixos.filter((s) => s.stockQty <= s.lowStockThreshold);

  const candidatosParados = await prisma.order.findMany({
    where: { status: { in: ['pago', 'producao', 'polimento', 'embalado', 'preparo'] } },
    include: { statusEvents: { orderBy: { at: 'desc' }, take: 1 } },
  });
  const parados = candidatosParados
    .filter((o) => o.statusEvents[0] && Date.now() - o.statusEvents[0].at.getTime() > 72 * 3600 * 1000)
    .sort((a, b) => a.statusEvents[0].at.getTime() - b.statusEvents[0].at.getTime());
  const maisParado = parados[0];

  const precisaDeVoce: { texto: string; href: string; urgente: boolean }[] = [];
  if (pagosAguardando > 0) precisaDeVoce.push({ texto: `${pagosAguardando} pedido${pagosAguardando > 1 ? 's' : ''} pago${pagosAguardando > 1 ? 's' : ''} aguardando produção`, href: '/pedidos?status=pago', urgente: false });
  if (prontasEnvio > 0) precisaDeVoce.push({ texto: `${prontasEnvio} peça${prontasEnvio > 1 ? 's' : ''} pronta${prontasEnvio > 1 ? 's' : ''} aguardando envio`, href: '/pedidos?status=embalado', urgente: false });
  if (maisParado) precisaDeVoce.push({ texto: `Pedido #${10000 + maisParado.id} parado ${paradoHaTexto(maisParado.statusEvents[0].at)} no mesmo status`, href: `/pedidos/${maisParado.id}`, urgente: true });
  if (modelos3d > 0) precisaDeVoce.push({ texto: `${modelos3d} modelo${modelos3d > 1 ? 's' : ''} 3D da IA aguardando sua aprovação`, href: '/pecas?aba=midia', urgente: false });
  for (const s of insumosAcabando) precisaDeVoce.push({ texto: `${s.name} acabando (restam ${s.stockQty}${s.unit})`, href: '/insumos', urgente: false });

  // ---- gráfico diário do mês ----
  const diasNoMes = agora.getDate();
  const pedidosMesTodos = await prisma.order.findMany({
    where: { createdAt: { gte: mesInicio, lt: mesFim }, status: { not: 'cancelado' }, paymentStatus: 'pago' },
    include: { cost: true },
  });
  const dados: DiaGrafico[] = Array.from({ length: diasNoMes }, (_, i) => {
    const dia = i + 1;
    const doDia = pedidosMesTodos.filter((o) => o.createdAt.getDate() === dia);
    const faturamento = doDia.reduce((a, o) => a + o.total, 0);
    const custo = doDia.reduce((a, o) => (o.cost ? a + orderCostTotal(o.cost) : a), 0);
    return { dia, faturamento, custo: Math.min(custo, faturamento), lucro: Math.max(0, faturamento - custo) };
  });

  // ---- peças mais vendidas do mês ----
  const itensMes = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: mesInicio, lt: mesFim }, status: { not: 'cancelado' } } },
    include: { product: true },
  });
  const porProduto = new Map<string, { nome: string; foto: string; qtd: number; lucro: number }>();
  for (const it of itensMes) {
    if (!it.product) continue;
    const custoUnit = it.product.costSilverGrams * (silverAtual?.value ?? 6.6) + it.product.costLaborValue + it.product.costPackaging + it.product.costThirdParty;
    const atual = porProduto.get(it.productId!) || { nome: it.product.name, foto: fotoUrl(it.product.photoId, 100), qtd: 0, lucro: 0 };
    atual.qtd += it.quantity;
    atual.lucro += (it.unitPrice - custoUnit) * it.quantity;
    porProduto.set(it.productId!, atual);
  }
  const maisVendidas = [...porProduto.values()].sort((a, b) => b.qtd - a.qtd).slice(0, 5);

  // ---- destaque do dia ----
  const destaqueHoje = await prisma.highlightSchedule.findFirst({
    where: { date: hojeInicio },
    include: { product: true, combo: { include: { items: { include: { product: true } } } } },
  });

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 24 }}>
      <div className="adm-cab">
        <div>
          <h1 className="adm-h">Visão geral</h1>
          <p className="adm-sub">{agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      <div className="adm-stats">
        {faixa.map((f) => (
          <div key={f.label} className="adm-stat">
            <div className="adm-stat__label">{f.label}</div>
            <div className="adm-stat__value">{f.valor}</div>
            {f.delta !== null ? (
              <div className={'adm-stat__delta ' + (f.delta >= 0 ? 'up' : 'down')}>
                <Icon name={f.delta >= 0 ? 'adm_setacima' : 'adm_setabaixo'} size={12} />
                {Math.abs(f.delta).toFixed(0)}% vs ontem
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="adm-grid-2" style={{ ['--adm-cols' as string]: '1.15fr .85fr', alignItems: 'stretch' }}>
        <div className="adm-profit-card">
          <div className="adm-stat__label">Lucro do mês</div>
          <div className="adm-profit-value" style={mesAtual.lucro < 0 ? { color: 'var(--acento)' } : undefined}>
            {fmt(mesAtual.lucro)}
          </div>
          <div className="adm-profit-lines">
            <div className="adm-profit-line">
              <span>Vendas</span>
              <span>{fmt(mesAtual.vendas)}</span>
            </div>
            <div className="adm-profit-line">
              <span>– Taxas de pagamento</span>
              <span>{fmt(mesAtual.taxas)}</span>
            </div>
            <div className="adm-profit-line">
              <span>– Custo das peças</span>
              <span>{fmt(mesAtual.custoPecas)}</span>
            </div>
            <div className="adm-profit-line">
              <span>– Insumos e embalagem</span>
              <span>{fmt(mesAtual.insumos)}</span>
            </div>
            <div className="adm-profit-line">
              <span>– Frete pago</span>
              <span>{fmt(mesAtual.frete)}</span>
            </div>
            <div className="adm-profit-line">
              <span>– Despesas fixas</span>
              <span>{fmt(mesAtual.despesasFixas)}</span>
            </div>
            <div className="adm-profit-line total">
              <span>Lucro do mês</span>
              <span>
                {fmt(mesAtual.lucro)} ({margemMes.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="adm-meter">
            <span style={{ width: Math.min(100, progressoVsAnterior) + '%' }} />
          </div>
          <div className="adm-meter-caption">
            <span>vs mês passado</span>
            <span>{fmt(mesAnterior.lucro)}</span>
          </div>
        </div>

        <div className="adm-card adm-card-pad">
          <div className="adm-stat__label" style={{ marginBottom: 6 }}>
            Precisa de você
          </div>
          {precisaDeVoce.length === 0 ? (
            <p style={{ color: 'var(--tinta-2)', fontSize: 13.5, marginTop: 12 }}>Tudo em dia. Nada pedindo atenção agora.</p>
          ) : (
            <div className="adm-todo">
              {precisaDeVoce.map((p, i) => (
                <Link key={i} href={p.href} className={'adm-todo-item' + (p.urgente ? ' is-urgent' : '')}>
                  <span className="adm-todo-dot" />
                  <span className="adm-todo-text">{p.texto}</span>
                  <Icon name="adm_chevrondireita" size={15} className="adm-todo-arrow" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="adm-card adm-card-pad">
        <div className="adm-stat__label" style={{ marginBottom: 14 }}>
          Gráfico do mês
        </div>
        <AdminMonthChart dados={dados} />
      </div>

      <div className="adm-grid-2">
        <div className="adm-card adm-card-pad">
          <div className="adm-stat__label" style={{ marginBottom: 14 }}>
            Peças mais vendidas do mês
          </div>
          {maisVendidas.length === 0 ? (
            <p style={{ color: 'var(--tinta-2)', fontSize: 13.5 }}>Ainda sem vendas este mês.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {maisVendidas.map((p) => (
                <div key={p.nome} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={p.foto} alt="" width={44} height={44} style={{ borderRadius: 8, objectFit: 'cover', flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 13.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</b>
                    <span style={{ fontSize: 12, color: 'var(--tinta-3)' }}>{p.qtd} vendidas</span>
                  </div>
                  <b style={{ fontSize: 13.5, color: p.lucro >= 0 ? '#3FD08A' : '#EA858B', flex: 'none' }}>{fmt(p.lucro)}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adm-card adm-card-pad">
          <div className="adm-stat__label" style={{ marginBottom: 14 }}>
            Destaque do dia
          </div>
          {destaqueHoje ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={destaqueHoje.product ? fotoUrl(destaqueHoje.product.photoId, 140) : destaqueHoje.combo ? fotoUrl(destaqueHoje.combo.items[0]?.product.photoId ?? 0, 140) : ''}
                alt=""
                width={64}
                height={64}
                style={{ borderRadius: 10, objectFit: 'cover', flex: 'none' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14.5 }}>{destaqueHoje.product?.name || destaqueHoje.combo?.name}</b>
                <p style={{ fontSize: 12.5, color: 'var(--tinta-3)', marginTop: 4 }}>{destaqueHoje.targetType === 'combo' ? 'Combo em destaque' : 'Peça em destaque'}</p>
              </div>
              <Link href="/vitrine" className="erk-btn erk-btn--s erk-btn--sm">
                Trocar
              </Link>
            </div>
          ) : (
            <p style={{ color: 'var(--tinta-2)', fontSize: 13.5 }}>Nenhum destaque programado para hoje.</p>
          )}
        </div>
      </div>
    </div>
  );
}
