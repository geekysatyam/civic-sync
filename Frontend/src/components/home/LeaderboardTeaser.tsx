import { useEffect, useState } from 'react';
import { getRankLabel, getRankColor } from '@/lib/civicLabels';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trophy, Star, ArrowRight, Loader2 } from 'lucide-react';
import type { LeaderboardEntry } from '@/types';
import { api } from '@/lib/api';

const LeaderboardTeaser = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [leaderboardData, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>('/api/users/leaderboard')
      .then((r) => setData(r.data.slice(0, 5)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="leaderboard" className="py-20 sm:py-28 bg-section-lavender scroll-mt-20">
      <div ref={ref} className="container max-w-4xl mx-auto px-4">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-warning" />
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Community <span className="text-gradient-brand">leaderboard</span>
            </h2>
          </div>
          <p className="text-lg text-muted-foreground">Top civic heroes this month across Punjab.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div
            className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="divide-y">
              {leaderboardData.map((entry) => (
                <div key={entry.userId} className="flex items-center gap-4 p-4 sm:p-5 hover:bg-muted/50 transition-colors">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${entry.rank <= 3 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}
                  >
                    {entry.rank <= 3 ? <Star className="w-5 h-5 fill-current" /> : entry.rank}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{entry.name.charAt(0)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-card-foreground truncate">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.city}</p>
                  </div>

                  <Badge className={`hidden sm:inline-flex text-xs ${getRankColor(entry.userRank)}`}>{getRankLabel(entry.userRank)}</Badge>

                  <div className="text-right">
                    <p className="font-black text-sm text-card-foreground">{entry.karmaPoints.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">karma</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`text-center mt-8 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Button variant="outline" size="lg" className="rounded-xl gap-2 font-bold" asChild>
            <Link to="/leaderboard">
              See Full Leaderboard <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardTeaser;
