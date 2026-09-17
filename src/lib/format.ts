// Formatação de moeda e texto na voz da ERK Pratas — porte fiel do mockup original.

const NB = ' ';

export function num(v: string | number): number {
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.'));
}

export function fmt(v: number): string {
  return 'R$' + NB + v.toFixed(2).replace('.', ',');
}

export function parcela(v: number): string {
  const n = v >= 200 ? 6 : 3;
  return n + 'x de ' + fmt(v / n) + ' sem juros';
}

export function norm(s: string | null | undefined): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function fotoUrl(fid: number, w: number): string {
  return `https://images.pexels.com/photos/${fid}/pexels-photo-${fid}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
