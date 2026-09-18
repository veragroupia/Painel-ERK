import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { fmt, fotoUrl } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/admin/StatusPill';
import { PedidoAcoes } from '@/components/admin/PedidoAcoes';
import { PedidoCusto } from '@/components/admin/PedidoCusto';
import { PedidoOndeEsta } from '@/components/admin/PedidoOndeEsta';
import { PedidoNotas } from '@/components/admin/PedidoNotas';
import { CopiarBotao } from '@/components/admin/CopiarBotao';
import { STATUS_FLOW, STATUS_FLOW_PRONTA, STATUS_LABEL, statusNormalizado } from '@/lib/admin/status';

const ENTREGA_NOME: Record<string, string> = { motoboy: 'Motoboy', correios: 'Correios', retirada: 'Retirada na loja' };
const PAGAMENTO_NOME: Record<string, string> = { pix: 'Pix', credito: 'Cartão de crédito', whats: 'A combinar no WhatsApp' };

function dataHora(d: Date) {
  return d.toLocaleString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export default async function PedidoDetalhePage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id)) notFound();

  const pedido = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      statusEvents: { orderBy: { at: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' } },
      cost: true,
      user: { include: { address: true, measurements: true } },
    },
  });
  if (!pedido) notFound();

  const stats = pedido.userId
    ? await prisma.order.aggregate({ where: { userId: pedido.userId, status: { not: 'cancelado' } }, _count: { _all: true }, _sum: { total: true } })
    : null;

  const fluxo = pedido.readyFromStock ? STATUS_FLOW_PRONTA : STATUS_FLOW;
  const statusAtual = statusNormalizado(pedido.status);
  const idxAtual = (fluxo as readonly string[]).indexOf(statusAtual);
  // pedido vindo da loja não tem linha do tempo: mostra ao menos a entrada,
  // na hora em que ele chegou. O histórico real passa a ser gravado na
  // primeira ação que o dono tomar aqui.
  const eventos = pedido.statusEvents.length > 0 ? pedido.statusEvents : [{ id: 'entrada', orderId: pedido.id, status: 'novo', at: pedido.createdAt, by: 'Loja' }];
  const eventoPor = new Map(eventos.map((e) => [e.status, e]));

  const custo = pedido.cost;
  const custoTotal = custo ? custo.silverGrams * custo.silverPricePerGram + custo.laborCost + custo.polishCost + custo.packagingCost + custo.clampCost + custo.thirdPartyCost : 0;
  const sobrou = pedido.total - pedido.paymentFeeAmount - custoTotal;
  const sobrouPct = pedido.total > 0 ? (sobrou / pedido.total) * 100 : 0;

  const whatsapp = `https://wa.me/55${pedido.customerPhone.replace(/\D/g, '')}`;
  const enderecoTexto = pedido.user?.address
    ? `${pedido.user.address.street}${pedido.addressNumber ? ', ' + pedido.addressNumber : ''} · ${pedido.user.address.city}/${pedido.user.address.state} · CEP ${pedido.zip}`
    : `CEP ${pedido.zip}`;

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 18 }}>
      <Link href="/pedidos" className="adm-voltar">
        <Icon name="voltar" size={15} /> Pedidos
      </Link>

      {/* cabeçalho */}
      <div className="adm-card adm-card-pad" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="adm-h">Pedido #{10000 + pedido.id}</h1>
            <StatusPill status={pedido.status} />
            {pedido.readyFromStock ? <span style={{ fontSize: 11.5, color: 'var(--tinta-3)' }}>peça pronta de estoque</span> : null}
          </div>
          <p className="adm-sub">{dataHora(pedido.createdAt)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="adm-stat__label">Valor total</div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.01em' }}>{fmt(pedido.total)}</div>
        </div>
        <PedidoAcoes id={pedido.id} status={pedido.status} readyFromStock={pedido.readyFromStock} />
      </div>

      {/* linha do tempo */}
      <div className="adm-card adm-card-pad">
        <div className="adm-stat__label" style={{ marginBottom: 14 }}>
          Linha do tempo
        </div>
        <div className="adm-timeline">
          {fluxo.map((s, i) => {
            const ev = eventoPor.get(s);
            const feito = idxAtual >= 0 && i <= idxAtual;
            return (
              <div key={s} className={'adm-timeline-step' + (feito ? ' is-done' : '') + (i === idxAtual ? ' is-current' : '')}>
                <span className="adm-timeline-dot" />
                <span className="adm-timeline-label">{STATUS_LABEL[s]}</span>
                <span className="adm-timeline-time">{ev ? `${ev.at.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} · ${ev.at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '—'}</span>
                {ev ? <span className="adm-timeline-time">{ev.by}</span> : null}
              </div>
            );
          })}
        </div>
        {pedido.status === 'cancelado' ? <p style={{ color: 'var(--acento)', fontSize: 13, marginTop: 12 }}>Pedido cancelado{pedido.canceledAt ? ` em ${dataHora(pedido.canceledAt)}` : ''}.</p> : null}
      </div>

      <div className="adm-grid-2" style={{ ...({ '--cols': '1.3fr .7fr' } as React.CSSProperties), alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          {/* itens */}
          <div className="adm-card adm-card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="adm-stat__label">Itens do pedido</div>
              <a href={`/ficha/${pedido.id}`} target="_blank" className="erk-btn erk-btn--s erk-btn--sm" rel="noreferrer">
                <Icon name="adm_print" size={15} /> Imprimir ficha
              </a>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {pedido.items.map((it) => {
                const ficha = it.buildJson ? (JSON.parse(it.buildJson) as Record<string, string | number | null>) : null;
                return (
                  <div key={it.id} style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {it.product ? <img src={fotoUrl(it.product.photoId, 120)} alt="" width={52} height={52} style={{ borderRadius: 8, objectFit: 'cover', flex: 'none' }} /> : null}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 14 }}>{it.name}</b>
                        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--tinta-2)' }}>{it.spec}</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--tinta-3)' }}>{it.quantity}×</span>
                      <b style={{ fontSize: 14 }}>{fmt(it.unitPrice * it.quantity)}</b>
                    </div>
                    {ficha ? (
                      <div style={{ background: 'var(--fundo-3)', border: '1px solid var(--linha-2)', borderRadius: 10, padding: '12px 14px' }}>
                        <div className="adm-stat__label" style={{ marginBottom: 8 }}>
                          Ficha da oficina · sob encomenda
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px 16px', fontSize: 13 }}>
                          {Object.entries(ficha)
                            .filter(([, v]) => v !== null && v !== '' && v !== undefined)
                            .map(([k, v]) => (
                              <div key={k}>
                                <span style={{ color: 'var(--tinta-3)', textTransform: 'capitalize' }}>{k}: </span>
                                <b>{String(v)}</b>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* custo e lucro */}
          <PedidoCusto
            orderId={pedido.id}
            venda={pedido.total}
            taxa={pedido.paymentFeeAmount}
            inicial={{
              silverGrams: custo?.silverGrams ?? 0,
              silverPricePerGram: custo?.silverPricePerGram ?? 6.6,
              laborCost: custo?.laborCost ?? 0,
              polishGrams: custo?.polishGrams ?? 0,
              polishCost: custo?.polishCost ?? 0,
              packagingCost: custo?.packagingCost ?? 0,
              clampCost: custo?.clampCost ?? 0,
              thirdPartyCost: custo?.thirdPartyCost ?? 0,
            }}
          />

          {/* anotações */}
          <PedidoNotas orderId={pedido.id} notas={pedido.notes.map((n) => ({ id: n.id, texto: n.text, autor: n.author, quando: dataHora(n.createdAt) }))} />
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          {/* cliente */}
          <div className="adm-card adm-card-pad">
            <div className="adm-stat__label" style={{ marginBottom: 12 }}>
              Cliente
            </div>
            <b style={{ fontSize: 15 }}>{pedido.customerName}</b>
            <dl className="adm-kv" style={{ marginTop: 12 }}>
              <dt>WhatsApp</dt>
              <dd>{pedido.customerPhone}</dd>
              {pedido.customerCpf ? (
                <>
                  <dt>CPF</dt>
                  <dd>{pedido.customerCpf}</dd>
                </>
              ) : null}
              {stats ? (
                <>
                  <dt>Pedidos feitos</dt>
                  <dd>{stats._count._all}</dd>
                  <dt>Total gasto</dt>
                  <dd>{fmt(stats._sum.total || 0)}</dd>
                </>
              ) : null}
            </dl>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="erk-btn erk-btn--s erk-btn--full" style={{ marginTop: 14 }}>
              <Icon name="adm_whats" size={16} /> Abrir conversa
            </a>
            {pedido.userId ? (
              <Link href={`/clientes/${pedido.userId}`} className="erk-btn erk-btn--s erk-btn--full" style={{ marginTop: 8 }}>
                Ver ficha do cliente
              </Link>
            ) : null}
          </div>

          {/* entrega */}
          <div className="adm-card adm-card-pad">
            <div className="adm-stat__label" style={{ marginBottom: 12 }}>
              Entrega
            </div>
            <dl className="adm-kv">
              <dt>Modalidade</dt>
              <dd>{ENTREGA_NOME[pedido.delivery] || pedido.delivery}</dd>
              <dt>Frete</dt>
              <dd>{pedido.shipping > 0 ? fmt(pedido.shipping) : 'grátis'}</dd>
            </dl>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <p style={{ flex: 1, fontSize: 13, color: 'var(--tinta-2)', lineHeight: 1.5, margin: 0 }}>{enderecoTexto}</p>
              <CopiarBotao texto={enderecoTexto} />
            </div>
            <PedidoOndeEsta orderId={pedido.id} valor={pedido.whereIsIt} />
          </div>

          {/* pagamento */}
          <div className="adm-card adm-card-pad">
            <div className="adm-stat__label" style={{ marginBottom: 12 }}>
              Pagamento
            </div>
            <dl className="adm-kv">
              <dt>Forma</dt>
              <dd>{PAGAMENTO_NOME[pedido.payment] || pedido.payment}</dd>
              <dt>Situação</dt>
              <dd style={{ color: pedido.paymentStatus === 'pago' ? 'var(--ok)' : pedido.paymentStatus === 'estornado' ? 'var(--acento)' : 'var(--tinta-2)' }}>
                {pedido.paymentStatus === 'pago' ? 'Pago' : pedido.paymentStatus === 'estornado' ? 'Estornado' : 'Aguardando'}
              </dd>
              <dt>Valor</dt>
              <dd>{fmt(pedido.total)}</dd>
              <dt>Taxa cobrada</dt>
              <dd>{fmt(pedido.paymentFeeAmount)}</dd>
              {pedido.paymentConfirmedAt ? (
                <>
                  <dt>Confirmado em</dt>
                  <dd>{dataHora(pedido.paymentConfirmedAt)}</dd>
                </>
              ) : null}
            </dl>
            <div style={{ borderTop: '1px solid var(--linha)', marginTop: 14, paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span style={{ color: 'var(--tinta-2)' }}>Sobrou neste pedido</span>
                <b style={{ color: sobrou >= 0 ? 'var(--ok)' : 'var(--acento)' }}>
                  {fmt(sobrou)} ({sobrouPct.toFixed(1)}%)
                </b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
