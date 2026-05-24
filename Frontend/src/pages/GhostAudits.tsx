import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getRankLabel } from '@/lib/civicLabels';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ExternalLink, Loader2, RotateCcw, Search, ShieldAlert } from 'lucide-react';

type GhostAuditRow = {
  id: string;
  issueId: string;
  issueTitle: string;
  city: string;
  neighborhood: string;
  issueStatus: string;
  resolvedAt: string;
  auditDueAt: string;
  status: string;
};

const GhostAudits = () => {
  const { user } = useAuth();
  const [audits, setAudits] = useState<GhostAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get<GhostAuditRow[]>('/api/ghost-audits/mine')
      .then((r) => setAudits(r.data))
      .catch(() => setAudits([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (issueId: string, response: 'still_good' | 'recurred') => {
    setSubmitting(issueId);
    try {
      await api.post(`/api/issues/${issueId}/ghost-response`, { response });
      toast({
        title: response === 'still_good' ? 'Fix verified' : 'Issue marked as recurred',
        description: response === 'still_good' ? 'Thanks for confirming the fix still holds.' : 'The issue is back in the queue.',
      });
      load();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({
        title: 'Could not submit audit',
        description: msg ?? 'Only City Guardians can complete ghost audits.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const isGuardian = user?.rank === 'city_guardian';

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Search className="w-6 h-6 text-purple-600" /> Ghost Inspector
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verify that fixes from months ago are still holding up. Assigned to you as{' '}
          <strong>{user ? getRankLabel(user.rank) : 'citizen'}</strong>.
        </p>
      </div>

      {!isGuardian && (
        <Alert>
          <ShieldAlert className="w-4 h-4" />
          <AlertDescription>
            Ghost audits can only be submitted by <strong>City Guardians</strong>. You can still view assignments
            here; reach City Guardian rank to respond. (Gurpreet in seed data is already a guardian.)
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading audits…
        </div>
      ) : audits.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No pending ghost audits assigned to you. They appear when old resolved issues need a follow-up check
            (or from seed data).
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {audits.map((a) => (
            <Card key={a.id} className="border-purple-200/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground">{a.issueTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.city}
                      {a.neighborhood ? ` · ${a.neighborhood}` : ''} · resolved {a.resolvedAt || '—'} · due{' '}
                      {a.auditDueAt}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-purple-700 border-purple-300">
                    Pending
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild className="gap-1 text-xs">
                    <Link to={`/issue/${a.issueId}`}>
                      View issue <ExternalLink className="w-3 h-3" />
                    </Link>
                  </Button>
                  {isGuardian && (
                    <>
                      <Button
                        size="sm"
                        className="gap-1 text-xs bg-success hover:bg-success/90 text-success-foreground"
                        type="button"
                        disabled={submitting === a.issueId}
                        onClick={() => void respond(a.issueId, 'still_good')}
                      >
                        {submitting === a.issueId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Still good
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs text-destructive border-destructive/40"
                        type="button"
                        disabled={submitting === a.issueId}
                        onClick={() => void respond(a.issueId, 'recurred')}
                      >
                        <RotateCcw className="w-3 h-3" /> Fix recurred
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GhostAudits;
