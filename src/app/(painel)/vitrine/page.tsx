import { prisma } from '@/lib/db';
import { fotoUrl } from '@/lib/format';
import { VitrineDestaque } from '@/components/admin/VitrineDestaque';
import { VitrineCombos } from '@/components/admin/VitrineCombos';
import { VitrineOfertas } from '@/components/admin/VitrineOfertas';
import { VitrineOrdem } from '@/components/admin/VitrineOrdem';
import { productCostTotal } from '@/lib/admin/money';

export default async function VitrinePage() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() + 7);

  const [pecas, combos, ofertas, secoes, agenda, categorias, precoPrata] = await Promise.all([
    prisma.product.findMany({ where: { status: 'published' }, orderBy: { displayOrder: 'asc' } }),
    prisma.combo.findMany({ include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.offer.findMany({ orderBy: { startAt: 'desc' } }),
    prisma.vitrineSection.findMany({ orderBy: { order: 'asc' } }),
    prisma.highlightSchedule.findMany({ where: { date: { gte: hoje, lt: fim } }, include: { product: true, combo: true }, orderBy: { date: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.silverPrice.findFirst({ orderBy: { at: 'desc' } }),
  ]);

  const grama = precoPrata?.value ?? 6.6;

  const opcoes = [
    ...pecas.map((p) => ({ tipo: 'product' as const, id: p.id, nome: p.name, preco: p.price, foto: fotoUrl(p.photoId, 300) })),
    ...combos.filter((c) => c.active).map((c) => ({ tipo: 'combo' as const, id: c.id, nome: c.name, preco: c.priceOverride, foto: c.items[0] ? fotoUrl(c.items[0].product.photoId, 300) : '' })),
  ];

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + i);
    const marcado = agenda.find((a) => a.date.getTime() === d.getTime());
    return {
      iso: d.toISOString(),
      rotulo: d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
      alvoNome: marcado ? marcado.product?.name || marcado.combo?.name || null : null,
      alvoFoto: marcado?.product ? fotoUrl(marcado.product.photoId, 200) : null,
    };
  });

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 22 }}>
      <div className="adm-cab">
        <div>
          <h1 className="adm-h">Vitrine</h1>
          <p className="adm-sub">Destaque do dia, combos, ofertas e a ordem da home do site.</p>
        </div>
      </div>

      <VitrineDestaque dias={dias} opcoes={opcoes} />

      <VitrineCombos
        combos={combos.map((c) => {
          const somaIndividual = c.items.reduce((a, i) => a + i.product.price, 0);
          const custo = c.items.reduce((a, i) => a + productCostTotal(i.product, grama), 0);
          return {
            id: c.id,
            nome: c.name,
            preco: c.priceOverride,
            ativo: c.active,
            limite: c.stockLimit,
            itens: c.items.map((i) => ({ id: i.productId, nome: i.product.name, preco: i.product.price })),
            somaIndividual,
            custo,
            foto: c.items[0] ? fotoUrl(c.items[0].product.photoId, 300) : '',
          };
        })}
        pecas={pecas.map((p) => ({ id: p.id, nome: p.name, preco: p.price, custo: productCostTotal(p, grama) }))}
      />

      <VitrineOfertas
        ofertas={ofertas.map((o) => ({
          id: o.id,
          nome: o.name,
          tipo: o.discountType,
          valor: o.discountValue,
          productId: o.productId,
          categoryId: o.categoryId,
          cupom: o.coupon,
          ativa: o.active,
          vendidos: o.soldCount,
        }))}
        pecas={pecas.map((p) => ({ id: p.id, nome: p.name }))}
        categorias={categorias.map((c) => ({ id: c.id, nome: c.name }))}
      />

      <VitrineOrdem secoes={secoes.map((s) => ({ id: s.id, ativa: s.active }))} />
    </div>
  );
}
