'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from './guard';

export type DadosPeca = {
  id?: string;
  name: string;
  spec: string;
  description: string;
  categoryId: string;
  price: number;
  oldPrice: number | null;
  tags: string[];
  stock: number;
  status: string;
};

function slug(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export async function salvarDadosPeca(dados: DadosPeca) {
  await requireAdmin();
  const comum = {
    name: dados.name.trim(),
    spec: dados.spec.trim(),
    description: dados.description.trim(),
    categoryId: dados.categoryId,
    price: Math.max(0, dados.price),
    oldPrice: dados.oldPrice && dados.oldPrice > 0 ? dados.oldPrice : null,
    tags: JSON.stringify(dados.tags),
    stock: Math.max(0, Math.round(dados.stock)),
    status: dados.status,
  };

  if (dados.id) {
    await prisma.product.update({ where: { id: dados.id }, data: comum });
    revalidatePath('/pecas');
    revalidatePath(`/pecas/${dados.id}`);
    return dados.id;
  }

  const base = slug(dados.name) || 'peca';
  let id = base;
  for (let i = 2; await prisma.product.findUnique({ where: { id } }); i++) id = `${base}-${i}`;
  const ultimo = await prisma.product.aggregate({ _max: { displayOrder: true } });

  await prisma.product.create({
    data: {
      id,
      ...comum,
      photoId: 16124761,
      displayOrder: (ultimo._max.displayOrder ?? 0) + 1,
      buildTipo: 'corrente',
      buildEsp: 4,
      buildAcabamento: 'polido',
    },
  });
  revalidatePath('/pecas');
  redirect(`/pecas/${id}?aba=midia`);
}

export type CustoPeca = {
  costSilverGrams: number;
  costLaborHours: number;
  costLaborValue: number;
  costPackaging: number;
  costThirdParty: number;
  price: number;
};

export async function salvarCustoPeca(id: string, dados: CustoPeca) {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: {
      costSilverGrams: Math.max(0, dados.costSilverGrams),
      costLaborHours: Math.max(0, dados.costLaborHours),
      costLaborValue: Math.max(0, dados.costLaborValue),
      costPackaging: Math.max(0, dados.costPackaging),
      costThirdParty: Math.max(0, dados.costThirdParty),
      price: Math.max(0, dados.price),
    },
  });
  revalidatePath(`/pecas/${id}`);
  revalidatePath('/pecas');
}

export async function salvarInsumosDaPeca(id: string, usos: { supplyId: string; quantity: number }[]) {
  await requireAdmin();
  await prisma.$transaction([
    prisma.productSupplyUsage.deleteMany({ where: { productId: id } }),
    prisma.productSupplyUsage.createMany({ data: usos.filter((u) => u.supplyId && u.quantity > 0).map((u) => ({ productId: id, supplyId: u.supplyId, quantity: u.quantity })) }),
  ]);
  revalidatePath(`/pecas/${id}`);
}

export type FichaPeca = {
  buildTipo: string;
  buildElo: string | null;
  buildEsp: number;
  buildMedida: number | null;
  buildAcabamento: string | null;
  buildPingente: string | null;
  buildGravacao: string | null;
};

export async function salvarFichaPeca(id: string, dados: FichaPeca) {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: {
      buildTipo: dados.buildTipo,
      buildElo: dados.buildElo || null,
      buildEsp: dados.buildEsp,
      buildMedida: dados.buildMedida,
      buildAcabamento: dados.buildAcabamento || 'polido',
      buildPingente: dados.buildPingente || null,
      buildGravacao: dados.buildGravacao || null,
    },
  });
  revalidatePath(`/pecas/${id}`);
}

export async function adicionarFoto(productId: string, url: string, kind: 'gallery' | 'turntable' = 'gallery') {
  await requireAdmin();
  const limpa = url.trim();
  if (!/^https?:\/\//i.test(limpa)) throw new Error('Informe o endereço da imagem (começando com https://).');
  const total = await prisma.productPhoto.count({ where: { productId, kind } });
  await prisma.productPhoto.create({ data: { productId, url: limpa, kind, order: total, isCover: kind === 'gallery' && total === 0 } });
  if (kind === 'turntable') await prisma.product.update({ where: { id: productId }, data: { turntableStatus: 'ready' } });
  revalidatePath(`/pecas/${productId}`);
}

export async function removerFoto(photoId: string) {
  await requireAdmin();
  const foto = await prisma.productPhoto.delete({ where: { id: photoId } });
  const restantes = await prisma.productPhoto.count({ where: { productId: foto.productId, kind: 'turntable' } });
  if (foto.kind === 'turntable' && restantes === 0) await prisma.product.update({ where: { id: foto.productId }, data: { turntableStatus: 'none' } });
  revalidatePath(`/pecas/${foto.productId}`);
}

export async function definirCapa(photoId: string) {
  await requireAdmin();
  const foto = await prisma.productPhoto.findUnique({ where: { id: photoId } });
  if (!foto) return;
  await prisma.$transaction([
    prisma.productPhoto.updateMany({ where: { productId: foto.productId, kind: 'gallery' }, data: { isCover: false } }),
    prisma.productPhoto.update({ where: { id: photoId }, data: { isCover: true } }),
  ]);
  revalidatePath(`/pecas/${foto.productId}`);
}

export async function reordenarFotos(productId: string, idsNaOrdem: string[]) {
  await requireAdmin();
  await prisma.$transaction(idsNaOrdem.map((id, i) => prisma.productPhoto.update({ where: { id }, data: { order: i } })));
  revalidatePath(`/pecas/${productId}`);
}

export async function decidirModelo3d(productId: string, decisao: 'approved' | 'discarded') {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { model3dStatus: decisao } });
  revalidatePath(`/pecas/${productId}`);
  revalidatePath('/');
}

export async function definirUrlModelo3d(productId: string, url: string) {
  await requireAdmin();
  const limpa = url.trim();
  await prisma.product.update({ where: { id: productId }, data: { model3dUrl: limpa || null, model3dStatus: limpa ? 'pending' : 'none' } });
  revalidatePath(`/pecas/${productId}`);
}

export async function reordenarPecas(idsNaOrdem: string[]) {
  await requireAdmin();
  await prisma.$transaction(idsNaOrdem.map((id, i) => prisma.product.update({ where: { id }, data: { displayOrder: i } })));
  revalidatePath('/pecas');
}

export async function excluirPeca(id: string) {
  await requireAdmin();
  const vendida = await prisma.orderItem.count({ where: { productId: id } });
  if (vendida > 0) {
    // peça com histórico de venda vira rascunho em vez de sumir do banco
    await prisma.product.update({ where: { id }, data: { status: 'draft' } });
  } else {
    await prisma.product.delete({ where: { id } });
  }
  revalidatePath('/pecas');
  redirect('/pecas');
}
