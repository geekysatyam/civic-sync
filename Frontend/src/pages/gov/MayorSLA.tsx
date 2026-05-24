import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Issue } from '@/types';
import { api } from '@/lib/api';

const MayorSLA = () => {
  const [breached, setBreached] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Issue[]>('/api/mayor/sla-alerts')
      .then((r) => setBreached(r.data))
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
        <AlertTriangle className="w-6 h-6 text-destructive" />
        <h1 className="text-2xl font-black text-foreground">SLA Alerts</h1>
      </div>

      {breached.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">No SLA breaches currently. Great work! 🎉</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {breached.map((issue) => (
            <Card key={issue.id} className="border-destructive/30 bg-destructive/5 animate-pulse-red">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{issue.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {issue.assignedDepartment || 'Unassigned'}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Since {issue.acknowledgedAt?.split('T')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
                    <Link to={`/issue/${issue.id}`}>
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    type="button"
                    onClick={() => toast({ title: 'Escalated', description: `${issue.title} has been escalated to priority.` })}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" /> Escalate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Breaches', value: breached.length, color: 'text-destructive' },
          { label: 'Avg Overdue', value: '—', color: 'text-warning' },
          { label: 'Resolved Today', value: '—', color: 'text-success' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MayorSLA;
