/* Estrelas do painel. Mesma silhueta e mesmos tokens da loja, para a nota
   que o dono vê aqui ser visualmente a mesma que o cliente vê lá. */
const D_ESTRELA =
  'M12 3.2l2.62 5.31 5.86.85-4.24 4.13 1 5.84L12 16.59l-5.24 2.76 1-5.84-4.24-4.13 5.86-.85z';

export function Estrelas({ nota, tamanho = 14 }: { nota: number; tamanho?: number }) {
  const valor = Math.max(0, Math.min(5, nota));
  return (
    <span
      className="adm-estrelas"
      role="img"
      aria-label={`${valor.toFixed(1).replace('.', ',')} de 5 estrelas`}
      style={{ ['--adm-estrela-tam' as string]: `${tamanho}px` }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d={D_ESTRELA} fill={valor - i >= 1 ? 'var(--tinta)' : valor - i > 0 ? 'var(--tinta-3)' : 'var(--linha-2)'} />
        </svg>
      ))}
    </span>
  );
}
