'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from './guard';

/** Remove um depoimento. É a única ação destrutiva da tela, e existe para
    conteúdo abusivo — não para apagar nota baixa. A loja só aceita avaliação
    de quem comprou, então o que está aqui é cliente de verdade falando. */
export async function excluirAvaliacao(id: string) {
  await requireAdmin();
  await prisma.review.delete({ where: { id } });
  revalidatePath('/avaliacoes');
  revalidatePath('/');
}
