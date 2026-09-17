// Vocabulário de status de pedido e helpers de exibição do painel.

export const STATUS_FLOW = ['novo', 'pago', 'producao', 'polimento', 'embalado', 'enviado', 'entregue'] as const;
export const STATUS_FLOW_PRONTA = ['novo', 'pago', 'embalado', 'enviado', 'entregue'] as const;

/** A loja cria pedido com o status antigo ("preparo") e sem linha do tempo.
    O painel entende esse pedido como se estivesse em produção, e só grava a
    correção quando o dono age sobre ele. */
export const STATUS_LEGADO: Record<string, string> = { preparo: 'producao' };

export function statusNormalizado(status: string): string {
  return STATUS_LEGADO[status] ?? status;
}

export const STATUS_LABEL: Record<string, string> = {
  preparo: 'Em produção',
  novo: 'Novo',
  pago: 'Pago',
  producao: 'Em produção',
  polimento: 'Polimento',
  embalado: 'Embalado',
  enviado: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  preparo: { bg: 'rgba(216,54,62,.14)', fg: '#EA858B' },
  novo: { bg: 'rgba(162,169,179,.16)', fg: '#A2A9B3' },
  pago: { bg: 'rgba(63,208,138,.16)', fg: '#3FD08A' },
  producao: { bg: 'rgba(216,54,62,.14)', fg: '#EA858B' },
  polimento: { bg: 'rgba(216,54,62,.14)', fg: '#EA858B' },
  embalado: { bg: 'rgba(242,244,247,.14)', fg: '#F2F4F7' },
  enviado: { bg: 'rgba(242,244,247,.14)', fg: '#F2F4F7' },
  entregue: { bg: 'rgba(63,208,138,.16)', fg: '#3FD08A' },
  cancelado: { bg: 'rgba(110,117,127,.2)', fg: '#6E757F' },
};

/** próximo passo do fluxo, pulando produção/polimento pra peça pronta de estoque */
export function nextStatus(status: string, readyFromStock: boolean): string | null {
  const flow = readyFromStock ? STATUS_FLOW_PRONTA : STATUS_FLOW;
  const idx = (flow as readonly string[]).indexOf(statusNormalizado(status));
  if (idx === -1 || idx === flow.length - 1) return null;
  return flow[idx + 1];
}

export const NEXT_ACTION_LABEL: Record<string, string> = {
  preparo: 'Marcar como pronto',
  novo: 'Marcar como pago',
  pago: 'Iniciar produção',
  producao: 'Marcar como pronto',
  polimento: 'Marcar como pronto',
  embalado: 'Despachar',
  enviado: 'Marcar como entregue',
};

export function horasDesde(data: Date): number {
  return (Date.now() - data.getTime()) / 3600000;
}

export function paradoHaTexto(data: Date): string {
  const h = horasDesde(data);
  if (h < 1) return 'há poucos minutos';
  if (h < 24) return `há ${Math.floor(h)}h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? 's' : ''}`;
}

export function relativoTexto(data: Date): string {
  const h = horasDesde(data);
  if (h < 1) return 'agora há pouco';
  if (h < 24) return `há ${Math.floor(h)}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} dia${d > 1 ? 's' : ''}`;
  const meses = Math.floor(d / 30);
  return `há ${meses} ${meses > 1 ? 'meses' : 'mês'}`;
}

export function margemCor(pct: number): { bg: string; fg: string } {
  if (pct >= 40) return { bg: 'rgba(63,208,138,.16)', fg: '#3FD08A' };
  if (pct >= 20) return { bg: 'rgba(230,184,64,.16)', fg: '#E6B840' };
  return { bg: 'rgba(216,54,62,.16)', fg: '#EA858B' };
}
