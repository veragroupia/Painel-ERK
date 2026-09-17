import type { Metadata } from 'next';
import './globals.css';
import './admin.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Painel — ERK Pratas',
  description: 'Área interna da ERK Pratas: pedidos, catálogo, vitrine, montador, insumos, financeiro e clientes.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
