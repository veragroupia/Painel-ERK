import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATS, PRODS } from './seed-data';
import {
  ADMIN_EMAIL,
  ADMIN_SENHA_PADRAO,
  SUPPLIES,
  SUPPLY_PURCHASES,
  SUPPLY_CONSUMPTIONS,
  COMBOS,
  OFFERS,
  VITRINE_SECTIONS,
  MONTADOR_STEP_OPTIONS,
  FIXED_EXPENSES,
  SETTINGS_SEED,
} from './admin-seed-data';

const prisma = new PrismaClient();

// gerador determinístico — mesma massa de dados a cada `db:seed`
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260917);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;

function daysAgo(n: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const LABOR_RATE = 45; // valor/hora padrão
const PACKAGING_COST = 4.5;
const SILVER_PRICE = 6.6;

// margem-alvo por peça, sobre o preço de venda já definido no catálogo
// (os preços do catálogo são os que o site já usa — o custo é calculado
// a partir deles, não o contrário). A maioria fica saudável (38–48%);
// duas peças ficam de propósito com margem amarela/vermelha, pra prancha
// de Peças mostrar as três cores da etiqueta.
const MARGEM_ALVO: Record<string, number> = {
  p05: 0.14, // corrente baiana — margem vermelha
  p15: 0.27, // conjunto casal — margem amarela
};

/** custo de uma peça a partir do preço de venda e de uma margem-alvo,
    repartido em prata / mão de obra / embalagem de um jeito plausível. */
function custoDaPeca(preco: number, seedId: string) {
  const margem = MARGEM_ALVO[seedId] ?? 0.38 + rnd() * 0.1; // 38–48% por padrão
  const custoTotal = preco * (1 - margem);
  const packagingCost = PACKAGING_COST;
  const laborValue = Number((custoTotal * 0.22).toFixed(2));
  const restante = Math.max(5, custoTotal - packagingCost - laborValue);
  const silverGrams = Number((restante / SILVER_PRICE).toFixed(1));
  return { silverGrams, laborHours: Number((laborValue / LABOR_RATE).toFixed(2)), laborValue, packagingCost, thirdParty: 0, custoTotal };
}

/** mesma margem-alvo de custoDaPeca, mas repartida como a tela de Pedido
    detalha (prata / mão de obra / polimento / embalagem / fecho e argolas). */
function custoDoItemNoPedido(preco: number, seedId: string) {
  const margem = MARGEM_ALVO[seedId] ?? 0.38 + rnd() * 0.1;
  const custoTotal = preco * (1 - margem);
  const packagingCost = PACKAGING_COST;
  const clampCost = 3;
  const laborCost = Number((custoTotal * 0.2).toFixed(2));
  const polishCost = Number((custoTotal * 0.03).toFixed(2));
  const restante = Math.max(5, custoTotal - packagingCost - clampCost - laborCost - polishCost);
  const silverGrams = Number((restante / SILVER_PRICE).toFixed(1));
  return { silverGrams, laborCost, polishCost, packagingCost, clampCost };
}

const STATUS_FLOW = ['novo', 'pago', 'producao', 'polimento', 'embalado', 'enviado', 'entregue'];
const STATUS_FLOW_PRONTA = ['novo', 'pago', 'embalado', 'enviado', 'entregue'];
const ENTREGA_NOME: Record<string, number> = { motoboy: 0, correios: 22, retirada: 0 };
const PAGAMENTO_TAXA: Record<string, number> = { pix: 0, credito: 0.042, whats: 0 };

function statusEventsFor(finalStatus: string, readyFromStock: boolean, endAt: Date, spreadHours: number) {
  const flow = readyFromStock ? STATUS_FLOW_PRONTA : STATUS_FLOW;
  const idx = flow.indexOf(finalStatus);
  const steps = idx === -1 ? [finalStatus] : flow.slice(0, idx + 1);
  return steps.map((status, i) => ({
    status,
    at: new Date(endAt.getTime() - (steps.length - 1 - i) * spreadHours * 3600 * 1000),
  }));
}

async function seedCategoriesAndProducts() {
  for (const c of CATS) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: { name: c.nome, iconName: c.icone, photoId: c.fid },
      create: { id: c.id, name: c.nome, iconName: c.icone, photoId: c.fid },
    });
  }

  const modelo3dPendente = new Set(['p04', 'p12']);
  const giroPronto = new Set(['p01', 'p04', 'p06', 'p12']);
  const rascunho = new Set(['p16']);
  const esgotada = new Set(['p08']);

  // Catálogo de partida só entra em banco vazio. Com catálogo existente, o seed
  // apenas completa os campos do painel — senão uma peça excluída pelo dono
  // voltaria do além a cada deploy.
  const catalogoVazio = (await prisma.product.count()) === 0;

  for (const [i, p] of PRODS.entries()) {
    const d3 = p.d3 as any;
    const preco = parseFloat(p.p.replace(/\./g, '').replace(',', '.'));
    const custo = custoDaPeca(preco, p.id);
    const status = esgotada.has(p.id) ? 'soldout' : rascunho.has(p.id) ? 'draft' : 'published';

    if (catalogoVazio)
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.n,
        spec: p.s,
        description: `${p.n} em prata 925 legítima, com punção gravado e garantia vitalícia. Feita na oficina própria da ERK Pratas, em Salto (SP).`,
        categoryId: p.c,
        price: preco,
        oldPrice: p.a ? parseFloat(p.a.replace(/\./g, '').replace(',', '.')) : null,
        photoId: p.fid,
        tags: JSON.stringify(p.tags),
        stock: esgotada.has(p.id) ? 0 : int(3, 24),
        status,
        displayOrder: i,
        costSilverGrams: custo.silverGrams,
        costLaborHours: custo.laborHours,
        costLaborValue: custo.laborValue,
        costPackaging: custo.packagingCost,
        costThirdParty: custo.thirdParty,
        model3dStatus: modelo3dPendente.has(p.id) ? 'pending' : 'none',
        turntableStatus: giroPronto.has(p.id) || modelo3dPendente.has(p.id) ? 'ready' : 'none',
        buildTipo: d3.tipo,
        buildElo: d3.elo ?? null,
        buildEsp: d3.esp,
        buildMedida: d3.medida ?? null,
        buildAcabamento: 'polido',
        buildPingente: d3.pingente ?? null,
        buildSinete: !!d3.sinete,
        buildGravacao: d3.gravacao ?? null,
        photos: {
          create: [
            { url: `https://images.pexels.com/photos/${p.fid}/pexels-photo-${p.fid}.jpeg?auto=compress&cs=tinysrgb&w=800`, kind: 'gallery', order: 0, isCover: true },
            ...(giroPronto.has(p.id) || modelo3dPendente.has(p.id)
              ? Array.from({ length: 24 }, (_, f) => ({
                  url: `https://images.pexels.com/photos/${p.fid}/pexels-photo-${p.fid}.jpeg?auto=compress&cs=tinysrgb&w=600`,
                  kind: 'turntable',
                  order: f,
                  isCover: false,
                }))
              : []),
          ],
        },
      },
    });

    // backfill: peça que já existia no banco antes do painel
    const existente = await prisma.product.findUnique({ where: { id: p.id }, include: { photos: true } });
    if (existente && existente.costSilverGrams === 0 && existente.costLaborValue === 0) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          description: existente.description || `${p.n} em prata 925 legítima, com punção gravado e garantia vitalícia. Feita na oficina própria da ERK Pratas, em Salto (SP).`,
          stock: existente.stock || (esgotada.has(p.id) ? 0 : int(3, 24)),
          status: esgotada.has(p.id) ? 'soldout' : rascunho.has(p.id) ? 'draft' : existente.status,
          displayOrder: existente.displayOrder || i,
          costSilverGrams: custo.silverGrams,
          costLaborHours: custo.laborHours,
          costLaborValue: custo.laborValue,
          costPackaging: custo.packagingCost,
          costThirdParty: custo.thirdParty,
          buildAcabamento: existente.buildAcabamento ?? 'polido',
          model3dStatus: modelo3dPendente.has(p.id) ? 'pending' : existente.model3dStatus,
          turntableStatus: giroPronto.has(p.id) || modelo3dPendente.has(p.id) ? 'ready' : existente.turntableStatus,
        },
      });
    }
    if (existente && existente.photos.length === 0) {
      await prisma.productPhoto.create({
        data: { productId: p.id, url: `https://images.pexels.com/photos/${p.fid}/pexels-photo-${p.fid}.jpeg?auto=compress&cs=tinysrgb&w=800`, kind: 'gallery', order: 0, isCover: true },
      });
    }
  }
}

