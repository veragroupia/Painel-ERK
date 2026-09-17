'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession, signOut } from 'next-auth/react';

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const res = await signIn('credentials', { email, password: senha, redirect: false });
    if (res?.error) {
      setErro('E-mail ou senha incorretos.');
      setCarregando(false);
      return;
    }
    const session = await getSession();
    if ((session?.user as any)?.role !== 'admin') {
      setErro('Essa conta não tem acesso ao painel.');
      await signOut({ redirect: false });
      setCarregando(false);
      return;
    }
    router.push(params.get('callbackUrl') || '/');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14, width: '100%', maxWidth: 340 }}>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6E757F' }}>E-mail</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ height: 46, borderRadius: 10, background: '#14171B', border: '1px solid #23272D', color: '#F2F4F7', padding: '0 14px', fontSize: 14.5 }}
        />
      </label>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6E757F' }}>Senha</span>
        <input
          type="password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ height: 46, borderRadius: 10, background: '#14171B', border: '1px solid #23272D', color: '#F2F4F7', padding: '0 14px', fontSize: 14.5 }}
        />
      </label>
      {erro ? <p style={{ color: '#D8363E', fontSize: 13, margin: 0 }}>{erro}</p> : null}
      <button
        type="submit"
        disabled={carregando}
        style={{ height: 46, borderRadius: 10, background: '#F2F4F7', color: '#0D0F12', fontWeight: 600, fontSize: 14.5, border: 0, cursor: 'pointer', opacity: carregando ? 0.6 : 1 }}
      >
        {carregando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
