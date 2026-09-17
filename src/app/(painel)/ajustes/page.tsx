import Link from 'next/link';
import { prisma } from '@/lib/db';
import { fmt } from '@/lib/format';
import { AjustesLoja } from '@/components/admin/AjustesLoja';
import { AjustesEntrega } from '@/components/admin/AjustesEntrega';
import { AjustesPagamento } from '@/components/admin/AjustesPagamento';
import { AjustesPrata } from '@/components/admin/AjustesPrata';
import { DespesasFixas } from '@/components/admin/DespesasFixas';

const ABAS = [
  { id: 'loja', nome: 'Dados da loja' },
  { id: 'entrega', nome: 'Entrega e frete' },
  { id: 'pagamento', nome: 'Pagamento' },
  { id: 'prata', nome: 'Valor do grama' },
  { id: 'despesas', nome: 'Despesas fixas' },
  { id: 'usuarios', nome: 'Usuários' },
];

export default async function AjustesPage({ searchParams }: { searchParams: { aba?: string } }) {
  const aba = searchParams.aba || 'loja';

  const [settings, precos, fixas, usuarios] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 'shop' } }),
    prisma.silverPrice.findMany({ orderBy: { at: 'desc' }, take: 12 }),
    prisma.fixedExpense.findMany({ orderBy: { dayOfMonth: 'asc' } }),
    prisma.user.findMany({ where: { role: 'admin' }, orderBy: { createdAt: 'asc' } }),
  ]);

  const horas = JSON.parse(settings?.hoursJson || '[]') as { dia: string; horario: string }[];
  const zonas = JSON.parse(settings?.deliveryZonesJson || '[]') as { nome: string; valor: number; prazo: string }[];
  const formas = JSON.parse(settings?.paymentMethodsJson || '[]') as { nome: string; ativo: boolean; taxa: number }[];

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 18 }}>
      <div className="adm-cab" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="adm-h">Ajustes</h1>
          <p className="adm-sub">Dados da loja, entrega, pagamento e o que alimenta a conta do lucro.</p>
        </div>
      </div>

      <div className="adm-tabs">
        {ABAS.map((a) => (
          <Link key={a.id} href={`/ajustes?aba=${a.id}`} className={'adm-tab' + (aba === a.id ? ' is-on' : '')} style={{ textDecoration: 'none' }}>
            {a.nome}
          </Link>
        ))}
      </div>

      {aba === 'loja' ? <AjustesLoja nome={settings?.storeName || 'ERK Pratas'} horarios={horas} /> : null}
      {aba === 'entrega' ? <AjustesEntrega zonas={zonas} /> : null}
      {aba === 'pagamento' ? <AjustesPagamento formas={formas} /> : null}
      {aba === 'prata' ? <AjustesPrata atual={precos[0]?.value ?? 6.6} historico={precos.map((p) => ({ id: p.id, valor: p.value, quando: p.at.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }), quem: p.by }))} /> : null}
      {aba === 'despesas' ? <DespesasFixas despesas={fixas.map((f) => ({ id: f.id, nome: f.name, valor: f.amount, dia: f.dayOfMonth, ativa: f.active }))} /> : null}

      {aba === 'usuarios' ? (
        <div className="adm-card adm-card-pad">
          <div className="adm-stat__label" style={{ marginBottom: 4 }}>
            Quem entra no painel
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--tinta-3)', margin: '0 0 14px' }}>Só quem está nesta lista consegue abrir o painel. Os demais cadastros são de clientes da loja.</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {usuarios.map((u) => (
              <div key={u.id} className="adm-drag-row">
                <span style={{ width: 34, height: 34, borderRadius: 999, background: 'var(--fundo-3)', border: '1px solid var(--linha-2)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--tinta-2)', flex: 'none' }}>
                  {u.name.slice(0, 2).toUpperCase()}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13.5 }}>{u.name}</b>
                  <em style={{ display: 'block', fontStyle: 'normal', fontSize: 11.5, color: 'var(--tinta-3)', wordBreak: 'break-all' }}>{u.email}</em>
                </span>
                <span className="adm-pill" style={{ background: 'rgba(242,244,247,.14)', color: 'var(--tinta)' }}>
                  dono
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--tinta-3)', marginTop: 14 }}>
            Para dar acesso a outra pessoa, ela precisa ter conta na loja — depois é só marcar o cadastro dela como do painel. Fale comigo que eu ligo isso quando
            precisar.
          </p>
        </div>
      ) : null}
    </div>
  );
}
