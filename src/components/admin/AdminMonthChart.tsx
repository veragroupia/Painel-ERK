'use client';

import { useState } from 'react';
import { fmt } from '@/lib/format';

export type DiaGrafico = { dia: number; custo: number; lucro: number; faturamento: number };

const COR_CUSTO = '#5A616B';
const COR_LUCRO = '#3FD08A';
const COR_FATURAMENTO = '#F2F4F7';

export function AdminMonthChart({ dados }: { dados: DiaGrafico[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const max = Math.max(1, ...dados.map((d) => d.faturamento));
  const W = 760;
  const H = 220;
  const padTop = 10;
  const padBottom = 22;
  const plotH = H - padTop - padBottom;
  const barGap = 3;
  const barW = Math.max(3, W / dados.length - barGap);
  const y = (v: number) => padTop + plotH - (v / max) * plotH;

  const pontosLinha = dados.map((d, i) => {
    const x = i * (W / dados.length) + (W / dados.length) / 2;
    return { x, y: y(d.faturamento), d };
  });
  const linhaPath = pontosLinha.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const diaAtivo = ativo !== null ? dados[ativo] : null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 18, marginBottom: 12, fontSize: 12, color: 'var(--tinta-2)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 8, height: 8, borderRadius: 2, background: COR_CUSTO, display: 'inline-block' }} /> Custo
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 8, height: 8, borderRadius: 2, background: COR_LUCRO, display: 'inline-block' }} /> Lucro
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 12, height: 2, background: COR_FATURAMENTO, display: 'inline-block' }} /> Faturamento
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Gráfico de custo, lucro e faturamento por dia do mês" onMouseLeave={() => setAtivo(null)}>
        {dados.map((d, i) => {
          const x = i * (W / dados.length) + barGap / 2;
          const custoH = (d.custo / max) * plotH;
          const lucroH = (d.lucro / max) * plotH;
          const semVenda = d.faturamento === 0;
          return (
            <g key={d.dia} onMouseEnter={() => setAtivo(i)}>
              <rect x={x - 1} y={padTop} width={barW + 2} height={plotH} fill="transparent" />
              {semVenda ? (
                <rect x={x} y={padTop + plotH - 2} width={barW} height={2} rx={1} fill="var(--linha-2)" />
              ) : (
                <>
                  <rect x={x} y={padTop + plotH - custoH} width={barW} height={Math.max(0, custoH - 1)} fill={COR_CUSTO} rx={2} />
                  <rect x={x} y={padTop + plotH - custoH - lucroH} width={barW} height={Math.max(0, lucroH - 1)} fill={COR_LUCRO} rx={2} />
                </>
              )}
              {ativo === i ? <rect x={x - 1} y={padTop} width={barW + 2} height={plotH} fill="none" stroke="var(--linha-2)" strokeDasharray="2 2" /> : null}
            </g>
          );
        })}
        <path d={linhaPath} fill="none" stroke={COR_FATURAMENTO} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pontosLinha
          .filter((_, i) => i % 5 === 0 || i === pontosLinha.length - 1)
          .map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={COR_FATURAMENTO} />
          ))}
        {dados.map((d, i) =>
          d.dia % 5 === 0 || i === 0 ? (
            <text key={d.dia} x={i * (W / dados.length) + W / dados.length / 2} y={H - 4} fontSize={10} fill="var(--tinta-3)" textAnchor="middle">
              {d.dia}
            </text>
          ) : null
        )}
      </svg>

      {diaAtivo ? (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 0,
            background: 'var(--fundo-3)',
            border: '1px solid var(--linha-2)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12.5,
            minWidth: 150,
            pointerEvents: 'none',
            boxShadow: '0 8px 22px rgba(0,0,0,.5)',
          }}
        >
          <b style={{ display: 'block', marginBottom: 6, color: 'var(--tinta)' }}>Dia {diaAtivo.dia}</b>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tinta-2)' }}>
            <span>Faturamento</span>
            <span>{fmt(diaAtivo.faturamento)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tinta-2)' }}>
            <span>Custo</span>
            <span>{fmt(diaAtivo.custo)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3FD08A' }}>
            <span>Lucro</span>
            <span>{fmt(diaAtivo.lucro)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
