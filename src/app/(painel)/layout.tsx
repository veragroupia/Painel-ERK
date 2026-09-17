import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { fmt } from '@/lib/format';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'admin') redirect('/entrar');

  const [pendentes, precoAtual] = await Promise.all([
    prisma.order.count({ where: { status: { in: ['novo', 'pago', 'producao', 'polimento', 'preparo'] } } }),
    prisma.silverPrice.findFirst({ orderBy: { at: 'desc' } }),
  ]);

  return (
    <AdminShell pendentes={pendentes} precoGrama={fmt(precoAtual?.value ?? 6.6)} userLabel={session.user.name || 'Dono'}>
      {children}
    </AdminShell>
  );
}
