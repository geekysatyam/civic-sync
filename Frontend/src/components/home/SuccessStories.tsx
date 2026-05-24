import { useEffect, useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Quote, Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import type { StoryArticle } from '@/types';
import { api } from '@/lib/api';

const CITY_GRADIENTS: Record<string, string> = {
  Ludhiana:   'from-orange-500 to-red-500',
  Amritsar:   'from-yellow-500 to-orange-500',
  Jalandhar:  'from-blue-500 to-cyan-500',
  Patiala:    'from-purple-500 to-violet-500',
  Chandigarh: 'from-teal-500 to-green-500',
  Bathinda:   'from-pink-500 to-rose-500',
  Pathankot:  'from-indigo-500 to-blue-500',
  Hoshiarpur: 'from-emerald-500 to-teal-500',
};

function gradient(city: string) {
  return CITY_GRADIENTS[city] ?? 'from-violet-500 to-blue-500';
}

const StoryCard = ({ story, onRead }: { story: StoryArticle; onRead: () => void }) => (
  <div
    className="group bg-card rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
    onClick={onRead}
  >
    <div className="h-44 relative overflow-hidden">
      {story.coverImageUrl && story.coverImageUrl !== '/placeholder.svg' ? (
        <>
          <img src={story.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient(story.city)}`} />
      )}
      <div className="absolute top-3 left-3">
        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs">{story.city}</Badge>
      </div>
      {story.outcomeStats?.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 flex gap-2">
          {story.outcomeStats.slice(0, 2).map((stat, i) => (
            <div key={i} className="bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-[10px] font-semibold">
              {stat}
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="p-4 flex flex-col flex-1">
      <h3 className="font-bold text-sm leading-tight text-card-foreground line-clamp-2 mb-2">{story.headline}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{story.shortDescription}</p>

      {story.citizenQuotes?.length > 0 && (
        <div className="mt-3 flex items-start gap-1.5 bg-muted/50 rounded-lg p-2">
          <Quote className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground italic line-clamp-2">{story.citizenQuotes[0]}</p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Resolved</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-blue-500" /> Community</span>
        </div>
        <span className="text-[11px] font-semibold text-violet-500 group-hover:text-violet-400 transition-colors">
          Read story →
        </span>
      </div>
    </div>
  </div>
);

const SuccessStories = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [selectedStory, setSelectedStory] = useState<StoryArticle | null>(null);
  const [storyArticles, setStories] = useState<StoryArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<StoryArticle[]>('/api/stories')
      .then((r) => setStories(r.data))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && storyArticles.length === 0) return null;

  return (
    <section id="stories" className="py-20 sm:py-28 bg-background">
      <div ref={ref} className="container max-w-6xl mx-auto px-4">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-2">Real Impact</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Success Stories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real communities. Real impact. See how citizens are transforming Punjab.
          </p>

          <div className="flex items-center justify-center gap-8 mt-8">
            {[
              { icon: CheckCircle2, color: 'text-emerald-500', label: 'Issues Resolved', value: '108+' },
              { icon: Users,        color: 'text-blue-500',    label: 'Citizens Involved', value: '73+' },
              { icon: TrendingUp,   color: 'text-violet-500',  label: 'Cities Active', value: '9' },
              { icon: Clock,        color: 'text-amber-500',   label: 'Avg Resolution', value: '4 days' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                <div className="text-xl font-black text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading stories…
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {storyArticles.map((story) => (
              <StoryCard key={story.id} story={story} onRead={() => setSelectedStory(story)} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedStory && (
            <>
              <DialogHeader>
                {selectedStory.coverImageUrl && selectedStory.coverImageUrl !== '/placeholder.svg' ? (
                  <div className="h-52 rounded-xl overflow-hidden mb-4 -mx-1">
                    <img src={selectedStory.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`h-32 rounded-xl bg-gradient-to-br ${gradient(selectedStory.city)} mb-4 -mx-1`} />
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedStory.city}</Badge>
                </div>
                <DialogTitle className="text-xl font-black leading-tight">{selectedStory.headline}</DialogTitle>
                <DialogDescription>{selectedStory.shortDescription}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {selectedStory.outcomeStats?.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedStory.outcomeStats.map((stat, i) => (
                      <div key={i} className="bg-muted rounded-xl p-3 text-center">
                        <span className="text-sm font-bold text-foreground">{stat}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm leading-relaxed text-foreground">{selectedStory.fullStory}</p>

                {selectedStory.citizenQuotes?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Quote className="w-4 h-4 text-violet-400" /> What Citizens Said
                    </h4>
                    {selectedStory.citizenQuotes.map((q, i) => (
                      <blockquote key={i} className="border-l-4 border-violet-400 pl-4 text-sm italic text-muted-foreground bg-muted/30 py-2 rounded-r-lg">
                        {q}
                      </blockquote>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SuccessStories;
