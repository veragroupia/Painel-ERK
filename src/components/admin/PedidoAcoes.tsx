'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { ConfirmButton } from './ConfirmButton';
import { avancarStatus, cancelarPedido, estornarPedido } from '@/lib/admin/orderActions';
import { nextStatus, NEXT_ACTION_LABEL } from '@/lib/admin/status';

export function PedidoAcoes({ id, status, readyFromStock }: { id: number; status: string; readyFromStock: boolean }) {
  const router = useRouter();
  const [pendente, start] = useTransition();
  const proximo = nextStatus(status, readyFromStock);
  const encerrado = status === 'entregue' || status === 'cancelado';

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {proximo && !encerrado ? (
        <button
          type="button"
          className="erk-btn erk-btn--p erk-btn--sm"
          disabled={pendente}
          onClick={() =>
            start(async () => {
              await avancarStatus(id);
              router.refresh();
            })
          }
        >
          {pendente ? 'Salvando…' : NEXT_ACTION_LABEL[status] || 'Avançar'}
        </button>
      ) : null}

      <a href={`/etiquetas?ids=${id}`} target="_blank" rel="noreferrer" className="erk-btn erk-btn--s erk-btn--sm">
        <Icon name="adm_print" size={15} /> Etiqueta
      </a>

      {!encerrado ? (
        <ConfirmButton
          label="Cancelar pedido"
          title="Cancelar este pedido?"
          description="O pedido sai da fila de produção e passa a aparecer como cancelado para você e para o cliente. O estoque não é devolvido automaticamente."
          confirmLabel="Cancelar pedido"
          onConfirm={async () => {
            await cancelarPedido(id);
            router.refresh();
          }}
        />
      ) : null}

      {status !== 'cancelado' ? (
        <ConfirmButton
          label="Estornar"
          title="Estornar o pagamento?"
          description="O pagamento é marcado como estornado e o pedido é cancelado. O dinheiro precisa ser devolvido por fora, na maquininha ou no app do banco."
          confirmLabel="Estornar"
          onConfirm={async () => {
            await estornarPedido(id);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
