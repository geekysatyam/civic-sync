import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, User, Clock, ArrowRight, Newspaper } from 'lucide-react';
import type { CivicArticle } from '@/types';
import { api } from '@/lib/api';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const CATEGORY_COLORS: Record<string, string> = {
  roads: 'bg-amber-500',
  water: 'bg-blue-500',
  parks: 'bg-green-500',
  electricity: 'bg-yellow-500',
  sanitation: 'bg-lime-500',
  public_safety: 'bg-red-500',
};

function readTime(text: string) {
  const words = text?.split(' ').length ?? 0;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

const FeaturedCard = ({ article, onRead }: { article: CivicArticle; onRead: () => void }) => (
  <div
    className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
    onClick={onRead}
  >
    <div className="h-72 w-full relative">
      {article.coverImageUrl && article.coverImageUrl !== '/placeholder.svg' ? (
        <img src={article.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-violet-500 text-white border-0 text-[10px]">{article.city}</Badge>
        <span className="text-white/60 text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />{readTime(article.fullContent ?? '')}
        </span>
      </div>
      <h3 className="font-black text-lg leading-tight mb-1 line-clamp-2">{article.headline}</h3>
      <p className="text-white/70 text-xs line-clamp-2 mb-3">{article.shortDescription}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60 flex items-center gap-1">
          <User className="w-3 h-3" />{article.authorName}
        </span>
        <span className="text-xs font-semibold text-violet-300 flex items-center gap-1 group-hover:gap-2 transition-all">
          Read <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  </div>
);

const SmallCard = ({ article, onRead }: { article: CivicArticle; onRead: () => void }) => (
  <div
    className="group flex gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-sm"
    onClick={onRead}
  >
    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative">
      {article.coverImageUrl && article.coverImageUrl !== '/placeholder.svg' ? (
        <img src={article.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className={`w-full h-full ${CATEGORY_COLORS[article.category ?? ''] ?? 'bg-gradient-to-br from-violet-500 to-blue-500'} flex items-center justify-center`}>
          <Newspaper className="w-6 h-6 text-white/70" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{article.city}</Badge>
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />{readTime(article.fullContent ?? '')}
        </span>
      </div>
      <h4 className="font-bold text-sm leading-tight line-clamp-2 text-card-foreground">{article.headline}</h4>
      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
        <User className="w-2.5 h-2.5" />{article.authorName}
      </p>
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
      .get<CivicArticle[]>('/api/articles', { params: { limit: 7 } })
      .then((r) => setArticles(r.data.filter((a) => a.moderationStatus === 'approved')))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && articles.length === 0) return null;

  const [featured, ...rest] = articles;

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div ref={ref} className="container max-w-6xl mx-auto px-4">
        <div className={`flex items-end justify-between mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-2">Community Voice</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">From the Community</h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Citizen journalists and advocates writing about real issues and real solutions.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading articles…
          </div>
        ) : (
          <div className={`grid lg:grid-cols-5 gap-5 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {featured && (
              <div className="lg:col-span-3">
                <FeaturedCard article={featured} onRead={() => setSelected(featured)} />
              </div>
            )}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {rest.slice(0, 4).map((a) => (
                <SmallCard key={a.id} article={a} onRead={() => setSelected(a)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                {selected.coverImageUrl && selected.coverImageUrl !== '/placeholder.svg' && (
                  <div className="h-48 rounded-xl overflow-hidden mb-4 -mx-1">
                    <img src={selected.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{selected.city}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{readTime(selected.fullContent ?? '')}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                    <User className="w-3 h-3" />{selected.authorName}
                  </span>
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
