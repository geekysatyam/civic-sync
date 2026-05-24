import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { Trophy, TrendingUp, AlertTriangle } from 'lucide-react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';

type Row = {
  rank: number;
  city: string;
  resolvedIssues: number;
  totalIssues: number;
  openIssues?: number;
  redAlerts?: number;
  satisfactionScore: number;
  whyRanked?: string;
};

const StateCityLeaderboard = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Row[]>('/api/state/leaderboard')
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardPage
      maxWidth="lg"
      title="Punjab city rankings"
      description="Cities ranked by resolution rate. Each card explains who is ahead and why — no redirect to a public page."
    >
      {loading ? (
        <PageLoading />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card
              key={r.city}
              className={`overflow-hidden transition-shadow hover:shadow-md ${r.rank === 1 ? 'ring-2 ring-primary/25 border-primary/30' : ''}`}
            >
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                  <div
                    className={`sm:w-16 flex items-center justify-center py-3 sm:py-0 font-black text-lg shrink-0 ${
                      r.rank === 1
                        ? 'bg-amber-50 text-amber-800'
                        : r.rank === 2
                          ? 'bg-slate-100 text-slate-700'
                          : r.rank === 3
                            ? 'bg-orange-50 text-orange-800'
                            : 'bg-muted/60 text-muted-foreground'
                    }`}
                  >
                    {r.rank === 1 ? <Trophy className="w-5 h-5" /> : `#${r.rank}`}
                  </div>
                  <div className="flex-1 p-4 space-y-3 min-w-0">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <p className="font-bold text-lg">{r.city}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                          {r.whyRanked ?? `${r.resolvedIssues} of ${r.totalIssues} resolved`}
                        </p>
                      </div>
                      <Badge variant={r.rank === 1 ? 'default' : 'secondary'} className="tabular-nums">
                        {r.satisfactionScore}% resolved
                      </Badge>
                    </div>
                    <Progress value={r.satisfactionScore} className="h-2.5" />
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        <strong className="text-foreground">{r.resolvedIssues}</strong> closed
                      </span>
                      <span>
                        <strong className="text-foreground">{r.totalIssues}</strong> total
                      </span>
                      {(r.openIssues ?? 0) > 0 && (
                        <span>
                          <strong className="text-foreground">{r.openIssues}</strong> open
                        </span>
                      )}
                      {(r.redAlerts ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-destructive font-medium">
                          <AlertTriangle className="w-3 h-3" /> {r.redAlerts} red alert{r.redAlerts! > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-muted-foreground px-1 pt-2">
            Ranking prioritizes resolution percentage, then total closures. Use heatmap and contractor status for operational follow-up.
          </p>
        </div>
      )}
    </DashboardPage>
  );
};

export default StateCityLeaderboard;
