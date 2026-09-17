import { STATUS_COLOR, STATUS_LABEL } from '@/lib/admin/status';

export function StatusPill({ status }: { status: string }) {
  const cor = STATUS_COLOR[status] || STATUS_COLOR.novo;
  return (
    <span className="adm-pill" style={{ background: cor.bg, color: cor.fg }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
