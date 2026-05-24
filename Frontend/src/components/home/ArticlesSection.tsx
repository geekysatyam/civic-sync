import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BookOpen, Loader2, User } from 'lucide-react';
import type { CivicArticle } from '@/types';
import { api } from '@/lib/api';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const ArticleCard = ({ article, onRead }: { article: CivicArticle; onRead: () => void }) => (
  <div className="group bg-card rounded-2xl border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
    <div className="h-36 bg-gradient-to-br from-accent/10 via-primary/10 to-success/10 flex items-center justify-center relative">
      {article.coverImageUrl && article.coverImageUrl !== '/placeholder.svg' ? (
        <img src={article.coverImageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <BookOpen className="w-10 h-10 text-muted-foreground/30 group-hover:text-accent/50 transition-colors" />
      )}
      <Badge className="absolute top-2 left-2 text-[10px] bg-accent/90 text-accent-foreground">{article.city}</Badge>
    </div>
    <div className="p-4 space-y-2 flex-1 flex flex-col">
      <h3 className="font-bold text-sm leading-tight text-card-foreground line-clamp-2">{article.headline}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{article.shortDescription}</p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <User className="w-3 h-3" /> {article.authorName}
        </span>
        <Button variant="ghost" size="sm" onClick={onRead} className="text-accent hover:text-accent/80 p-0 h-auto text-xs font-semibold">
          Read →
        </Button>
      </div>
    </div>
  </div>
);

const ArticlesSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [articles, setArticles] = useState<CivicArticle[]>([]);
  const [selected, setSelected] = useState<CivicArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CivicArticle[]>('/api/articles', { params: { limit: 6 } })
      .then((r) => setArticles(r.data.filter((a) => a.moderationStatus === 'approved')))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && articles.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div ref={ref} className="container max-w-6xl mx-auto px-4">
        <div
          className={`text-center mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">From the Community</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Citizen journalists and advocates writing about real issues and real solutions.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading articles…
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} onRead={() => setSelected(a)} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{selected.city}</Badge>
                  <span className="text-xs text-muted-foreground">by {selected.authorName}</span>
                </div>
                <DialogTitle className="text-xl font-black leading-tight">{selected.headline}</DialogTitle>
                <DialogDescription>{selected.shortDescription}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 text-sm leading-relaxed text-foreground whitespace-pre-line">
                {selected.fullContent}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ArticlesSection;
