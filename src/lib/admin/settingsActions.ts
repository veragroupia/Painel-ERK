'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from './guard';

export async function salvarDadosLoja(dados: { storeName: string; hours: { dia: string; horario: string }[] }) {
  await requireAdmin();
  await prisma.settings.upsert({
    where: { id: 'shop' },
    update: { storeName: dados.storeName.trim(), hoursJson: JSON.stringify(dados.hours) },
    create: { id: 'shop', storeName: dados.storeName.trim(), hoursJson: JSON.stringify(dados.hours) },
  });
  revalidatePath('/ajustes');
}

export async function salvarEntrega(zonas: { nome: string; valor: number; prazo: string }[]) {
  await requireAdmin();
  await prisma.settings.upsert({
    where: { id: 'shop' },
    update: { deliveryZonesJson: JSON.stringify(zonas) },
    create: { id: 'shop', deliveryZonesJson: JSON.stringify(zonas) },
  });
  revalidatePath('/ajustes');
}

export async function salvarPagamentos(formas: { nome: string; ativo: boolean; taxa: number }[]) {
  await requireAdmin();
  await prisma.settings.upsert({
    where: { id: 'shop' },
    update: { paymentMethodsJson: JSON.stringify(formas) },
    create: { id: 'shop', paymentMethodsJson: JSON.stringify(formas) },
  });
  revalidatePath('/ajustes');
}

export async function salvarPrecoPrata(valor: number) {
  const { nome } = await requireAdmin();
  await prisma.silverPrice.create({ data: { value: Math.max(0, valor), by: nome } });
  revalidatePath('/ajustes');
  revalidatePath('/');
  revalidatePath('/pecas');
}

export async function salvarDespesaFixa(dados: { id?: string; name: string; amount: number; dayOfMonth: number }) {
  await requireAdmin();
  const comum = { name: dados.name.trim(), amount: Math.max(0, dados.amount), dayOfMonth: Math.min(28, Math.max(1, dados.dayOfMonth)) };
  if (dados.id) await prisma.fixedExpense.update({ where: { id: dados.id }, data: comum });
  else await prisma.fixedExpense.create({ data: comum });
  revalidatePath('/ajustes');
  revalidatePath('/financeiro');
  revalidatePath('/');
}

export async function alternarDespesaFixa(id: string, ativa: boolean) {
  await requireAdmin();
  await prisma.fixedExpense.update({ where: { id }, data: { active: ativa } });
  revalidatePath('/ajustes');
  revalidatePath('/financeiro');
  revalidatePath('/');
}

export async function excluirDespesaFixa(id: string) {
  await requireAdmin();
  await prisma.fixedExpense.delete({ where: { id } });
  revalidatePath('/ajustes');
  revalidatePath('/financeiro');
  revalidatePath('/');
}
