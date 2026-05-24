import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertTriangle, ArrowLeft, Share2 } from 'lucide-react';
import { getCategoryLabel, getCategoryColor } from '@/lib/civicLabels';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

type CityStats = {
  city: string;
  total: number;
  open: number;
  resolved: number;
  resolvedLast30: number;
  redAlerts: number;
  slaBreached: number;
  resolutionRate: number;
  categories: { category: string; count: number }[];
  departments: { name: string; category: string; avgResolutionDays: number; slaCompliance: number }[];
};

const CITIES: { label: string; slug: string }[] = [
  { label: 'Ludhiana', slug: 'ludhiana' },
  { label: 'Amritsar', slug: 'amritsar' },
  { label: 'Jalandhar', slug: 'jalandhar' },
  { label: 'Patiala', slug: 'patiala' },
  { label: 'SAS Nagar', slug: 'sahibzadaajitsinghnagar' },
  { label: 'Bathinda', slug: 'bathinda' },
  { label: 'Pathankot', slug: 'pathankot' },
  { label: 'Hoshiarpur', slug: 'hoshiarpur' },
  { label: 'Chandigarh', slug: 'chandigarh' },
];

const barColors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const PublicCityStats = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<CityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    api
      .get<CityStats>(`/api/stats/city/${slug}`)
      .then((r) => setStats(r.data))
      .catch(() => setError('City not found or stats unavailable.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    const text = stats ? `CivicSync — ${stats.city} has resolved ${stats.resolutionRate}% of civic issues.` : 'CivicSync city stats';
    if (navigator.share) {
      try {
        await navigator.share({ title: `CivicSync — ${stats?.city ?? 'City'} Stats`, text, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="gap-1.5">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" /> CivicSync
              </Link>
            </Button>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span className="text-sm font-semibold text-foreground hidden sm:inline">Public City Stats</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={slug} onValueChange={(v) => navigate(`/city/${v}/stats`)}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c.slug} value={c.slug} className="text-xs">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => void handleShare()} className="gap-1.5">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {loading && (
          <div className="flex justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading stats…
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
            <AlertTriangle className="w-8 h-8" />
            <p>{error}</p>
          </div>
        )}

        {stats && (
          <>
            <div>
              <h1 className="text-3xl font-black text-foreground">{stats.city}</h1>
              <p className="text-muted-foreground mt-1">Public accountability dashboard · Data updated in real time</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Reports', value: stats.total, variant: 'neutral' },
                { label: 'Open', value: stats.open, variant: 'warning' },
                { label: 'Resolved', value: stats.resolved, variant: 'success' },
                { label: 'Last 30d', value: stats.resolvedLast30, variant: 'success' },
                { label: 'Red Alerts', value: stats.redAlerts, variant: stats.redAlerts > 0 ? 'destructive' : 'neutral' },
                { label: 'SLA Breached', value: stats.slaBreached, variant: stats.slaBreached > 0 ? 'warning' : 'neutral' },
              ].map((s) => (
                <Card key={s.label} className="shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className={`text-2xl font-black tabular-nums ${
                      s.variant === 'success' ? 'text-green-700 dark:text-green-400' :
                      s.variant === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                      s.variant === 'destructive' ? 'text-red-700 dark:text-red-400' :
                      'text-foreground'
                    }`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stats.resolutionRate >= 70 ? 'bg-green-500' : stats.resolutionRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${stats.resolutionRate}%` }}
                  />
                </div>
                <span className="text-lg font-black tabular-nums shrink-0">{stats.resolutionRate}%</span>
                <span className="text-sm text-muted-foreground shrink-0">resolution rate</span>
              </CardContent>
            </Card>

            {stats.categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reports by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats.categories} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => getCategoryLabel(v).slice(0, 10)}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip formatter={(v) => [v, 'Reports']} labelFormatter={(l: string) => getCategoryLabel(l)} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {stats.categories.map((_, i) => (
                          <Cell key={i} fill={barColors[i % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {stats.categories.map((c) => (
                      <Badge key={c.category} className={`text-xs ${getCategoryColor(c.category)}`}>
                        {getCategoryLabel(c.category)}: {c.count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {stats.departments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Department Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.departments.map((d) => (
                    <div key={d.name} className="flex items-center justify-between bg-muted/40 rounded-lg px-4 py-3 gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{getCategoryLabel(d.category)}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{d.avgResolutionDays}d avg</Badge>
                        <Badge
                          className={`text-xs ${d.slaCompliance >= 90 ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300' : d.slaCompliance >= 75 ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300'}`}
                        >
                          {d.slaCompliance}% SLA
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <p className="text-center text-xs text-muted-foreground pb-4">
              Data sourced live from CivicSync reports · No login required ·{' '}
              <Link to="/" className="underline underline-offset-2">Back to CivicSync</Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default PublicCityStats;
