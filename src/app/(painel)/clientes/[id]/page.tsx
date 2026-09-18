import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { fmt } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/admin/StatusPill';
import { CopiarBotao } from '@/components/admin/CopiarBotao';
import { relativoTexto } from '@/lib/admin/status';

export default async function ClienteDetalhePage({ params }: { params: { id: string } }) {
  const cliente = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      address: true,
      measurements: true,
      orders: { include: { items: true }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!cliente) notFound();

  const validos = cliente.orders.filter((o) => o.status !== 'cancelado');
  const totalGasto = validos.reduce((a, o) => a + o.total, 0);
  const whatsapp = `https://wa.me/55${(cliente.phone || '').replace(/\D/g, '')}`;
  const endereco = cliente.address
    ? `${cliente.address.street}${cliente.address.number ? ', ' + cliente.address.number : ''} · ${cliente.address.city}/${cliente.address.state} · CEP ${cliente.address.zip}`
    : null;

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 18 }}>
      <Link href="/clientes" className="adm-voltar">
        <Icon name="voltar" size={15} /> Clientes
      </Link>

      <div className="adm-cab" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="adm-h">{cliente.name}</h1>
          <p className="adm-sub">
            {validos.length} pedidos · {fmt(totalGasto)} no total · cliente desde {cliente.createdAt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        {cliente.phone ? (
          <a href={whatsapp} target="_blank" rel="noreferrer" className="erk-btn erk-btn--p erk-btn--sm">
            <Icon name="adm_whats" size={16} /> Abrir WhatsApp
          </a>
        ) : null}
      </div>

      <div className="adm-grid-2" style={{ ...({ '--cols': '.8fr 1.2fr' } as React.CSSProperties), alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="adm-card adm-card-pad">
            <div className="adm-stat__label" style={{ marginBottom: 12 }}>
              Contato
            </div>
            <dl className="adm-kv">
              <dt>WhatsApp</dt>
              <dd>{cliente.phone || '—'}</dd>
              <dt>E-mail</dt>
              <dd style={{ wordBreak: 'break-all' }}>{cliente.email}</dd>
              {cliente.cpf ? (
                <>
                  <dt>CPF</dt>
                  <dd>{cliente.cpf}</dd>
                </>
              ) : null}
            </dl>
            {endereco ? (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--linha)', paddingTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <p style={{ flex: 1, fontSize: 13, color: 'var(--tinta-2)', lineHeight: 1.5, margin: 0 }}>{endereco}</p>
                <CopiarBotao texto={endereco} />
              </div>
            ) : null}
          </div>

          <div className="adm-card adm-card-pad">
            <div className="adm-stat__label" style={{ marginBottom: 12 }}>
              Medidas salvas
            </div>
            {cliente.measurements ? (
              <dl className="adm-kv">
                <dt>Aro do anel</dt>
                <dd>{cliente.measurements.anelAro ?? '—'}</dd>
                <dt>Corrente</dt>
                <dd>{cliente.measurements.correnteCm ? `${cliente.measurements.correnteCm} cm` : '—'}</dd>
                <dt>Pulseira</dt>
                <dd>{cliente.measurements.pulseiraCm ? `${cliente.measurements.pulseiraCm} cm` : '—'}</dd>
                <dt>Prefere pagar com</dt>
                <dd style={{ textTransform: 'capitalize' }}>{cliente.measurements.paymentPref}</dd>
              </dl>
            ) : (
              <p style={{ fontSize: 13.5, color: 'var(--tinta-2)' }}>Nenhuma medida salva ainda. Elas aparecem quando o cliente informa no site.</p>
            )}
          </div>
        </div>

        <div className="adm-card adm-card-pad">
          <div className="adm-stat__label" style={{ marginBottom: 14 }}>
            Histórico de pedidos
          </div>
          {cliente.orders.length === 0 ? (
            <p style={{ fontSize: 13.5, color: 'var(--tinta-2)' }}>Esse cliente ainda não fez nenhum pedido.</p>
          ) : (
            <div className="adm-lista">
              {cliente.orders.map((o) => (
                <Link key={o.id} href={`/pedidos/${o.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 2px', borderBottom: '1px solid var(--linha)' }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 13.5 }}>#{10000 + o.id}</b>
                    <em style={{ display: 'block', fontStyle: 'normal', fontSize: 11.5, color: 'var(--tinta-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.items.map((i) => i.name).join(' · ')} · {relativoTexto(o.createdAt)}
                    </em>
                  </span>
                  <StatusPill status={o.status} />
                  <b style={{ fontSize: 13.5, width: 90, textAlign: 'right' }}>{fmt(o.total)}</b>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
