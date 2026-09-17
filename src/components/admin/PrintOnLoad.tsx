'use client';

export function PrintOnLoad() {
  return (
    <button className="nao-imprime erk-btn erk-btn--sm" style={{ background: '#0D0F12', color: '#fff', marginBottom: 16 }} onClick={() => window.print()}>
      Imprimir
    </button>
  );
}
