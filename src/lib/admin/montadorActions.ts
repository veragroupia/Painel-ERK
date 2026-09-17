'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from './guard';

export async function alternarOpcao(id: string, ativa: boolean) {
  await requireAdmin();
  await prisma.montadorOption.update({ where: { id }, data: { active: ativa } });
  revalidatePath('/montador');
}

export async function reordenarOpcoes(idsNaOrdem: string[]) {
  await requireAdmin();
  await prisma.$transaction(idsNaOrdem.map((id, i) => prisma.montadorOption.update({ where: { id }, data: { order: i } })));
  revalidatePath('/montador');
}

export async function salvarOpcao(dados: { id?: string; step: string; name: string; description: string }) {
  await requireAdmin();
  if (dados.id) {
    await prisma.montadorOption.update({ where: { id: dados.id }, data: { name: dados.name.trim(), description: dados.description.trim() } });
  } else {
    const ultimo = await prisma.montadorOption.aggregate({ where: { step: dados.step }, _max: { order: true } });
    await prisma.montadorOption.create({ data: { step: dados.step, name: dados.name.trim(), description: dados.description.trim(), order: (ultimo._max.order ?? 0) + 1 } });
  }
  revalidatePath('/montador');
}

export async function excluirOpcao(id: string) {
  await requireAdmin();
  await prisma.montadorOption.delete({ where: { id } });
  revalidatePath('/montador');
}

export async function salvarPeso(elo: string, espessura: number, medida: number, grams: number) {
  await requireAdmin();
  await prisma.montadorWeight.upsert({
    where: { elo_espessura_medida: { elo, espessura, medida } },
    update: { grams: Math.max(0, grams) },
    create: { elo, espessura, medida, grams: Math.max(0, grams) },
  });
  revalidatePath('/montador');
}

export async function salvarPrecoMontador(dados: { grama: number; laborMultiplier: number; gravacaoSurcharge: number }) {
  const { nome } = await requireAdmin();
  const atual = await prisma.silverPrice.findFirst({ orderBy: { at: 'desc' } });
  if (!atual || Math.abs(atual.value - dados.grama) > 0.001) {
    await prisma.silverPrice.create({ data: { value: Math.max(0, dados.grama), by: nome } });
  }
  await prisma.settings.upsert({
    where: { id: 'shop' },
    update: { laborMultiplier: dados.laborMultiplier, gravacaoSurcharge: dados.gravacaoSurcharge },
    create: { id: 'shop', laborMultiplier: dados.laborMultiplier, gravacaoSurcharge: dados.gravacaoSurcharge },
  });
  revalidatePath('/montador');
  revalidatePath('/ajustes');
  revalidatePath('/');
}
