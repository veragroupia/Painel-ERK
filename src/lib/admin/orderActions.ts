'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from './guard';
import { nextStatus, statusNormalizado } from './status';

export async function avancarStatus(orderId: number) {
  const { nome } = await requireAdmin();
  const pedido = await prisma.order.findUnique({ where: { id: orderId } });
  if (!pedido) throw new Error('Pedido não encontrado.');

  const proximo = nextStatus(pedido.status, pedido.readyFromStock);
  if (!proximo) return;

  // pedido criado pela loja (status antigo, sem linha do tempo): registra a
  // entrada que faltava antes de seguir, para o histórico não começar no meio
  const eventos = await prisma.orderStatusEvent.count({ where: { orderId } });
  if (eventos === 0) {
    await prisma.orderStatusEvent.createMany({
      data: [
        { orderId, status: 'novo', at: pedido.createdAt, by: 'Loja' },
        { orderId, status: statusNormalizado(pedido.status), at: pedido.createdAt, by: 'Loja' },
      ],
    });
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: proximo,
        ...(proximo === 'pago' ? { paymentStatus: 'pago', paymentConfirmedAt: new Date() } : {}),
      },
    }),
    prisma.orderStatusEvent.create({ data: { orderId, status: proximo, by: nome } }),
  ]);

  revalidatePath('/pedidos');
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath('/');
}

export async function definirStatus(orderId: number, status: string) {
  const { nome } = await requireAdmin();
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'pago' ? { paymentStatus: 'pago', paymentConfirmedAt: new Date() } : {}),
        ...(status === 'cancelado' ? { canceledAt: new Date() } : {}),
      },
    }),
    prisma.orderStatusEvent.create({ data: { orderId, status, by: nome } }),
  ]);
  revalidatePath('/pedidos');
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath('/');
}

export async function definirStatusEmLote(ids: number[], status: string) {
  const { nome } = await requireAdmin();
  if (ids.length === 0) return;
  await prisma.$transaction([
    prisma.order.updateMany({ where: { id: { in: ids } }, data: { status, ...(status === 'cancelado' ? { canceledAt: new Date() } : {}) } }),
    prisma.orderStatusEvent.createMany({ data: ids.map((id) => ({ orderId: id, status, by: nome })) }),
  ]);
  revalidatePath('/pedidos');
  revalidatePath('/');
}

export async function atualizarOndeEsta(orderId: number, texto: string) {
  await requireAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { whereIsIt: texto.slice(0, 200) } });
  revalidatePath(`/pedidos/${orderId}`);
}

export async function adicionarNota(orderId: number, texto: string) {
  const { nome } = await requireAdmin();
  const limpo = texto.trim();
  if (!limpo) return;
  await prisma.orderNote.create({ data: { orderId, text: limpo.slice(0, 1000), author: nome } });
  revalidatePath(`/pedidos/${orderId}`);
}

export type CustoPedidoInput = {
  silverGrams: number;
  silverPricePerGram: number;
  laborCost: number;
  polishGrams: number;
  polishCost: number;
  packagingCost: number;
  clampCost: number;
  thirdPartyCost: number;
};

export async function salvarCustoPedido(orderId: number, dados: CustoPedidoInput) {
  await requireAdmin();
  const limpo = Object.fromEntries(Object.entries(dados).map(([k, v]) => [k, Number.isFinite(v) && v >= 0 ? v : 0])) as CustoPedidoInput;
  await prisma.orderCost.upsert({ where: { orderId }, update: limpo, create: { orderId, ...limpo } });
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath('/');
}

export async function cancelarPedido(orderId: number) {
  await definirStatus(orderId, 'cancelado');
}

export async function estornarPedido(orderId: number) {
  const { nome } = await requireAdmin();
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { paymentStatus: 'estornado', status: 'cancelado', canceledAt: new Date() } }),
    prisma.orderStatusEvent.create({ data: { orderId, status: 'cancelado', by: nome } }),
    prisma.orderNote.create({ data: { orderId, text: 'Pagamento estornado.', author: nome } }),
  ]);
  revalidatePath('/pedidos');
  revalidatePath(`/pedidos/${orderId}`);
}