/** Pedidos criados antes do painel: normaliza o status antigo ("preparo"),
    cria a linha do tempo que faltava e o bloco de custo, para que a tela de
    Pedidos funcione sobre o histórico que já está no banco. */
async function backfillPedidosLegados() {
  const legados = await prisma.order.findMany({
    where: { OR: [{ status: 'preparo' }, { statusEvents: { none: {} } }] },
    include: { statusEvents: true, items: { include: { product: true } }, cost: true },
  });

  for (const o of legados) {
    const status = o.status === 'preparo' ? 'producao' : o.status;
    const paga = status !== 'novo' && status !== 'cancelado';

    if (o.statusEvents.length === 0) {
      const flow = o.readyFromStock ? STATUS_FLOW_PRONTA : STATUS_FLOW;
      const idx = flow.indexOf(status);
      const passos = idx === -1 ? [status] : flow.slice(0, idx + 1);
      await prisma.orderStatusEvent.createMany({
        data: passos.map((s, i) => ({
          orderId: o.id,
          status: s,
          // distribui os passos entre a criação do pedido e agora
          at: new Date(o.createdAt.getTime() + i * 3600 * 1000),
          by: 'Sistema',
        })),
      });
    }

    if (!o.cost && paga) {
      const custos = o.items.map((it) => custoDoItemNoPedido(it.unitPrice, it.productId ?? ''));
      const soma = (k: 'silverGrams' | 'laborCost' | 'polishCost' | 'packagingCost' | 'clampCost') => Number(custos.reduce((a, c) => a + c[k], 0).toFixed(2));
      await prisma.orderCost.create({
        data: {
          orderId: o.id,
          silverGrams: soma('silverGrams'),
          silverPricePerGram: SILVER_PRICE,
          laborCost: soma('laborCost'),
          polishGrams: Number((soma('silverGrams') * 0.19).toFixed(1)),
          polishCost: soma('polishCost'),
          packagingCost: soma('packagingCost'),
          clampCost: soma('clampCost'),
          thirdPartyCost: 0,
        },
      });
    }

    await prisma.order.update({
      where: { id: o.id },
      data: {
        status,
        paymentStatus: o.paymentStatus === 'pendente' && paga ? 'pago' : o.paymentStatus,
        paymentConfirmedAt: o.paymentConfirmedAt ?? (paga ? o.createdAt : null),
      },
    });
  }

  if (legados.length > 0) console.log(`Backfill: ${legados.length} pedido(s) antigos ajustados para o painel.`);
}

