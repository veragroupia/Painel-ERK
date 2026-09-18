import Link from 'next/link';
import { prisma } from '@/lib/db';
import { fotoUrl } from '@/lib/format';
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
          <p className="adm-sub">{pecas.length} peças no catálogo · mude a ordem para mudar a vitrine</p>
        </div>
        <Link href="/pecas/nova" className="erk-btn erk-btn--p">
          + Nova peça
        </Link>
      </div>

      <div className="adm-chips">
        <Link href="/pecas" className={'erk-chip' + (categoria === 'todas' && situacao === 'todas' ? ' is-on' : '')} style={{ textDecoration: 'none' }}>
          Todas
        </Link>
        {categorias.map((c) => (
          <Link key={c.id} href={`/pecas?categoria=${c.id}`} className={'erk-chip' + (categoria === c.id ? ' is-on' : '')} style={{ textDecoration: 'none' }}>
            {c.name}
          </Link>
        ))}
        {[
          { id: 'published', nome: 'Publicadas' },
          { id: 'draft', nome: 'Rascunho' },
          { id: 'soldout', nome: 'Esgotadas' },
        ].map((s) => (
          <Link key={s.id} href={`/pecas?situacao=${s.id}`} className={'erk-chip' + (situacao === s.id ? ' is-on' : '')} style={{ textDecoration: 'none' }}>
            {s.nome}
          </Link>
        ))}
      </div>

      <PecasGrade cards={cards} podeReordenar={categoria === 'todas' && situacao === 'todas'} />
    </div>
  );
}
