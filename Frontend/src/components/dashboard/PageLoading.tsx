import { Loader2 } from 'lucide-react';

export const PageLoading = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground" role="status">
    <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden />
    <p className="text-sm font-medium">{label}</p>
  </div>
);

export default PageLoading;
