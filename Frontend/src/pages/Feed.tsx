import { useEffect, useState } from 'react';
import { getCategoryLabel } from '@/lib/civicLabels';
import IssueCard from '@/components/shared/IssueCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Issue, IssueCategory } from '@/types';
import { api } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/dashboard/EmptyState';
import { useAuth } from '@/contexts/AuthContext';

const categories: (IssueCategory | 'all')[] = ['all', 'roads', 'water', 'parks', 'electricity', 'sanitation', 'public_safety'];

const Feed = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<IssueCategory | 'all'>('all');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params: Record<string, string | number> = { limit: 100 };
    if (user?.city) params.city = user.city;
    api
      .get<{ items: Issue[] }>('/api/issues', { params })
      .then((res) => {
        if (!cancelled) setIssues(res.data.items);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load the feed. Check that the backend is running.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.city]);

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.category === filter);

  return (
    <DashboardPage
      maxWidth="md"
      title="Neighborhood feed"
      description={
        user?.city
          ? `Issues and updates in ${user.city}. Upvote what matters and track fixes.`
          : 'Browse community issues, upvote priorities, and follow progress.'
      }
      actions={
        <Button asChild size="sm" className="gap-1.5">
          <Link to="/post">
            <Plus className="w-4 h-4" /> Report issue
          </Link>
        </Button>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {categories.map((cat) => (
              <Badge
                key={cat}
                className={`cursor-pointer whitespace-nowrap transition-all ${
                  filter === cat ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setFilter(cat)}
              >
                {cat === 'all' ? 'All' : getCategoryLabel(cat)}
              </Badge>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>

          {filtered.length === 0 && (
            <EmptyState
              title="No issues in this category"
              description="Try another filter or be the first to report a problem in your area."
              action={
                <Button asChild>
                  <Link to="/post">Report an issue</Link>
                </Button>
              }
            />
          )}
        </>
      )}

      <Link to="/post" className="md:hidden">
        <Button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25 z-50"
          aria-label="Report issue"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </DashboardPage>
  );
};

export default Feed;
