import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrainCircuit, CalendarPlus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PredictiveAlert } from '@/types';
import { api } from '@/lib/api';

const severityColors = { low: 'bg-success/10 text-success', medium: 'bg-warning/10 text-warning', high: 'bg-destructive/10 text-destructive' };

const MayorPredictive = () => {
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PredictiveAlert[]>('/api/mayor/predictive')
      .then((r) => setAlerts(r.data))
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
        <BrainCircuit className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-black text-foreground">Predictive Maintenance</h1>
      </div>

      <p className="text-sm text-muted-foreground">AI-generated seasonal alerts based on historical complaint patterns.</p>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className={alert.severity === 'high' ? 'border-destructive/30' : ''}>
            <CardContent className="p-5 flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={severityColors[alert.severity]}>{alert.severity}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {alert.city}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {alert.neighborhood}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {alert.season}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{alert.message}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                type="button"
                onClick={() => toast({ title: 'Task Scheduled', description: `Preventive task created for ${alert.neighborhood}.` })}
              >
                <CalendarPlus className="w-3.5 h-3.5" /> Schedule Task
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MayorPredictive;