async function seedUsersAndOrders() {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    await prisma.user.create({
      data: { name: 'Dono da loja', email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_SENHA_PADRAO, 10), role: 'admin', phone: '(11) 91112-4875' },
    });
  }

  // Cliente e pedido de mentira só quando pedido explicitamente (ambiente local).
  // Em produção o painel nunca inventa dado: mostra o que a loja realmente vendeu.
  if (process.env.SEED_DEMO !== '1') return;

  const CLIENTES = [
    { nome: 'Ana Ribeiro', email: 'ana.ribeiro@email.com', tel: '(11) 91112-4875', cidade: 'Salto', anel: 18, corrente: 60, pulseira: 21 },
    { nome: 'Bruno Castilho', email: 'bruno.castilho@email.com', tel: '(11) 98221-3390', cidade: 'Itu', anel: 22, corrente: 50, pulseira: 23 },
    { nome: 'Camila Duarte', email: 'camila.duarte@email.com', tel: '(11) 97744-1082', cidade: 'Indaiatuba', anel: 16, corrente: 45, pulseira: 18 },
    { nome: 'Diego Farias', email: 'diego.farias@email.com', tel: '(15) 99122-6650', cidade: 'Salto', anel: 20, corrente: 60, pulseira: 21 },
    { nome: 'Estela Moraes', email: 'estela.moraes@email.com', tel: '(11) 96633-0142', cidade: 'Cabreúva', anel: 17, corrente: 45, pulseira: 18 },
    { nome: 'Felipe Nogueira', email: 'felipe.nogueira@email.com', tel: '(11) 95511-7823', cidade: 'Salto', anel: 21, corrente: 70, pulseira: 23 },
  ];

  const clientes: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const c of CLIENTES) {
    let u = await prisma.user.findUnique({ where: { email: c.email } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          name: c.nome,
          email: c.email,
          passwordHash: await bcrypt.hash('erkpratas123', 10),
          phone: c.tel,
          cpf: `${int(100, 999)}.${int(100, 999)}.${int(100, 999)}-${int(10, 99)}`,
          address: { create: { street: `Rua das Flores, ${int(10, 900)}`, city: c.cidade, state: 'SP', zip: '13320-140', preference: 'motoboy' } },
          measurements: { create: { anelAro: c.anel, correnteCm: c.corrente, pulseiraCm: c.pulseira, paymentPref: 'pix' } },
        },
      });
    }
    clientes.push(u);
  }

  const jaTemPedidos = await prisma.order.count();
  if (jaTemPedidos > 0) return; // seed de pedidos já rodou

  const produtoPorId = (id: string) => PRODS.find((p) => p.id === id)!;
  const encomendaIds = new Set(PRODS.filter((p) => (p.d3 as any).sinete || (p.d3 as any).gravacao).map((p) => p.id));

  async function criarPedido(opts: {
    cliente?: (typeof clientes)[number];
    itemIds: string[];
    delivery: 'motoboy' | 'correios' | 'retirada';
    payment: 'pix' | 'credito' | 'whats';
    status: string;
    readyFromStock?: boolean;
    endAt: Date;
    spreadHours?: number;
    whereIsIt?: string;
    forcarParado?: boolean;
  }) {
    const items = opts.itemIds.map((id) => produtoPorId(id));
    const subtotal = items.reduce((a, p) => a + parseFloat(p.p.replace(/\./g, '').replace(',', '.')), 0);
    const shipping = ENTREGA_NOME[opts.delivery];
    const total = subtotal + shipping;
    const taxa = Math.round(total * (PAGAMENTO_TAXA[opts.payment] || 0) * 100) / 100;
    const readyFromStock = !!opts.readyFromStock;
    const events = statusEventsFor(opts.status, readyFromStock, opts.endAt, opts.spreadHours ?? 20);
    const paga = opts.status !== 'novo' && opts.status !== 'cancelado';

    const order = await prisma.order.create({
      data: {
        userId: opts.cliente?.id,
        status: opts.status,
        readyFromStock,
        customerName: opts.cliente?.name ?? pick(['Gustavo Prado', 'Helena Vidal', 'Igor Salviano', 'Júlia Matos']),
        customerPhone: opts.cliente?.phone ?? '(11) 9' + int(1000, 9999) + '-' + int(1000, 9999),
        zip: '13320-140',
        delivery: opts.delivery,
        whereIsIt: opts.whereIsIt ?? '',
        payment: opts.payment,
        paymentStatus: paga ? 'pago' : 'pendente',
        paymentFeeAmount: paga ? taxa : 0,
        paymentConfirmedAt: paga ? events.find((e) => e.status === 'pago')?.at : null,
        subtotal,
        shipping,
        total,
        createdAt: events[0].at,
        items: {
          create: items.map((p) => {
            const d3 = p.d3 as any;
            const isEncomenda = encomendaIds.has(p.id);
            return {
              productId: p.id,
              name: p.n,
              spec: p.s,
              quantity: 1,
              unitPrice: parseFloat(p.p.replace(/\./g, '').replace(',', '.')),
              buildJson: isEncomenda
                ? JSON.stringify({ tipo: d3.tipo, elo: d3.elo, esp: d3.esp, medida: d3.medida, acabamento: 'polido', gravacao: d3.gravacao })
                : null,
            };
          }),
        },
        statusEvents: { create: events.map((e) => ({ status: e.status, at: e.at, by: 'Dono' })) },
        notes: opts.status === 'pago' || opts.status === 'producao' ? { create: [{ text: 'Cliente confirmou pelo WhatsApp.', author: 'Dono', createdAt: events[events.length - 1].at }] } : undefined,
        cost: paga
          ? {
              create: (() => {
                const custos = items.map((p) => custoDoItemNoPedido(parseFloat(p.p.replace(/\./g, '').replace(',', '.')), p.id));
                const soma = (k: 'silverGrams' | 'laborCost' | 'polishCost' | 'packagingCost' | 'clampCost') => Number(custos.reduce((a, c) => a + c[k], 0).toFixed(2));
                return {
                  silverGrams: soma('silverGrams'),
                  silverPricePerGram: SILVER_PRICE,
                  laborCost: soma('laborCost'),
                  polishGrams: Number((soma('silverGrams') * 0.19).toFixed(1)),
                  polishCost: soma('polishCost'),
                  packagingCost: soma('packagingCost'),
                  clampCost: soma('clampCost'),
                  thirdPartyCost: 0,
                };
              })(),
            }
          : undefined,
      },
    });
    return order;
  }

  // ---- cenários explícitos do brief ("precisa de você") ----
  await criarPedido({ cliente: clientes[0], itemIds: ['p01'], delivery: 'motoboy', payment: 'pix', status: 'pago', endAt: daysAgo(1, 11) });
  await criarPedido({ cliente: clientes[1], itemIds: ['p10'], delivery: 'retirada', payment: 'pix', status: 'pago', endAt: daysAgo(1, 15) });
  await criarPedido({ cliente: clientes[2], itemIds: ['p06', 'p11'], delivery: 'correios', payment: 'credito', status: 'pago', endAt: daysAgo(0, 9) });

  await criarPedido({ cliente: clientes[3], itemIds: ['p13'], delivery: 'motoboy', payment: 'pix', status: 'embalado', readyFromStock: true, endAt: daysAgo(0, 8), whereIsIt: 'embalado, no balcão' });
  await criarPedido({ cliente: clientes[4], itemIds: ['p14'], delivery: 'correios', payment: 'pix', status: 'embalado', readyFromStock: true, endAt: daysAgo(0, 10), whereIsIt: 'embalado, no balcão' });

  // parado há mais de 3 dias no mesmo status — o "vermelho" da lista
  await criarPedido({ cliente: clientes[5], itemIds: ['p02'], delivery: 'motoboy', payment: 'whats', status: 'producao', endAt: daysAgo(4, 9), spreadHours: 6, whereIsIt: 'na bancada' });

  // pedido "novo", ainda não pago
  await criarPedido({ cliente: clientes[0], itemIds: ['p09'], delivery: 'retirada', payment: 'pix', status: 'novo', endAt: daysAgo(0, 16) });

  // pedido cancelado
  await criarPedido({ cliente: clientes[2], itemIds: ['p04'], delivery: 'correios', payment: 'credito', status: 'cancelado', endAt: daysAgo(5, 12) });

  // ---- volume geral: mês atual (dashboard/gráfico do mês) ----
  for (let d = 0; d < 17; d++) {
    const nPedidos = d % 7 === 0 ? 0 : int(2, 5); // dias sem venda aparecem vazios de propósito
    for (let k = 0; k < nPedidos; k++) {
      const nItens = rnd() < 0.25 ? 2 : 1;
      const itemIds = Array.from({ length: nItens }, () => pick(PRODS).id);
      // pedidos recentes ainda estão em andamento; pedidos mais antigos já foram
      // concluídos — só os cenários explícitos acima ficam "parados" de propósito
      const status = d < 3 ? pick(['novo', 'pago', 'producao', 'polimento', 'embalado', 'enviado']) : rnd() < 0.94 ? 'entregue' : 'cancelado';
      await criarPedido({
        cliente: rnd() < 0.7 ? pick(clientes) : undefined,
        itemIds,
        delivery: pick(['motoboy', 'correios', 'retirada'] as const),
        payment: pick(['pix', 'credito', 'whats'] as const),
        status,
        readyFromStock: rnd() < 0.3,
        endAt: daysAgo(d, int(9, 19)),
      });
    }
  }

  // ---- volume dos dois meses anteriores (gráfico de 12 meses do Financeiro) ----
  for (const baseDias of [45, 75]) {
    for (let k = 0; k < 28; k++) {
      const itemIds = Array.from({ length: rnd() < 0.2 ? 2 : 1 }, () => pick(PRODS).id);
      await criarPedido({
        cliente: rnd() < 0.7 ? pick(clientes) : undefined,
        itemIds,
        delivery: pick(['motoboy', 'correios', 'retirada'] as const),
        payment: pick(['pix', 'credito', 'whats'] as const),
        status: 'entregue',
        readyFromStock: rnd() < 0.3,
        endAt: daysAgo(baseDias + int(-10, 10), int(9, 19)),
      });
    }
  }
}

