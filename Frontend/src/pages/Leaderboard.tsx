import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRankLabel, getRankColor } from '@/lib/civicLabels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, ArrowLeft } from 'lucide-react';
import type { LeaderboardEntry } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PageLoading from '@/components/dashboard/PageLoading';
import EmptyState from '@/components/dashboard/EmptyState';

const Leaderboard = () => {
  const { isAuthenticated, user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = user?.city && isAuthenticated ? { city: user.city } : undefined;
    api
      .get<LeaderboardEntry[]>('/api/users/leaderboard', { params })
      .then((r) => setEntries(r.data))
      .finally(() => setLoading(false));
  }, [user?.city, isAuthenticated]);

  const backTo = isAuthenticated ? '/feed' : '/';
  const backLabel = isAuthenticated ? 'Back to feed' : 'Back to home';

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6 gap-1.5">
          <Link to={backTo}>
            <ArrowLeft className="w-4 h-4" /> {backLabel}
          </Link>
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Trophy className="w-7 h-7 text-amber-500" />
            <h1 className="text-3xl font-black text-foreground">Community leaderboard</h1>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            {user?.city && isAuthenticated
              ? `Top contributors in ${user.city}, ranked by karma.`
              : 'Top civic participants across Punjab, ranked by karma points.'}
          </p>
        </div>

        {loading ? (
          <PageLoading label="Loading rankings…" />
        ) : entries.length === 0 ? (
          <EmptyState icon={Trophy} title="No rankings yet" description="Earn karma by reporting issues and volunteering in your city." />
        ) : (
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden divide-y">
            {entries.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-4 p-4 sm:p-5 hover:bg-muted/50 transition-colors">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                    entry.rank <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {entry.rank <= 3 ? <Star className="w-5 h-5 fill-current" /> : entry.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{entry.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-card-foreground truncate">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.city}</p>
                </div>
                <Badge className={`hidden sm:inline-flex text-xs ${getRankColor(entry.userRank)}`}>
                  {getRankLabel(entry.userRank)}
                </Badge>
                <div className="text-right shrink-0 tabular-nums">
                  <p className="font-black text-sm text-card-foreground">{entry.karmaPoints.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">karma</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
