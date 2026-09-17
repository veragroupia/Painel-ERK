import { getSession } from '@/lib/session';

/** Toda Server Action do painel passa por aqui: a middleware protege as páginas,
    mas a action é um endpoint próprio e precisa conferir a sessão por conta. */
export async function requireAdmin() {
  const session = await getSession();
  const user = session?.user as { id?: string; name?: string; role?: string } | undefined;
  if (!user || user.role !== 'admin') throw new Error('Sem permissão para essa ação.');
  return { id: user.id!, nome: user.name || 'Dono' };
}
