import { Icon } from '@/components/ui/Icon';

export function AdminEmptyState({ icon = 'adm_caixa', title, action }: { icon?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="adm-empty">
      <Icon name={icon} />
      <b>{title}</b>
      {action}
    </div>
  );
}
