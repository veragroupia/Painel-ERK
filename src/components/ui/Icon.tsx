import type { CSSProperties } from 'react';

/* Conjunto de ícones do mockup de origem: traço 1.5, viewBox 24, pontas e
   junções arredondadas, sem preenchimento. Extraídos verbatim do handoff. */
const ERK_ICONS: Record<string, string[]> = {
  busca: ['circle:11,11,7', 'M20 20l-4.3-4.3'],
  conta: ['circle:12,8,3.6', 'M4.5 20a7.5 7.5 0 0 1 15 0'],
  favorito: ['M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6C20.5 15 12 20.5 12 20.5Z'],
  sacola: ['M5.5 8h13l-1 12h-11z', 'M9 8V6.5a3 3 0 0 1 6 0V8'],
  inicio: ['M4 10.5L12 4l8 6.5V20H4z', 'M9.5 20v-5.5h5V20'],
  seta: ['M9 6l6 6-6 6'],
  mais: ['M12 5v14M5 12h14'],
  menos: ['M5 12h14'],
  filtro: ['M4 6h16M7 12h10M10 18h4'],
  grade: ['rect:4,4,6.5,6.5,1.4', 'rect:13.5,4,6.5,6.5,1.4', 'rect:4,13.5,6.5,6.5,1.4', 'rect:13.5,13.5,6.5,6.5,1.4'],
  correntes: ['circle:7.5,7.5,3.1', 'circle:12,12,3.1', 'circle:16.5,16.5,3.1'],
  pulseiras: ['ellipse:12,12.5,7.2,5.2', 'rect:10.2,5.6,3.6,2.6,0.8'],
  aneis: ['circle:12,14,5.6', 'M9.3 7.6L12 4.2l2.7 3.4'],
  pingentes: ['M3.5 7.5h17', 'M12 7.5v3.2', 'circle:12,14.6,3.7'],
  brincos: ['M8.8 6.2a3.2 3.2 0 0 1 6.4 0', 'circle:12,14.6,4.6'],
  conjuntos: ['circle:9,9.8,4.4', 'circle:15.3,14.6,4.4'],
  puncao: ['circle:12,9.5,5.5', 'M9 14.5L8 21l4-2 4 2-1-6.5'],
  garantia: ['M12 3l7 3v5.5c0 4.3-2.9 7.6-7 8.5-4.1-.9-7-4.2-7-8.5V6z', 'M9 12l2 2 4-4'],
  entrega: ['circle:6,17,3', 'circle:18,17,3', 'M9 17h6l-2-8h3M6 9h4'],
  oficina: ['M14 4l6 6-3 3-6-6z', 'M11 7L4 14l3 3 7-7'],
  check: ['circle:12,12,9', 'M8.5 12.3l2.4 2.4 4.6-4.9'],
  fechar: ['M6 6l12 12M18 6L6 18'],
  hamburguer: ['M4 7.5h16M4 12h16M4 16.5h11'],
  voltar: ['M15 5l-7 7 7 7'],
  sair: ['M14 5H6v14h8', 'M13 12h7M17 9l3 3-3 3'],
  perfil: ['circle:12,8.5,3.5', 'M5.5 20c.6-3.4 3.3-5.2 6.5-5.2s5.9 1.8 6.5 5.2'],

  /* ---- painel administrativo ---- */
  adm_visao: ['M3 12l9-8 9 8', 'M5 10v10h14V10'],
  adm_pedidos: ['M4 7h16l-1.4 12.2A2 2 0 0 1 16.6 21H7.4a2 2 0 0 1-2-1.8L4 7Z', 'M9 7V5a3 3 0 0 1 6 0v2'],
  adm_pecas: ['M7 4h10l4 5-9 11L3 9l4-5Z', 'M3 9h18'],
  adm_vitrine: ['M4 9h16v11H4V9Z', 'M4 9l2-5h12l2 5', 'M9 20v-6h6v6'],
  adm_montador: ['M5 6h14M5 12h14M5 18h14', 'circle:9,6,2', 'circle:15,12,2', 'circle:8,18,2'],
  adm_insumos: ['M6 3h12v4l-4 4v10H10V11L6 7V3Z'],
  adm_financeiro: ['M4 19V5', 'M4 19h16', 'M8 16v-5M13 16V8M18 16v-3'],
  adm_clientes: ['circle:9,10,3', 'circle:16.2,10,2.6', 'M4 20c.8-3 3-4.6 5.6-4.6', 'M13.2 20c.6-3.2 2.6-5 5.4-5'],
  adm_ajustes: ['circle:12,12,3', 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1'],
  adm_lixeira: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13'],
  adm_lapis: ['M4 20l1-4L16 5l3 3L8 19l-4 1Z'],
  adm_upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M5 20h14'],
  adm_imagem: ['rect:3,4,18,16,3', 'circle:9,10,1.6', 'M4 17l5-5 4 4 3-3 4 4'],
  adm_cubo: ['M12 3l8 4.5v9L12 21l-8-4.5v-9Z', 'M12 3v9', 'M4 7.5l8 4.5 8-4.5'],
  adm_sino: ['M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6', 'M10.5 19a1.7 1.7 0 0 0 3 0'],
  adm_relogio: ['circle:12,12,8.5', 'M12 8v4l3 2'],
  adm_envio: ['M3 8h11v8H3z', 'M14 11h4l3 3v2h-7', 'circle:7,18,1.8', 'circle:17.5,18,1.8'],
  adm_caixa: ['M3 8l9-4 9 4-9 4-9-4Z', 'M3 8v9l9 4 9-4V8', 'M12 12v9'],
  adm_setacima: ['M12 19V5', 'M6 11l6-6 6 6'],
  adm_setabaixo: ['M12 5v14', 'M6 13l6 6 6-6'],
  adm_copiar: ['rect:8,8,12,12,2', 'M4 16V4h12v3'],
  adm_whats: ['M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.5 8.5 0 0 1-4-1L3 20l1.1-5a8.4 8.4 0 0 1-.9-3.8A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z'],
  adm_print: ['rect:5,9,14,7,1', 'M7 9V4h10v5', 'rect:8,14,8,5,1'],
  adm_calendario: ['rect:3,5,18,16,2', 'M3 10h18', 'M8 3v4M16 3v4'],
  adm_arrasto: ['circle:9,6,1.2', 'circle:15,6,1.2', 'circle:9,12,1.2', 'circle:15,12,1.2', 'circle:9,18,1.2', 'circle:15,18,1.2'],
  adm_chevronbaixo: ['M6 9l6 6 6-6'],
  adm_chevrondireita: ['M9 6l6 6-6 6'],
  adm_estrela: ['M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3L3 9.5l6.4-.6Z'],
  adm_info: ['circle:12,12,9', 'M12 11v5', 'circle:12,8,.15'],
  adm_alerta: ['M12 3l10 18H2Z', 'M12 9v5', 'circle:12,17,.15'],
};

function shape(d: string, i: number) {
  if (d.startsWith('circle:')) {
    const [cx, cy, r] = d.slice(7).split(',');
    return <circle key={i} cx={cx} cy={cy} r={r} />;
  }
  if (d.startsWith('ellipse:')) {
    const [cx, cy, rx, ry] = d.slice(8).split(',');
    return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />;
  }
  if (d.startsWith('rect:')) {
    const [x, y, w, h, r] = d.slice(5).split(',');
    return <rect key={i} x={x} y={y} width={w} height={h} rx={r} />;
  }
  return <path key={i} d={d} />;
}

export function Icon({
  name,
  size,
  style,
  className,
  title,
}: {
  name: string;
  size?: number | string;
  style?: CSSProperties;
  className?: string;
  title?: string;
}) {
  const parts = ERK_ICONS[name] || [];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={className}
      style={size ? { width: size, height: size, ...style } : style}
    >
      {title ? <title>{title}</title> : null}
      {parts.map(shape)}
    </svg>
  );
}
