import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin/guard';
import { orderCostTotal } from '@/lib/admin/money';

const ENTREGA: Record<string, string> = { motoboy: 'Motoboy', correios: 'Correios', retirada: 'Retirada' };
const PAGAMENTO: Record<string, string> = { pix: 'Pix', credito: 'Cartão', whats: 'A combinar' };

function br(n: number) {
  return n.toFixed(2).replace('.', ',');
}

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const agora = new Date();
  const [ano, mes] = (searchParams.get('mes') || `${agora.getFullYear()}-${agora.getMonth() + 1}`).split('-').map((n) => parseInt(n, 10));
  if (!Number.isFinite(ano) || !Number.isFinite(mes)) return NextResponse.json({ error: 'Mês inválido' }, { status: 400 });

  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1);

  const [pedidos, fixas] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: inicio, lt: fim }, status: { not: 'cancelado' } }, include: { items: true, cost: true }, orderBy: { createdAt: 'asc' } }),
    prisma.fixedExpense.findMany({ where: { active: true } }),
  ]);

  const linhas: string[] = [];
  linhas.push('Data;Pedido;Cliente;Itens;Entrega;Pagamento;Venda;Taxa;Custo;Sobrou');

  for (const o of pedidos) {
    const custo = o.cost ? orderCostTotal(o.cost) : 0;
    const sobrou = o.total - o.paymentFeeAmount - custo;
    linhas.push(
      [
        o.createdAt.toLocaleDateString('pt-BR'),
        10000 + o.id,
        o.customerName.replace(/;/g, ','),
        o.items.map((i) => `${i.quantity}x ${i.name}`).join(' | ').replace(/;/g, ','),
        ENTREGA[o.delivery] || o.delivery,
        PAGAMENTO[o.payment] || o.payment,
        br(o.total),
        br(o.paymentFeeAmount),
        br(custo),
        br(sobrou),
      ].join(';')
    );
  }

  linhas.push('');
  linhas.push('Despesas fixas do mês');
  for (const f of fixas) linhas.push(`${f.name.replace(/;/g, ',')};dia ${f.dayOfMonth};${br(f.amount)}`);

  const vendas = pedidos.reduce((a, o) => a + o.total, 0);
  const taxas = pedidos.reduce((a, o) => a + o.paymentFeeAmount, 0);
  const custos = pedidos.reduce((a, o) => (o.cost ? a + orderCostTotal(o.cost) : a), 0);
  const totalFixas = fixas.reduce((a, f) => a + f.amount, 0);

  linhas.push('');
  linhas.push(`Vendas;${br(vendas)}`);
  linhas.push(`Taxas de pagamento;${br(taxas)}`);
  linhas.push(`Custo das peças e insumos;${br(custos)}`);
  linhas.push(`Despesas fixas;${br(totalFixas)}`);
  linhas.push(`Lucro do mês;${br(vendas - taxas - custos - totalFixas)}`);

  // BOM para o Excel abrir com acento certo
  const csv = '﻿' + linhas.join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="erk-financeiro-${ano}-${String(mes).padStart(2, '0')}.csv"`,
    },
  });
}
