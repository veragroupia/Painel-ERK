import { prisma } from '@/lib/db';
import { AvaliacoesLista, type AvaliacaoLinha } from '@/components/admin/AvaliacoesLista';
import { Estrelas } from '@/components/admin/AvaliacoesEstrelas';

export const dynamic = 'force-dynamic';

export default async function AvaliacoesPage({ searchParams }: { searchParams: { nota?: string } }) {
  const filtro = parseInt(searchParams.nota || '', 10);
  const temFiltro = filtro >= 1 && filtro <= 5;

  const [linhas, porNota] = await Promise.all([
    prisma.review.findMany({
      where: temFiltro ? { rating: filtro } : undefined,
      include: { product: { select: { id: true, name: true } }, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.review.groupBy({ by: ['rating'], _count: { rating: true } }),
  ]);

  const total = porNota.reduce((a, l) => a + l._count.rating, 0);
  const soma = porNota.reduce((a, l) => a + l.rating * l._count.rating, 0);
  const media = total ? soma / total : 0;
  const contagem = (n: number) => porNota.find((l) => l.rating === n)?._count.rating ?? 0;
  const baixas = contagem(1) + contagem(2);

  const dados: AvaliacaoLinha[] = linhas.map((r) => ({
    id: r.id,
    nota: r.rating,
    comentario: r.comment,
    autor: r.user.name,
    email: r.user.email,
    data: r.createdAt.toISOString(),
    pecaId: r.product.id,
    pecaNome: r.product.name,
    pedidoId: r.orderId,
  }));

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 20 }}>
      <div className="adm-cab">
        <div>
          <h1 className="adm-h">Avaliações</h1>
          <p className="adm-sub">O que os clientes escreveram sobre as peças. Só quem comprou consegue avaliar.</p>
        </div>
      </div>

      <div className="adm-stats adm-stats--3">
        <div className="adm-stat">
          <div className="adm-stat__label">Nota média da loja</div>
          <div className="adm-stat__value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {total ? media.toFixed(1).replace('.', ',') : '—'}
            {total ? <Estrelas nota={media} tamanho={16} /> : null}
          </div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">Depoimentos recebidos</div>
          <div className="adm-stat__value">{total}</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat__label">Notas 1 e 2 estrelas</div>
          <div className="adm-stat__value">{baixas}</div>
          <div style={{ fontSize: 12.5, color: 'var(--tinta-3)', marginTop: 6 }}>
            {baixas ? 'vale ler e responder ao cliente' : 'nenhuma até agora'}
          </div>
        </div>
      </div>

      <div className="adm-tabs">
        <a className={'adm-tab' + (!temFiltro ? ' is-on' : '')} href="/avaliacoes">
          Todas {total ? `(${total})` : ''}
        </a>
        {([5, 4, 3, 2, 1] as const).map((n) => (
          <a key={n} className={'adm-tab' + (filtro === n ? ' is-on' : '')} href={`/avaliacoes?nota=${n}`}>
            {n} estrela{n > 1 ? 's' : ''} ({contagem(n)})
          </a>
        ))}
      </div>

      <AvaliacoesLista linhas={dados} />
    </div>
  );
}
