import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Issue } from '@/types';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Bell, ExternalLink, Loader2 } from 'lucide-react';

const StateEmergency = () => {
  const [redAlerts, setRedAlerts] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [pingingCity, setPingingCity] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Issue[]>('/api/state/emergency-feed')
      .then((r) => setRedAlerts(r.data))
      .finally(() => setLoading(false));
  }, []);

  const pingMayor = async (city: string) => {
    setPingingCity(city);
    try {
      const { data } = await api.post<{ ok: boolean; notified: number }>(`/api/state/ping-mayor/${encodeURIComponent(city)}`);
      toast({
        title: 'Mayor notified',
        description: data.notified ? `${data.notified} mayor office(s) alerted for ${city}.` : `No mayor account found for ${city}.`,
      });
    } catch {
      toast({ title: 'Ping failed', variant: 'destructive' });
    } finally {
      setPingingCity(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-black text-foreground">Emergency Feed</h1>
      <p className="text-sm text-muted-foreground -mt-4">Active red-alert issues across Punjab. Ping a city mayor to escalate.</p>

      {redAlerts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/30">No active red alerts.</p>
      ) : (
        <div className="space-y-3">
          {redAlerts.map((i) => (
            <Card key={i.id} className="border-destructive/30">
              <CardContent className="p-4 flex flex-wrap gap-3 items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{i.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.city} — {i.neighborhood}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-destructive text-destructive-foreground">{i.status}</Badge>
                  <Button size="sm" variant="outline" asChild className="gap-1 text-xs">
                    <Link to={`/issue/${i.id}`}>
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1 text-xs"
                    type="button"
                    disabled={pingingCity === i.city}
                    onClick={() => void pingMayor(i.city)}
                  >
                    {pingingCity === i.city ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Bell className="w-3 h-3" />
                    )}
                    Ping mayor
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StateEmergency;
