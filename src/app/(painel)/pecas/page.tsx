import Link from 'next/link';
import { prisma } from '@/lib/db';
import { fotoUrl } from '@/lib/format';
import { FiltroSelect } from '@/components/admin/FiltroSelect';
import { PecasGrade, type PecaCard } from '@/components/admin/PecasGrade';
import { productCostTotal, marginPct } from '@/lib/admin/money';

export default async function PecasPage({ searchParams }: { searchParams: { categoria?: string; situacao?: string } }) {
  const categoria = searchParams.categoria || 'todas';
  const situacao = searchParams.situacao || 'todas';

  const where: any = {};
  if (categoria !== 'todas') where.categoryId = categoria;
  if (situacao !== 'todas') where.status = situacao;

  const [pecas, categorias, precoPrata] = await Promise.all([
    prisma.product.findMany({ where, include: { photos: { where: { kind: 'gallery' }, orderBy: { order: 'asc' } }, category: true }, orderBy: { displayOrder: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.silverPrice.findFirst({ orderBy: { at: 'desc' } }),
  ]);

  const grama = precoPrata?.value ?? 6.6;

  const cards: PecaCard[] = pecas.map((p) => {
    const custo = productCostTotal(p, grama);
    return {
      id: p.id,
      nome: p.name,
      spec: p.spec,
      foto: p.photos.find((f) => f.isCover)?.url || p.photos[0]?.url || fotoUrl(p.photoId, 400),
      preco: p.price,
      custo,
      margem: marginPct(p.price, custo),
      estoque: p.stock,
      situacao: p.status,
      categoria: p.category.name,
      modelo3d: p.model3dStatus,
    };
  });

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 20 }}>
      <div className="adm-cab">
        <div>
          <h1 className="adm-h">Peças</h1>
          <p className="adm-sub">{pecas.length} peças no catálogo · arraste os cartões para mudar a ordem da vitrine</p>
        </div>
        <Link href="/pecas/nova" className="erk-btn erk-btn--p">
          + Nova peça
        </Link>
      </div>

      <div className="adm-filtros">
        <FiltroSelect
          rotulo="Categoria"
          valor={categoria}
          opcoes={[{ id: 'todas', nome: 'Todas as categorias' }, ...categorias.map((c) => ({ id: c.id, nome: c.name }))].map((c) => {
            const params = new URLSearchParams();
            if (c.id !== 'todas') params.set('categoria', c.id);
            if (situacao !== 'todas') params.set('situacao', situacao);
            const qs = params.toString();
            return { valor: c.id, nome: c.nome, href: `/pecas${qs ? '?' + qs : ''}` };
          })}
        />
        <FiltroSelect
          rotulo="Situação"
          valor={situacao}
          opcoes={[
            { id: 'todas', nome: 'Todas' },
            { id: 'published', nome: 'Publicadas' },
            { id: 'draft', nome: 'Rascunho' },
            { id: 'soldout', nome: 'Esgotadas' },
          ].map((sit) => {
            const params = new URLSearchParams();
            if (categoria !== 'todas') params.set('categoria', categoria);
            if (sit.id !== 'todas') params.set('situacao', sit.id);
            const qs = params.toString();
            return { valor: sit.id, nome: sit.nome, href: `/pecas${qs ? '?' + qs : ''}` };
          })}
        />
      </div>

      <PecasGrade cards={cards} podeReordenar={categoria === 'todas' && situacao === 'todas'} />
    </div>
  );
}
