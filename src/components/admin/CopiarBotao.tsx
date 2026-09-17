'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

export function CopiarBotao({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="erk-btn erk-btn--s erk-btn--sm"
      style={{ flex: 'none' }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          setCopiado(false);
        }
      }}
    >
      <Icon name="adm_copiar" size={14} /> {copiado ? 'Copiado' : 'Copiar'}
    </button>
  );
}
