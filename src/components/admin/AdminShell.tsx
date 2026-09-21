'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Icon } from '@/components/ui/Icon';

export type AdminNavItem = { href: string; label: string; icon: string; count?: number };

const NAV: AdminNavItem[] = [
  { href: '/', label: 'Visão geral', icon: 'adm_visao' },
  { href: '/pedidos', label: 'Pedidos', icon: 'adm_pedidos' },
  { href: '/pecas', label: 'Peças', icon: 'adm_pecas' },
  { href: '/vitrine', label: 'Vitrine', icon: 'adm_vitrine' },
  { href: '/montador', label: 'Montador', icon: 'adm_montador' },
  { href: '/insumos', label: 'Insumos', icon: 'adm_insumos' },
  { href: '/financeiro', label: 'Financeiro', icon: 'adm_financeiro' },
  { href: '/avaliacoes', label: 'Avaliações', icon: 'adm_estrela' },
  { href: '/clientes', label: 'Clientes', icon: 'adm_clientes' },
  { href: '/ajustes', label: 'Ajustes', icon: 'adm_ajustes' },
];

function isOn(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

function NavLinks({ pendentes, onNavigate }: { pendentes: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <span className="adm-navlabel">Painel</span>
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} className={'adm-navitem' + (isOn(pathname, item.href) ? ' is-on' : '')} onClick={onNavigate}>
          <Icon name={item.icon} />
          {item.label}
          {item.href === '/pedidos' && pendentes > 0 ? <span className="adm-count">{pendentes}</span> : null}
        </Link>
      ))}
    </>
  );
}

export function AdminShell({
  children,
  pendentes,
  precoGrama,
  userLabel,
}: {
  children: React.ReactNode;
  pendentes: number;
  precoGrama: string;
  userLabel: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="adm-shell">
      <header className="adm-topbar">
        <button className="adm-hamburger" aria-label="Abrir menu" onClick={() => setAberto(true)}>
          <Icon name="hamburguer" size={22} />
        </button>
        <span className="adm-logo">ERK Pratas</span>
        <div className="adm-search">
          <Icon name="busca" size={15} />
          <input placeholder="Buscar pedido, cliente ou peça" />
        </div>
        <div style={{ flex: 1 }} />
        <button
          className="adm-avatar"
          title={`${userLabel} · clique para sair`}
          onClick={() => {
            if (confirm('Sair do painel?')) signOut({ callbackUrl: '/entrar' });
          }}
          style={{ cursor: 'pointer' }}
        >
          {userLabel.slice(0, 2).toUpperCase()}
        </button>
      </header>

      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        <nav className="adm-sidebar">
          <NavLinks pendentes={pendentes} />
          <div className="adm-sidebar-foot">
            <span>Grama da prata</span>
            <b>{precoGrama}</b>
            <em>atualizado nos ajustes</em>
          </div>
        </nav>

        <div className={'adm-drawer-veil' + (aberto ? ' is-open' : '')} onClick={() => setAberto(false)} />
        <nav className={'adm-drawer' + (aberto ? ' is-open' : '')}>
          <div className="adm-drawer-head">
            <span className="adm-logo">ERK Pratas</span>
            <button aria-label="Fechar menu" onClick={() => setAberto(false)} style={{ background: 'none', border: 0, color: 'var(--tinta)', cursor: 'pointer' }}>
              <Icon name="fechar" size={20} />
            </button>
          </div>
          <NavLinks pendentes={pendentes} onNavigate={() => setAberto(false)} />
          <div className="adm-sidebar-foot">
            <span>Grama da prata</span>
            <b>{precoGrama}</b>
            <em>atualizado nos ajustes</em>
          </div>
        </nav>

        <main className="adm-content">
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
