import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/** O painel inteiro é privado: só passa quem tem role=admin. A tela de entrada
    e as rotas do next-auth ficam de fora, senão não há como fazer login. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/entrar' || pathname.startsWith('/api/auth')) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || (token as any).role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/entrar';
    url.search = '';
    if (pathname !== '/') url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
