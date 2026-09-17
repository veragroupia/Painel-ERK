'use client';

import { useState, useTransition } from 'react';

export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel = 'Confirmar',
  className = 'erk-btn erk-btn--s erk-btn--sm',
  onConfirm,
}: {
  label: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  className?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <div className="adm-modal-veil" onClick={() => !pending && setOpen(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, margin: 0 }}>{title}</h3>
            <p style={{ fontSize: 13.5, color: 'var(--tinta-2)', marginTop: 10, lineHeight: 1.55 }}>{description}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="erk-btn erk-btn--s erk-btn--sm" disabled={pending} onClick={() => setOpen(false)}>
                Voltar
              </button>
              <button
                type="button"
                className="erk-btn erk-btn--a erk-btn--sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await onConfirm();
                    setOpen(false);
                  })
                }
              >
                {pending ? 'Aplicando…' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
