import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DashboardPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  maxWidth?: 'md' | 'lg' | 'xl' | 'full';
};

const maxW = {
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  full: 'max-w-none',
};

export const DashboardPage = ({
  title,
  description,
  actions,
  children,
  className,
  maxWidth = 'lg',
}: DashboardPageProps) => (
  <div className={cn('page-shell py-4 sm:py-6 w-full', maxW[maxWidth], className)}>
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </header>
    {children}
  </div>
);

export default DashboardPage;
