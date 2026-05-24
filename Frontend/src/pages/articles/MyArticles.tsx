import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { CivicArticle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

const MyArticles = () => {
  const [articles, setArticles] = useState<CivicArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CivicArticle[]>('/api/articles/mine')
      .then((r) => setArticles(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black">My articles</h1>
        <Button asChild>
          <Link to="/articles/write">Write new</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : articles.length === 0 ? (
        <p className="text-muted-foreground">No submissions yet.</p>
      ) : (
        <div className="space-y-4">
          {articles.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{a.headline}</CardTitle>
                  <Badge className={statusColor[a.moderationStatus] ?? ''}>{a.moderationStatus}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{a.city} · {a.createdAt?.slice(0, 10)}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.shortDescription}</p>
                {a.moderationNote && a.moderationStatus === 'rejected' && (
                  <p className="text-sm text-destructive mt-2">Note: {a.moderationNote}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyArticles;