async function seedSupplies() {
  const existentes = await prisma.supply.count();
  if (existentes > 0) return;
  for (const s of SUPPLIES) await prisma.supply.create({ data: s });
  for (const p of SUPPLY_PURCHASES) await prisma.supplyPurchase.create({ data: { supplyId: p.supplyId, supplier: p.supplier, quantity: p.quantity, totalPaid: p.totalPaid, date: daysAgo(p.daysAgo) } });
  for (const c of SUPPLY_CONSUMPTIONS) await prisma.supplyConsumption.create({ data: { supplyId: c.supplyId, quantity: c.quantity, productName: c.productName, date: daysAgo(c.daysAgo) } });
}

async function seedVitrine() {
  const existentes = await prisma.combo.count();
  if (existentes === 0) {
    for (const c of COMBOS) {
      await prisma.combo.create({
        data: {
          id: c.id,
          name: c.name,
          priceOverride: c.priceOverride,
          stockLimit: c.stockLimit ?? null,
          createdAt: daysAgo(int(3, 20)),
          items: { create: c.productIds.map((pid) => ({ productId: pid, quantity: 1 })) },
        },
      });
    }
  }

  const jaTemOfertas = await prisma.offer.count();
  if (jaTemOfertas === 0) {
    for (const o of OFFERS) {
      await prisma.offer.create({
        data: {
          id: o.id,
          name: o.name,
          discountType: o.discountType,
          discountValue: o.discountValue,
          productId: (o as any).productId ?? null,
          categoryId: (o as any).categoryId ?? null,
          coupon: o.coupon ?? null,
          soldCount: o.soldCount,
          startAt: daysAgo(o.daysActive),
        },
      });
    }
  }

  for (const s of VITRINE_SECTIONS) await prisma.vitrineSection.upsert({ where: { id: s.id }, update: { order: s.order }, create: { id: s.id, order: s.order } });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const destaques = [
    { offset: 0, productId: 'p01' },
    { offset: 1, productId: 'p06' },
    { offset: 2, comboId: 'combo-casal' },
    { offset: 3, productId: 'p10' },
    { offset: 4, productId: 'p14' },
    { offset: 5, comboId: 'combo-presente' },
    { offset: 6, productId: 'p15' },
  ];
  for (const d of destaques) {
    const date = new Date(hoje);
    date.setDate(date.getDate() + d.offset);
    await prisma.highlightSchedule.upsert({
      where: { date },
      update: {},
      create: { date, targetType: d.comboId ? 'combo' : 'product', productId: d.productId, comboId: d.comboId },
    });
  }
}

