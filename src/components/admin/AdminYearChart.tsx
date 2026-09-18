'use client';

import { useState } from 'react';
import { fmt } from '@/lib/format';
import { useLarguraGrafico } from '@/lib/admin/useLarguraGrafico';

export type MesGrafico = { rotulo: string; faturamento: number; lucro: number };

const COR_FATURAMENTO = '#5A616B';
const COR_LUCRO = '#3FD08A';

export function AdminYearChart({ dados }: { dados: MesGrafico[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const { ref, largura } = useLarguraGrafico();
  const max = Math.max(1, ...dados.map((d) => d.faturamento));
  const estreito = largura < 520;
  const W = largura;
  const H = estreito ? 190 : 220;
  const padTop = 10;
  const padBottom = 24;
  const plotH = H - padTop - padBottom;
  const passo = W / dados.length;
  const barW = Math.max(6, passo - (estreito ? 7 : 12));
  const y = (v: number) => padTop + plotH - (Math.max(0, v) / max) * plotH;

  const pontos = dados.map((d, i) => ({ x: i * passo + passo / 2, y: y(d.lucro) }));
  const linha = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const mesAtivo = ativo !== null ? dados[ativo] : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginBottom: 12, fontSize: 12, color: 'var(--tinta-2)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 8, height: 8, borderRadius: 2, background: COR_FATURAMENTO, display: 'inline-block' }} /> Faturamento
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i style={{ width: 12, height: 2, background: COR_LUCRO, display: 'inline-block' }} /> Lucro
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        style={{ display: 'block', touchAction: 'pan-y' }}
        role="img"
        aria-label="Faturamento e lucro dos últimos 12 meses"
        onMouseLeave={() => setAtivo(null)}
      >
        {dados.map((d, i) => (
          <g
            key={d.rotulo}
            onMouseEnter={() => setAtivo(i)}
            onPointerDown={() => setAtivo((a) => (a === i ? null : i))}
            style={{ cursor: 'pointer' }}
          >
            <rect x={i * passo} y={padTop} width={passo} height={plotH} fill="transparent" />
            <rect x={i * passo + (passo - barW) / 2} y={y(d.faturamento)} width={barW} height={padTop + plotH - y(d.faturamento)} rx={3} fill={COR_FATURAMENTO} opacity={ativo === i ? 1 : 0.85} />
          </g>
        ))}
        <path d={linha} fill="none" stroke={COR_LUCRO} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pontos.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={COR_LUCRO} />
        ))}
        {dados.map((d, i) =>
          estreito && i % 2 === 1 && i !== dados.length - 1 ? null : (
            <text key={d.rotulo} x={i * passo + passo / 2} y={H - 6} fontSize={11} fill="var(--tinta-3)" textAnchor="middle">
              {d.rotulo}
            </text>
          )
        )}
      </svg>

      {mesAtivo ? (
        <div
          style={{
            position: 'absolute',
            top: estreito ? 'auto' : 6,
            bottom: estreito ? -4 : 'auto',
            right: 0,
            left: estreito ? 0 : 'auto',
            background: 'var(--fundo-3)',
            border: '1px solid var(--linha-2)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12.5,
            minWidth: 160,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <b style={{ display: 'block', marginBottom: 6 }}>{mesAtivo.rotulo}</b>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tinta-2)' }}>
            <span>Faturamento</span>
            <span>{fmt(mesAtivo.faturamento)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: mesAtivo.lucro >= 0 ? '#3FD08A' : '#EA858B' }}>
            <span>Lucro</span>
            <span>{fmt(mesAtivo.lucro)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
