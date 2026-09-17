import { margemCor } from '@/lib/admin/status';

export function MarginBadge({ pct }: { pct: number }) {
  const cor = margemCor(pct);
  return (
    <span className="adm-margin" style={{ background: cor.bg, color: cor.fg }}>
      {pct.toFixed(0)}%
    </span>
  );
}
