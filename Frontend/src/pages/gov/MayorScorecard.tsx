import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import ScorecardStatCard from '@/components/gov/ScorecardStatCard';

const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

type DeptRow = {
  id: string;
  name: string;
  category?: string;
  avgResolutionDays: number;
  slaCompliancePercent: number;
  openIssues: number;
  resolvedIssuesCount?: number;
  derivedFromIssues?: boolean;
};

type ScorecardSummary = {
  openIssues: number;
  openIssuesTrend: number;
  resolvedLast30: number;
  resolvedPrior30: number;
  resolvedTrend: number;
  avgSlaCompliance: number;
  slaTrend: number;
  slaBreaches: number;
  redAlerts: number;
};

type ScorecardResponse = {
  summary: ScorecardSummary;
  departments: DeptRow[];
};

type TrendPoint = { label: string; resolved: number };

const MayorScorecard = () => {
  const [departments, setDepartments] = useState<DeptRow[]>([]);
  const [summary, setSummary] = useState<ScorecardSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ScorecardResponse>('/api/mayor/scorecard'),
      api.get<TrendPoint[]>('/api/mayor/trend'),
    ])
      .then(([sc, tr]) => {
        setSummary(sc.data.summary);
        setDepartments(sc.data.departments);
        setTrendData(tr.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  const resolutionData = departments.map((d) => ({ name: d.name.split(' ')[0], days: d.avgResolutionDays }));
  const slaData = departments.map((d) => ({ name: d.name.split(' ')[0], compliance: d.slaCompliancePercent }));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Department scorecard</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          City-wide KPIs compare the last 30 days to the prior 30. Department bars use{' '}
          <strong>real assigned issues</strong> in your city.
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <ScorecardStatCard label="Open issues" value={summary.openIssues} sublabel="Active workload" />
          <ScorecardStatCard
            label="Resolved (30d)"
            value={summary.resolvedLast30}
            sublabel={`${summary.resolvedPrior30} in prior 30d`}
            trend={summary.resolvedTrend}
          />
          <ScorecardStatCard
            label="Avg SLA compliance"
            value={`${summary.avgSlaCompliance}%`}
            trend={summary.slaTrend}
            trendLabel="pts vs prior 30d"
          />
          <ScorecardStatCard
            label="SLA breaches"
            value={summary.slaBreaches}
            sublabel={`${summary.redAlerts} red alerts open`}
            variant={summary.slaBreaches > 0 ? 'warning' : 'default'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg Resolution Time (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="days" radius={[6, 6, 0, 0]}>
                  {resolutionData.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SLA Compliance (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={slaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="compliance" radius={[6, 6, 0, 0]}>
                  {slaData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.compliance >= 90 ? '#22c55e' : entry.compliance >= 80 ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolution Rate — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved issues"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#22c55e' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rankings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...departments].sort((a, b) => a.avgResolutionDays - b.avgResolutionDays).map((d, i) => (
            <div key={d.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 gap-2 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-black text-muted-foreground w-6 shrink-0">#{i + 1}</span>
                <div className="min-w-0">
                  <span className="text-sm font-medium block truncate">{d.name}</span>
                  {d.derivedFromIssues ? (
                    <span className="text-[10px] text-success font-medium">Live from issues</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Awaiting assigned issues</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Badge variant="outline" className="text-xs">
                  {d.openIssues} open
                </Badge>
                {typeof d.resolvedIssuesCount === 'number' && d.resolvedIssuesCount > 0 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {d.resolvedIssuesCount} resolved
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {d.avgResolutionDays}d avg
                </Badge>
                <Badge
                  className={`text-xs ${d.slaCompliancePercent >= 90 ? 'bg-success/10 text-success' : d.slaCompliancePercent >= 80 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}
                >
                  {d.slaCompliancePercent}% SLA
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MayorScorecard;
