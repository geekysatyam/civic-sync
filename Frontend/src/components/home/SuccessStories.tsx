import { useEffect, useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BookOpen, Loader2 } from 'lucide-react';
import type { StoryArticle } from '@/types';
import { api } from '@/lib/api';

const StoryCard = ({ story, onRead }: { story: StoryArticle; onRead: () => void }) => (
  <div className="group bg-card rounded-2xl border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
    <div className="h-44 bg-gradient-to-br from-primary/10 via-accent/10 to-success/10 flex items-center justify-center">
      <BookOpen className="w-12 h-12 text-muted-foreground/30 group-hover:text-accent/50 transition-colors" />
    </div>
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {story.city}
        </Badge>
      </div>
      <h3 className="font-bold text-base leading-tight text-card-foreground">{story.headline}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{story.shortDescription}</p>
      <Button variant="ghost" size="sm" onClick={onRead} className="text-accent hover:text-accent/80 p-0 h-auto font-semibold">
        Read More →
      </Button>
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

  return (
    <section id="stories" className="py-20 sm:py-28 bg-background">
      <div ref={ref} className="container max-w-6xl mx-auto px-4">
        <div
          className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">Success Stories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real communities. Real impact. See how citizens are transforming Punjab.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading stories…
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {storyArticles.map((story) => (
              <StoryCard key={story.id} story={story} onRead={() => setSelectedStory(story)} />
            ))}
          </div>
        )}

        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedStory && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{selectedStory.city}</Badge>
                  </div>
                  <DialogTitle className="text-xl font-black leading-tight">{selectedStory.headline}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">{selectedStory.shortDescription}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  <p className="text-sm leading-relaxed text-foreground">{selectedStory.fullStory}</p>

                  {selectedStory.citizenQuotes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-sm">What Citizens Said</h4>
                      {selectedStory.citizenQuotes.map((q, i) => (
                        <blockquote key={i} className="border-l-4 border-accent pl-4 text-sm italic text-muted-foreground">
                          {q}
                        </blockquote>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {selectedStory.outcomeStats.map((stat, i) => (
                      <div key={i} className="bg-muted rounded-lg p-3 text-center">
                        <span className="text-sm font-bold text-foreground">{stat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default SuccessStories;
