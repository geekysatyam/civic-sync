import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="rounded-2xl border border-dashed bg-muted/30 px-6 py-12 text-center">
    {Icon ? (
      <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
    ) : null}
    <p className="font-semibold text-foreground">{title}</p>
    {description ? <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{description}</p> : null}
    {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
  </div>
);

export default EmptyState;
