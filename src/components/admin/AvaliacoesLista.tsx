'use client';

import Link from 'next/link';
import { Estrelas } from './AvaliacoesEstrelas';
import { ConfirmButton } from './ConfirmButton';
import { excluirAvaliacao } from '@/lib/admin/reviewActions';

export type AvaliacaoLinha = {
  id: string;
  nota: number;
  comentario: string | null;
  autor: string;
  email: string;
  data: string;
  pecaId: string;
  pecaNome: string;
  pedidoId: number | null;
};

function dataLonga(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AvaliacoesLista({ linhas }: { linhas: AvaliacaoLinha[] }) {
  if (!linhas.length) {
    return (
      <div className="adm-empty">
        <b>Nenhuma avaliação ainda</b>
        <p>
          O espaço de avaliação da loja só abre para quem comprou a peça e teve o pedido confirmado. Assim que o
          primeiro cliente escrever, o depoimento aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="adm-rowcards">
      {linhas.map((l) => (
        <article key={l.id} className="adm-card adm-card-pad adm-aval">
          <header className="adm-aval__topo">
            <Estrelas nota={l.nota} tamanho={15} />
            <b>{l.autor}</b>
            <span className="adm-aval__verificado">Compra verificada</span>
            <time dateTime={l.data}>{dataLonga(l.data)}</time>
          </header>

          <p className="adm-aval__peca">
            <Link href={`/pecas/${l.pecaId}`}>{l.pecaNome}</Link>
            {l.pedidoId ? (
              <>
                {' · '}
                <Link href={`/pedidos/${l.pedidoId}`}>pedido nº {10000 + l.pedidoId}</Link>
              </>
            ) : null}
            {' · '}
            <span>{l.email}</span>
          </p>

          {l.comentario ? <p className="adm-aval__texto">{l.comentario}</p> : <p className="adm-aval__semtexto">Deu a nota, sem comentário.</p>}

          <footer className="adm-aval__acoes">
            <ConfirmButton
              label="Remover"
              title="Remover este depoimento?"
              description="Use isto apenas para conteúdo ofensivo, spam ou comentário sobre outra peça. Nota baixa de cliente real não deve ser apagada — a loja promete depoimentos verdadeiros, e remover crítica legítima quebra essa promessa. A remoção é definitiva."
              confirmLabel="Remover mesmo assim"
              onConfirm={() => excluirAvaliacao(l.id)}
            />
          </footer>
        </article>
      ))}
    </div>
  );
}
