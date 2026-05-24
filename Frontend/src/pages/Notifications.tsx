import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Megaphone, Heart, Search, Trophy, ShieldCheck, Zap, Bell, Loader2 } from 'lucide-react';
import type { Notification } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const typeIcons: Record<string, typeof Bell> = {
  fix_confirmed: CheckCircle2,
  sla_breach: AlertTriangle,
  broadcast: Megaphone,
  volunteer: Heart,
  audit: Search,
  audit_ping: Search,
  rank_up: Trophy,
  verification: ShieldCheck,
  super_vote_reset: Zap,
};

const typeColors: Record<string, string> = {
  fix_confirmed: 'text-success',
  sla_breach: 'text-destructive',
  broadcast: 'text-accent',
  volunteer: 'text-warning',
  audit: 'text-purple-600',
  audit_ping: 'text-purple-600',
  rank_up: 'text-amber-500',
  verification: 'text-teal-600',
  super_vote_reset: 'text-indigo-600',
};

const Notifications = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get<Notification[]>('/api/notifications')
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    await api.patch('/api/notifications/read-all');
    load();
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      toast({ title: 'Could not mark as read', variant: 'destructive' });
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
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-foreground">Notifications</h1>
        <Button variant="outline" size="sm" type="button" onClick={() => void markAll()}>
          Mark all read
        </Button>
      </div>

      {items.map((n) => {
        const Icon = typeIcons[n.type] || Bell;
        const isAudit = n.type === 'audit' || n.type === 'audit_ping';
        const issueId = n.metadata?.issueId;

        return (
          <Card
            key={n.id}
            className={`transition-all ${!n.read ? 'border-accent/30 bg-accent/5' : ''}`}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`mt-0.5 ${typeColors[n.type] || 'text-muted-foreground'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-foreground">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleDateString()}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {isAudit && (
                    <Button size="sm" variant="secondary" className="text-xs h-8" asChild>
                      <Link to="/ghost-audits" onClick={() => !n.read && void markRead(n.id)}>
                        Open Ghost Inspector
                      </Link>
                    </Button>
                  )}
                  {issueId && (
                    <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                      <Link to={`/issue/${issueId}`} onClick={() => !n.read && void markRead(n.id)}>
                        View issue
                      </Link>
                    </Button>
                  )}
                  {!n.read && (
                    <Button size="sm" variant="ghost" className="text-xs h-8" type="button" onClick={() => void markRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Notifications;
