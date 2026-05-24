import { useEffect, useState } from 'react';
import { cities } from '@/lib/civicLabels';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

type Row = { city: string; issueCount: number; redAlerts: number };

const StateHeatmap = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Row[]>('/api/state/heatmap')
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, []);

  const byCity = Object.fromEntries(rows.map((r) => [r.city, r]));

  if (loading) {
    return (
      <div className="p-8 flex justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-black text-foreground">State Heatmap</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => {
          const r = byCity[c.name];
          return (
            <Card key={c.id}>
              <CardContent className="p-4">
                <p className="font-bold">{c.name}</p>
                <p className="text-sm text-muted-foreground">Issues: {r?.issueCount ?? 0}</p>
                <p className="text-sm text-destructive">Red alerts: {r?.redAlerts ?? 0}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StateHeatmap;
