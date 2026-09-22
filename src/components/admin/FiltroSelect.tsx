'use client';

import { useRouter } from 'next/navigation';

export type FiltroOpcao = {
  valor: string;
  nome: string;
  /** endereço para onde ir ao escolher esta opção */
  href: string;
  contagem?: number;
};

/* Filtro em select no lugar de fila de pílulas. A fila crescia com o catálogo
   e virava rolagem lateral no celular, escondendo opções fora da tela; o
   select cabe em qualquer largura, mostra o que está selecionado sem o dono
   precisar procurar a pílula acesa, e no celular abre a roleta nativa do
   sistema, que é o controle que ele já sabe usar.

   Cada opção traz o próprio endereço em vez de o filtro receber uma função
   que os monta: quem chama é Server Component, e o Next não deixa passar
   função para componente de cliente. */
export function FiltroSelect({
  rotulo,
  valor,
  opcoes,
  className = '',
}: {
  rotulo: string;
  valor: string;
  opcoes: FiltroOpcao[];
  className?: string;
}) {
  const router = useRouter();
  return (
    <label className={['adm-filtro', className].filter(Boolean).join(' ')}>
      <span>{rotulo}</span>
      <select
        className="adm-select adm-select--sm"
        value={valor}
        onChange={(e) => {
          const alvo = opcoes.find((o) => o.valor === e.target.value);
          if (alvo) router.push(alvo.href);
        }}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.nome}
            {o.contagem !== undefined ? ` (${o.contagem})` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
