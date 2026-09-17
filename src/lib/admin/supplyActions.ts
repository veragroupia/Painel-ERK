'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from './guard';

export async function salvarInsumo(dados: { id?: string; name: string; type: string; unit: string; unitCost: number; lowStockThreshold: number; stockQty?: number }) {
  await requireAdmin();
  const comum = {
    name: dados.name.trim(),
    type: dados.type,
    unit: dados.unit,
    unitCost: Math.max(0, dados.unitCost),
    lowStockThreshold: Math.max(0, dados.lowStockThreshold),
  };
  if (dados.id) await prisma.supply.update({ where: { id: dados.id }, data: comum });
  else await prisma.supply.create({ data: { ...comum, stockQty: Math.max(0, dados.stockQty ?? 0) } });
  revalidatePath('/insumos');
  revalidatePath('/');
}

export async function excluirInsumo(id: string) {
  await requireAdmin();
  await prisma.supply.delete({ where: { id } });
  revalidatePath('/insumos');
}

/** Registra a compra, soma ao estoque e recalcula o custo unitário por média. */
export async function registrarCompra(dados: { supplyId: string; supplier: string; quantity: number; totalPaid: number; dateISO: string | null }) {
  await requireAdmin();
  const insumo = await prisma.supply.findUnique({ where: { id: dados.supplyId } });
  if (!insumo) throw new Error('Insumo não encontrado.');

  const qtd = Math.max(0, dados.quantity);
  const pago = Math.max(0, dados.totalPaid);
  const estoqueNovo = insumo.stockQty + qtd;
  const custoMedio = estoqueNovo > 0 ? (insumo.stockQty * insumo.unitCost + pago) / estoqueNovo : insumo.unitCost;

  await prisma.$transaction([
    prisma.supplyPurchase.create({
      data: { supplyId: dados.supplyId, supplier: dados.supplier.trim() || 'não informado', quantity: qtd, totalPaid: pago, date: dados.dateISO ? new Date(dados.dateISO) : new Date() },
    }),
    prisma.supply.update({ where: { id: dados.supplyId }, data: { stockQty: estoqueNovo, unitCost: Number(custoMedio.toFixed(4)) } }),
  ]);

  revalidatePath('/insumos');
  revalidatePath('/');
}

/** Baixa de consumo: tira do estoque e registra no histórico. */
export async function registrarConsumo(dados: { supplyId: string; quantity: number; productName: string | null; orderId: number | null; note: string | null }) {
  await requireAdmin();
  const insumo = await prisma.supply.findUnique({ where: { id: dados.supplyId } });
  if (!insumo) throw new Error('Insumo não encontrado.');
  const qtd = Math.max(0, dados.quantity);

  await prisma.$transaction([
    prisma.supplyConsumption.create({ data: { supplyId: dados.supplyId, quantity: qtd, productName: dados.productName, orderId: dados.orderId, note: dados.note } }),
    prisma.supply.update({ where: { id: dados.supplyId }, data: { stockQty: Math.max(0, insumo.stockQty - qtd) } }),
  ]);

  revalidatePath('/insumos');
  revalidatePath('/');
}
