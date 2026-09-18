'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { ConfirmButton } from './ConfirmButton';
import { alternarOpcao, reordenarOpcoes, salvarOpcao, excluirOpcao } from '@/lib/admin/montadorActions';
import { BotoesMover } from './BotoesMover';

type Opcao = { id: string; nome: string; descricao: string; ativa: boolean };

export function MontadorOpcoes({ etapa, titulo, opcoes }: { etapa: string; titulo: string; opcoes: Opcao[] }) {
  const router = useRouter();
  const [ordem, setOrdem] = useState(opcoes);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novaDesc, setNovaDesc] = useState('');
  const [, start] = useTransition();

  function soltar(alvoId: string) {
    if (!arrastando || arrastando === alvoId) return;
    const atual = [...ordem];
    const de = atual.findIndex((o) => o.id === arrastando);
    const para = atual.findIndex((o) => o.id === alvoId);
    const [movido] = atual.splice(de, 1);
    atual.splice(para, 0, movido);
    setArrastando(null);
    aplicar(atual);
  }

  function aplicar(atual: typeof ordem) {
    setOrdem(atual);
    start(async () => {
      await reordenarOpcoes(atual.map((o) => o.id));
      router.refresh();
    });
  }

  function mover(de: number, para: number) {
    if (para < 0 || para >= ordem.length) return;
    const atual = [...ordem];
    const [movido] = atual.splice(de, 1);
    atual.splice(para, 0, movido);
    aplicar(atual);
  }

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-stat__label" style={{ marginBottom: 12 }}>
        {titulo}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {ordem.map((o, i) => (
          <div
            key={o.id}
            className="adm-drag-row"
            draggable
            onDragStart={() => setArrastando(o.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => soltar(o.id)}
            style={{ opacity: arrastando === o.id ? 0.5 : o.ativa ? 1 : 0.55 }}
          >
            <Icon name="adm_arrasto" size={16} className="adm-drag-handle" />
            <BotoesMover aoSubir={() => mover(i, i - 1)} aoDescer={() => mover(i, i + 1)} primeiro={i === 0} ultimo={i === ordem.length - 1} rotulo={o.nome} />
            <span className="adm-drag-fig">
              <Icon name="adm_pecas" size={15} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 13.5 }}>{o.nome}</b>
              <em style={{ display: 'block', fontStyle: 'normal', fontSize: 11.5, color: 'var(--tinta-3)' }}>{o.descricao}</em>
            </span>
            <label className="adm-switch" title={o.ativa ? 'no site' : 'fora do site'}>
              <input type="checkbox" checked={o.ativa} onChange={(e) => start(async () => { await alternarOpcao(o.id, e.target.checked); router.refresh(); })} />
              <span className="adm-switch-track" />
            </label>
            <ConfirmButton
              label={<Icon name="adm_lixeira" size={14} />}
              className="erk-btn erk-btn--s erk-btn--sm"
              title={`Excluir "${o.nome}"?`}
              description="A opção some do montador no site. Peças já vendidas com ela continuam registradas do jeito que foram feitas."
              confirmLabel="Excluir opção"
              onConfirm={async () => {
                await excluirOpcao(o.id);
                router.refresh();
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <input className="adm-input adm-input--sm" style={{ flex: '1 1 130px' }} value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="nova opção" />
        <input className="adm-input adm-input--sm" style={{ flex: '1 1 160px' }} value={novaDesc} onChange={(e) => setNovaDesc(e.target.value)} placeholder="descrição curta" />
        <button
          type="button"
          className="erk-btn erk-btn--s erk-btn--sm"
          disabled={!novoNome.trim()}
          onClick={() =>
            start(async () => {
              await salvarOpcao({ step: etapa, name: novoNome, description: novaDesc });
              setNovoNome('');
              setNovaDesc('');
              router.refresh();
            })
          }
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
