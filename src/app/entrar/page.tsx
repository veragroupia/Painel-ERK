import { Suspense } from 'react';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export default function AdminEntrarPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 24, background: '#0D0F12' }}>
      <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 24, letterSpacing: '.04em', color: '#F2F4F7' }}>ERK Pratas</span>
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontWeight: 600, fontSize: 19, color: '#F2F4F7', margin: 0 }}>Painel administrativo</h1>
          <p style={{ fontSize: 13, color: '#A2A9B3', marginTop: 6 }}>Entre com sua conta para administrar a loja.</p>
        </div>
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
