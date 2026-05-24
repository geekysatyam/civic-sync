import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Search, Vote, Send, Loader2, Plus, Trash2, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { CSRProject, GhostAudit } from '@/types';

const csrStatusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-accent/10 text-accent',
  funded: 'bg-success/10 text-success',
  forwarded: 'bg-accent/10 text-accent',
  sponsored: 'bg-accent/10 text-accent',
};
const auditStatusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  passed: 'bg-success/10 text-success',
  recurred: 'bg-destructive/10 text-destructive',
};

const MayorCSR = () => {
  const [csrProjects, setCsr] = useState<CSRProject[]>([]);
  const [ghostAudits, setGhosts] = useState<GhostAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [ghostQuery, setGhostQuery] = useState('');
  const [pitchTarget, setPitchTarget] = useState<{ id: string; issueTitle: string } | null>(null);
  const [pitchBizName, setPitchBizName] = useState('');
  const [pitchSending, setPitchSending] = useState(false);

  const [rpQuestion, setRpQuestion] = useState('');
  const [rpWard, setRpWard] = useState('');
  const [rpExpires, setRpExpires] = useState('');
  const [rpOptions, setRpOptions] = useState<string[]>(['', '']);
  const [rpSubmitting, setRpSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.get<CSRProject[]>('/api/mayor/csr'), api.get<GhostAudit[]>('/api/mayor/ghost-log')])
      .then(([c, g]) => {
        setCsr(c.data);
        setGhosts(g.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const confirmForward = async () => {
    if (!pitchTarget) return;
    if (!pitchBizName.trim()) {
      toast({ title: 'Enter a business name', variant: 'destructive' });
      return;
    }
    setPitchSending(true);
    try {
      await api.post(`/api/mayor/csr/${pitchTarget.id}/forward`, { sponsoredBy: pitchBizName.trim() });
      toast({ title: 'Pitch sent', description: `CSR pitch forwarded to ${pitchBizName.trim()}.` });
      setCsr((prev) =>
        prev.map((p) =>
          p.id === pitchTarget.id
            ? { ...p, status: 'forwarded' as const, businessName: pitchBizName.trim() }
            : p
        )
      );
      setPitchTarget(null);
      setPitchBizName('');
    } catch {
      toast({ title: 'Forward failed', variant: 'destructive' });
    } finally {
      setPitchSending(false);
    }
  };

  const filteredGhosts = useMemo(() => {
    const q = ghostQuery.trim().toLowerCase();
    if (!q) return ghostAudits;
    return ghostAudits.filter(
      (g) =>
        g.issueTitle.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q) ||
        g.status.toLowerCase().includes(q) ||
        g.auditDueAt.includes(q)
    );
  }, [ghostAudits, ghostQuery]);

  const submitReversePitch = async () => {
    const options = rpOptions.map((o) => o.trim()).filter(Boolean);
    if (!rpQuestion.trim() || options.length < 2 || !rpExpires) {
      toast({ title: 'Fill question, at least 2 options, and expiry', variant: 'destructive' });
      return;
    }
    setRpSubmitting(true);
    try {
      const expiresIso = new Date(rpExpires).toISOString();
      const { data } = await api.post<{ id: string }>('/api/mayor/reverse-pitch', {
        question: rpQuestion.trim(),
        options,
        expiresAt: expiresIso,
        neighborhood: rpWard.trim() || undefined,
      });
      toast({ title: 'Poll created', description: `Poll id ${data.id} — citizens will see it under Polls.` });
      setRpQuestion('');
      setRpWard('');
      setRpExpires('');
      setRpOptions(['', '']);
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: 'Could not create poll', description: msg ?? 'Check mayor city on profile and try again.', variant: 'destructive' });
    } finally {
      setRpSubmitting(false);
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
      <h1 className="text-2xl font-black text-foreground">CSR, Polls & Audits</h1>

      <Tabs defaultValue="csr">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="csr">CSR Matchmaker</TabsTrigger>
          <TabsTrigger value="polls">Reverse Pitch</TabsTrigger>
          <TabsTrigger value="audit">Ghost Inspector</TabsTrigger>
        </TabsList>

        <TabsContent value="csr" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">Match high-upvote government-declined projects with local businesses.</p>
          {csrProjects.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.issueTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {p.businessName}
                    </Badge>
                    <Badge className={`text-xs ${csrStatusColors[p.status] || ''}`}>{p.status}</Badge>
                    {p.fundingAmount && (
                      <span className="text-xs text-success font-bold">₹{(p.fundingAmount / 1000).toFixed(0)}K</span>
                    )}
                  </div>
                </div>
                {p.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    type="button"
                    onClick={() => { setPitchTarget({ id: p.id, issueTitle: p.issueTitle }); setPitchBizName(p.businessName ?? ''); }}
                  >
                    <Send className="w-3.5 h-3.5" /> Pitch
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="polls" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-muted-foreground" />
                <CardTitle>Reverse pitch (ward poll)</CardTitle>
              </div>
              <CardDescription>
                Creates a city poll citizens can vote on. Optional ward/neighborhood scopes the ask (stored on the poll).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rp-q">Question</Label>
                <Textarea
                  id="rp-q"
                  value={rpQuestion}
                  onChange={(e) => setRpQuestion(e.target.value)}
                  placeholder="e.g. Which ward should get the next LED streetlight batch?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rp-ward">Ward / neighborhood (optional)</Label>
                <Input
                  id="rp-ward"
                  value={rpWard}
                  onChange={(e) => setRpWard(e.target.value)}
                  placeholder="e.g. Model Town"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rp-exp">Closes at</Label>
                <Input
                  id="rp-exp"
                  type="datetime-local"
                  value={rpExpires}
                  onChange={(e) => setRpExpires(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Answer choices (min 2)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setRpOptions((o) => [...o, ''])}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add option
                  </Button>
                </div>
                <div className="space-y-2">
                  {rpOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={opt}
                        onChange={(e) =>
                          setRpOptions((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))
                        }
                        placeholder={`Option ${i + 1}`}
                      />
                      {rpOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setRpOptions((prev) => prev.filter((_, j) => j !== i))}
                          aria-label={`Remove option ${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button type="button" disabled={rpSubmitting} className="gap-2" onClick={() => void submitReversePitch()}>
                {rpSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Publish poll
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Filter by issue title, city, status, or due date…"
              value={ghostQuery}
              onChange={(e) => setGhostQuery(e.target.value)}
              aria-label="Ghost Inspector queue filter"
            />
          </div>
          {filteredGhosts.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {ghostAudits.length === 0
                ? 'No ghost audits in queue yet (seed data or resolve issues to populate).'
                : 'No rows match your search.'}
            </p>
          )}
          {filteredGhosts.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{g.issueTitle}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>Due {g.auditDueAt}</span>
                    <Badge className={`text-xs ${auditStatusColors[g.status]}`}>{g.status}</Badge>
                  </div>
                </div>
                <Briefcase className="w-5 h-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!pitchTarget} onOpenChange={(o) => { if (!o) { setPitchTarget(null); setPitchBizName(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Forward CSR Pitch
            </DialogTitle>
            <DialogDescription>
              {pitchTarget?.issueTitle} — Enter the business or organisation to forward this pitch to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="biz-name">Business / organisation name</Label>
            <Input
              id="biz-name"
              value={pitchBizName}
              onChange={(e) => setPitchBizName(e.target.value)}
              placeholder="e.g. Ludhiana Chambers of Commerce"
              onKeyDown={(e) => { if (e.key === 'Enter') void confirmForward(); }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setPitchTarget(null); setPitchBizName(''); }}>
              Cancel
            </Button>
            <Button type="button" disabled={pitchSending} className="gap-1.5" onClick={() => void confirmForward()}>
              {pitchSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send pitch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MayorCSR;
