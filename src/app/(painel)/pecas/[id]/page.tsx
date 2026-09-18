import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { fotoUrl } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { PecaDados } from '@/components/admin/PecaDados';
import { PecaMidia } from '@/components/admin/PecaMidia';
import { PecaCusto } from '@/components/admin/PecaCusto';
import { PecaFicha } from '@/components/admin/PecaFicha';

const ABAS = [
  { id: 'dados', nome: 'Dados' },
  { id: 'midia', nome: 'Mídia' },
  { id: 'custo', nome: 'Custo e preço' },
  { id: 'ficha', nome: 'Ficha 3D' },
];

export default async function PecaPage({ params, searchParams }: { params: { id: string }; searchParams: { aba?: string } }) {
  const nova = params.id === 'nova';
  const aba = nova ? 'dados' : searchParams.aba || 'dados';

  const [peca, categorias, insumos, precoPrata] = await Promise.all([
    nova ? null : prisma.product.findUnique({ where: { id: params.id }, include: { photos: { orderBy: { order: 'asc' } }, supplyUsages: true } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.supply.findMany({ orderBy: { name: 'asc' } }),
    prisma.silverPrice.findFirst({ orderBy: { at: 'desc' } }),
  ]);

  if (!nova && !peca) notFound();
  const grama = precoPrata?.value ?? 6.6;

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 18 }}>
      <Link href="/pecas" className="adm-voltar">
        <Icon name="voltar" size={15} /> Peças
      </Link>

      <div className="adm-cab" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="adm-h">{nova ? 'Nova peça' : peca!.name}</h1>
          <p className="adm-sub">{nova ? 'Comece pelos dados. Depois suba as fotos e feche o preço.' : peca!.spec}</p>
        </div>
      </div>

      {!nova ? (
        <div className="adm-tabs">
          {ABAS.map((a) => (
            <Link key={a.id} href={`/pecas/${params.id}?aba=${a.id}`} className={'adm-tab' + (aba === a.id ? ' is-on' : '')} style={{ textDecoration: 'none' }}>
              {a.nome}
            </Link>
          ))}
        </div>
      ) : null}

      {aba === 'dados' ? (
        <PecaDados
          categorias={categorias.map((c) => ({ id: c.id, nome: c.name }))}
          inicial={
            peca
              ? {
                  id: peca.id,
                  name: peca.name,
                  spec: peca.spec,
                  description: peca.description,
                  categoryId: peca.categoryId,
                  price: peca.price,
                  oldPrice: peca.oldPrice,
                  tags: JSON.parse(peca.tags || '[]') as string[],
                  stock: peca.stock,
                  status: peca.status,
                }
              : null
          }
        />
      ) : null}

      {aba === 'midia' && peca ? (
        <PecaMidia
          productId={peca.id}
          galeria={peca.photos.filter((f) => f.kind === 'gallery').map((f) => ({ id: f.id, url: f.url, capa: f.isCover }))}
          giro={peca.photos.filter((f) => f.kind === 'turntable').map((f) => ({ id: f.id, url: f.url }))}
          modelo3dStatus={peca.model3dStatus}
          modelo3dUrl={peca.model3dUrl}
          fotoFallback={fotoUrl(peca.photoId, 600)}
        />
      ) : null}

      {aba === 'custo' && peca ? (
        <PecaCusto
          productId={peca.id}
          grama={grama}
          inicial={{
            costSilverGrams: peca.costSilverGrams,
            costLaborHours: peca.costLaborHours,
            costLaborValue: peca.costLaborValue,
            costPackaging: peca.costPackaging,
            costThirdParty: peca.costThirdParty,
            price: peca.price,
          }}
          insumos={insumos.map((i) => ({ id: i.id, nome: i.name, unidade: i.unit, custoUnit: i.unitCost }))}
          usos={peca.supplyUsages.map((u) => ({ supplyId: u.supplyId, quantity: u.quantity }))}
        />
      ) : null}

      {aba === 'ficha' && peca ? (
        <PecaFicha
          productId={peca.id}
          inicial={{
            buildTipo: peca.buildTipo,
            buildElo: peca.buildElo,
            buildEsp: peca.buildEsp,
            buildMedida: peca.buildMedida,
            buildAcabamento: peca.buildAcabamento,
            buildPingente: peca.buildPingente,
            buildGravacao: peca.buildGravacao,
          }}
        />
      ) : null}
    </div>
  );
}
