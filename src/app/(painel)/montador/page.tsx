import { prisma } from '@/lib/db';
import { MontadorOpcoes } from '@/components/admin/MontadorOpcoes';
import { MontadorPesos } from '@/components/admin/MontadorPesos';
import { MontadorPreco } from '@/components/admin/MontadorPreco';

const ETAPAS = [
  { id: 'tipo', nome: 'Tipo de peça' },
  { id: 'elo', nome: 'Elo' },
  { id: 'acabamento', nome: 'Acabamento' },
  { id: 'pingente', nome: 'Pingente' },
];

export default async function MontadorPage() {
  const [opcoes, pesos, precoPrata, settings] = await Promise.all([
    prisma.montadorOption.findMany({ orderBy: [{ step: 'asc' }, { order: 'asc' }] }),
    prisma.montadorWeight.findMany({ orderBy: [{ elo: 'asc' }, { espessura: 'asc' }, { medida: 'asc' }] }),
    prisma.silverPrice.findFirst({ orderBy: { at: 'desc' } }),
    prisma.settings.findUnique({ where: { id: 'shop' } }),
  ]);

  return (
    <div className="erk-entra" style={{ display: 'grid', gap: 22 }}>
      <div className="adm-cab">
        <div>
          <h1 className="adm-h">Montador</h1>
          <p className="adm-sub">As opções que o cliente vê ao montar a peça sob encomenda. Desligar uma opção tira ela do site na hora.</p>
        </div>
      </div>

      <div className="adm-grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          {ETAPAS.map((e) => (
            <MontadorOpcoes
              key={e.id}
              etapa={e.id}
              titulo={e.nome}
              opcoes={opcoes.filter((o) => o.step === e.id).map((o) => ({ id: o.id, nome: o.name, descricao: o.description, ativa: o.active }))}
            />
          ))}
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <MontadorPreco
            grama={precoPrata?.value ?? 6.6}
            laborMultiplier={settings?.laborMultiplier ?? 1}
            gravacaoSurcharge={settings?.gravacaoSurcharge ?? 15}
          />
          <MontadorPesos linhas={pesos.map((p) => ({ id: p.id, elo: p.elo, espessura: p.espessura, medida: p.medida, gramas: p.grams }))} />
        </div>
      </div>
    </div>
  );
}
