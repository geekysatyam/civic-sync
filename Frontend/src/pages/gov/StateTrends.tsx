import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { PredictiveAlert } from '@/types';

const sevColors: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive',
  high: 'bg-warning/10 text-warning',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-success/10 text-success',
  positive: 'bg-success/10 text-success',
};

const StateTrends = () => {
  const [cards, setCards] = useState<PredictiveAlert[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ cards: PredictiveAlert[]; summary: string }>('/api/state/trends')
      .then((r) => {
        setCards(r.data.cards);
        setSummary(r.data.summary);
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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-black text-foreground">Trend Analysis</h1>
      </div>

      <p className="text-sm text-muted-foreground">{summary}</p>

      <div className="space-y-4">
        {cards.map((ins, idx) => {
          const trend = ins.severity === 'high' ? 'up' : 'down';
          const sev = ins.severity === 'high' ? 'critical' : ins.severity;
          return (
            <Card key={ins.id || String(idx)} className={sev === 'critical' ? 'border-destructive/30' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  {trend === 'up' ? (
                    <TrendingUp className="w-5 h-5 mt-0.5 shrink-0 text-destructive" />
                  ) : (
                    <TrendingDown className="w-5 h-5 mt-0.5 shrink-0 text-success" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-2">{ins.message}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${sevColors[sev] || ''}`}>{sev}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {ins.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ins.city}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StateTrends;
