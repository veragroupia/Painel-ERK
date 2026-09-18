'use client';

import { Icon } from '@/components/ui/Icon';

/** Subir/descer um item da lista.
 *
 *  Arrastar e soltar do HTML5 não existe no dedo: os eventos de drag não
 *  disparam em tela de toque. Sem estes botões, no celular simplesmente não
 *  dá para reordenar a vitrine, o montador nem o catálogo.
 *
 *  Aparecem só na largura de celular; no computador o arrasto continua
 *  sendo o caminho, que é mais rápido para reordenar muita coisa. */
export function BotoesMover({
  aoSubir,
  aoDescer,
  primeiro,
  ultimo,
  rotulo,
  eixo = 'vertical',
  className,
}: {
  aoSubir: () => void;
  aoDescer: () => void;
  primeiro: boolean;
  ultimo: boolean;
  rotulo: string;
  /** numa grade de cartões o movimento é "para trás / para frente",
      então a seta aponta para os lados em vez de para cima e para baixo */
  eixo?: 'vertical' | 'horizontal';
  className?: string;
}) {
  const deitado = eixo === 'horizontal';
  return (
    <span className={'adm-mover' + (className ? ' ' + className : '')}>
      <button type="button" onClick={aoSubir} disabled={primeiro} aria-label={`Mover ${rotulo} para ${deitado ? 'trás' : 'cima'}`}>
        <Icon name={deitado ? 'seta' : 'adm_setacima'} size={15} style={deitado ? { transform: 'rotate(180deg)' } : undefined} />
      </button>
      <button type="button" onClick={aoDescer} disabled={ultimo} aria-label={`Mover ${rotulo} para ${deitado ? 'frente' : 'baixo'}`}>
        <Icon name={deitado ? 'seta' : 'adm_setabaixo'} size={15} />
      </button>
    </span>
  );
}
