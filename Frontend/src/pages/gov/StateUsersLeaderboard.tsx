import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { getRankLabel, getRankColor } from '@/lib/civicLabels';
import { Users } from 'lucide-react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';
import EmptyState from '@/components/dashboard/EmptyState';

type Entry = {
  rank: number;
  userId: string;
  name: string;
  city: string;
  userRank: string;
  karmaPoints: number;
};

const StateUsersLeaderboard = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Entry[]>('/api/state/users/leaderboard')
      .then((r) => setEntries(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardPage
      maxWidth="md"
      title="Top citizens (statewide)"
      description="Highest-karma residents across all seeded Punjab cities. Use this to spot civic champions for recognition programs."
    >
      {loading ? (
        <PageLoading />
      ) : entries.length === 0 ? (
        <EmptyState icon={Users} title="No citizen data" description="Rankings populate as users earn karma across cities." />
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.userId}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-black text-lg w-8 text-muted-foreground shrink-0 tabular-nums">#{e.rank}</span>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.city}</p>
                    <Badge className={`${getRankColor(e.userRank)} mt-1`}>{getRankLabel(e.userRank)}</Badge>
                  </div>
                </div>
                <span className="font-semibold text-primary shrink-0 tabular-nums">{e.karmaPoints}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardPage>
  );
};

export default StateUsersLeaderboard;
