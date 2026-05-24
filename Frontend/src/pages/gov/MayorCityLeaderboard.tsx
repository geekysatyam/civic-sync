import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Trophy } from 'lucide-react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';
import CivicLeaderboard from '@/components/leaderboard/CivicLeaderboard';
import type { LeaderboardEntry } from '@/types';

const MayorCityLeaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>('/api/mayor/leaderboard')
      .then((r) => setEntries(r.data))
      .finally(() => setLoading(false));
  }, []);

  const cityName = entries[0]?.city ?? 'your city';

  return (
    <DashboardPage
      maxWidth="lg"
      title="City civic rankings"
      description={`Who is leading in ${cityName}, and why — karma breakdown stays on this page (no public leaderboard).`}
    >
      {loading ? (
        <PageLoading />
      ) : (
        <CivicLeaderboard
          entries={entries}
          title="Top contributors"
          subtitle="Ranked by karma. Each row shows reports, volunteer hours, and community solutions that built the score."
        />
      )}
      {!loading && !entries.length ? (
        <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4" /> Citizen karma will appear as residents report and resolve issues.
        </p>
      ) : null}
    </DashboardPage>
  );
};

export default MayorCityLeaderboard;