async function seedMontador() {
  const existentes = await prisma.montadorOption.count();
  if (existentes === 0) {
    for (const o of MONTADOR_STEP_OPTIONS) await prisma.montadorOption.create({ data: { step: o.step, name: o.name, description: o.description, order: o.order } });
  }

  const jaTemPesos = await prisma.montadorWeight.count();
  if (jaTemPesos === 0) {
    const elos = ['cubano', 'grumet', 'veneziana', 'cartier', 'baiana'];
    const espessuras = [2.5, 3, 4, 5, 6, 8];
    const medidasCorrente = [45, 50, 60, 70];
    const medidasPulseira = [18, 21, 23];
    const linhas: { elo: string; espessura: number; medida: number; grams: number }[] = [];
    for (const elo of elos) {
      for (const esp of espessuras) {
        for (const medida of medidasCorrente) linhas.push({ elo, espessura: esp, medida, grams: Number((medida * esp * esp * 0.031).toFixed(1)) });
        for (const medida of medidasPulseira) linhas.push({ elo, espessura: esp, medida, grams: Number((medida * esp * esp * 0.031).toFixed(1)) });
      }
    }
    for (const linha of linhas) await prisma.montadorWeight.create({ data: linha });
  }
}

async function seedFinanceiro() {
  const jaTemPreco = await prisma.silverPrice.count();
  if (jaTemPreco === 0) {
    const historico = [5.8, 6.0, 6.1, 6.3, 6.4, 6.6];
    for (const [i, valor] of historico.entries()) {
      await prisma.silverPrice.create({ data: { value: valor, at: daysAgo((historico.length - 1 - i) * 14 + 2), by: 'Dono' } });
    }
  }

  const jaTemDespesas = await prisma.fixedExpense.count();
  if (jaTemDespesas === 0) {
    for (const e of FIXED_EXPENSES) await prisma.fixedExpense.create({ data: e });
  }

  const settings = await prisma.settings.findUnique({ where: { id: 'shop' } });
  if (!settings) {
    await prisma.settings.create({
      data: {
        id: 'shop',
        storeName: SETTINGS_SEED.storeName,
        hoursJson: JSON.stringify(SETTINGS_SEED.hours),
        deliveryZonesJson: JSON.stringify(SETTINGS_SEED.deliveryZones),
        paymentMethodsJson: JSON.stringify(SETTINGS_SEED.paymentMethods),
        laborRatePerHour: LABOR_RATE,
        laborMultiplier: 1,
        gravacaoSurcharge: 15,
      },
    });
  }
}

async function main() {
  await seedCategoriesAndProducts();
  await seedUsersAndOrders();
  await backfillPedidosLegados();
  await seedSupplies();
  await seedVitrine();
  await seedMontador();
  await seedFinanceiro();
  console.log('Seed concluído: catálogo, painel administrativo (pedidos, insumos, vitrine, montador, financeiro) prontos.');
  console.log(`Login do painel: ${ADMIN_EMAIL} / ${ADMIN_SENHA_PADRAO}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
