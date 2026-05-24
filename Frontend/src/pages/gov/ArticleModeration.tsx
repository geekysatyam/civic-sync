import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CivicArticle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Check, X, FileCheck } from 'lucide-react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';
import EmptyState from '@/components/dashboard/EmptyState';

type Props = { title?: string };

const ArticleModeration = ({ title = 'Article moderation' }: Props) => {
  const [queue, setQueue] = useState<CivicArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get<CivicArticle[]>('/api/articles/pending')
      .then((r) => setQueue(r.data))
      .catch(() => toast({ title: 'Could not load queue', variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (id: string, action: 'approve' | 'reject') => {
    setActing(id);
    try {
      await api.patch(`/api/articles/${id}/moderate`, { action, note: notes[id] ?? '' });
      toast({ title: action === 'approve' ? 'Approved' : 'Rejected' });
      load();
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setActing(null);
    }
  };

  return (
    <DashboardPage
      maxWidth="md"
      title={title}
      description="Review submitted stories before they appear in public success stories. Add a note when rejecting so authors can revise."
      actions={<Badge variant="secondary">{queue.length} pending</Badge>}
    >
      {loading ? (
        <PageLoading />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="Queue is clear"
          description="No articles waiting for review. New submissions from mayors and city guardians will show up here."
        />
      ) : (
        <div className="space-y-4">
          {queue.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="text-lg leading-snug">{a.headline}</CardTitle>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{a.city}</span>
                  <Badge variant="outline">{a.authorRole}</Badge>
                  <span>by {a.authorName}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{a.shortDescription}</p>
                <Textarea
                  placeholder="Moderation note (optional; shown on reject)"
                  value={notes[a.id] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={acting === a.id} onClick={() => void moderate(a.id, 'approve')}>
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" disabled={acting === a.id} onClick={() => void moderate(a.id, 'reject')}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardPage>
  );
};

export default ArticleModeration;
