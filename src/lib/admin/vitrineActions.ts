'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from './guard';

function diaLimpo(iso: string) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function definirDestaque(dataISO: string, alvo: { tipo: 'product' | 'combo'; id: string }) {
  await requireAdmin();
  const date = diaLimpo(dataISO);
  await prisma.highlightSchedule.upsert({
    where: { date },
    update: { targetType: alvo.tipo, productId: alvo.tipo === 'product' ? alvo.id : null, comboId: alvo.tipo === 'combo' ? alvo.id : null },
    create: { date, targetType: alvo.tipo, productId: alvo.tipo === 'product' ? alvo.id : null, comboId: alvo.tipo === 'combo' ? alvo.id : null },
  });
  revalidatePath('/vitrine');
  revalidatePath('/');
}

export async function limparDestaque(dataISO: string) {
  await requireAdmin();
  await prisma.highlightSchedule.deleteMany({ where: { date: diaLimpo(dataISO) } });
  revalidatePath('/vitrine');
  revalidatePath('/');
}

export async function salvarCombo(dados: { id?: string; name: string; priceOverride: number; stockLimit: number | null; startAt: string | null; endAt: string | null; itens: string[] }) {
  await requireAdmin();
  const comum = {
    name: dados.name.trim(),
    priceOverride: Math.max(0, dados.priceOverride),
    stockLimit: dados.stockLimit,
    startAt: dados.startAt ? new Date(dados.startAt) : null,
    endAt: dados.endAt ? new Date(dados.endAt) : null,
  };

  if (dados.id) {
    await prisma.$transaction([
      prisma.combo.update({ where: { id: dados.id }, data: comum }),
      prisma.comboItem.deleteMany({ where: { comboId: dados.id } }),
      prisma.comboItem.createMany({ data: dados.itens.map((productId) => ({ comboId: dados.id!, productId })) }),
    ]);
  } else {
    await prisma.combo.create({ data: { ...comum, items: { create: dados.itens.map((productId) => ({ productId })) } } });
  }
  revalidatePath('/vitrine');
}

export async function alternarCombo(id: string, ativo: boolean) {
  await requireAdmin();
  await prisma.combo.update({ where: { id }, data: { active: ativo } });
  revalidatePath('/vitrine');
}

export async function excluirCombo(id: string) {
  await requireAdmin();
  await prisma.combo.delete({ where: { id } });
  revalidatePath('/vitrine');
}

export async function salvarOferta(dados: {
  id?: string;
  name: string;
  discountType: string;
  discountValue: number;
  productId: string | null;
  categoryId: string | null;
  coupon: string | null;
  startAt: string | null;
  endAt: string | null;
}) {
  await requireAdmin();
  const comum = {
    name: dados.name.trim(),
    discountType: dados.discountType,
    discountValue: Math.max(0, dados.discountValue),
    productId: dados.productId,
    categoryId: dados.categoryId,
    coupon: dados.coupon?.trim() || null,
    startAt: dados.startAt ? new Date(dados.startAt) : null,
    endAt: dados.endAt ? new Date(dados.endAt) : null,
  };
  if (dados.id) await prisma.offer.update({ where: { id: dados.id }, data: comum });
  else await prisma.offer.create({ data: comum });
  revalidatePath('/vitrine');
}

export async function alternarOferta(id: string, ativa: boolean) {
  await requireAdmin();
  await prisma.offer.update({ where: { id }, data: { active: ativa } });
  revalidatePath('/vitrine');
}

export async function excluirOferta(id: string) {
  await requireAdmin();
  await prisma.offer.delete({ where: { id } });
  revalidatePath('/vitrine');
}

export async function reordenarSecoes(idsNaOrdem: string[]) {
  await requireAdmin();
  await prisma.$transaction(idsNaOrdem.map((id, i) => prisma.vitrineSection.update({ where: { id }, data: { order: i } })));
  revalidatePath('/vitrine');
}

export async function alternarSecao(id: string, ativa: boolean) {
  await requireAdmin();
  await prisma.vitrineSection.update({ where: { id }, data: { active: ativa } });
  revalidatePath('/vitrine');
}
