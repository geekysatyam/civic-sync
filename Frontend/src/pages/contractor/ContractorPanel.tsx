import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Issue } from '@/types';
import { getCategoryLabel, getCategoryColor } from '@/lib/civicLabels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Camera, ClipboardList, Loader2, Info, Star } from 'lucide-react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';
import EmptyState from '@/components/dashboard/EmptyState';

type ContractorStats = {
  totalJobs: number;
  completedJobs: number;
  inProgressJobs: number;
  pendingJobs: number;
  averageRating: number;
  totalRatings: number;
  recentRatings: { issueTitle: string; rating: number; comment: string }[];
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

const workStatusHelp: Record<string, string> = {
  assigned: 'Acknowledge the job. Move to on site when you arrive.',
  on_site: 'Upload a before photo when work starts.',
  completed: 'Upload an after photo when the repair is finished.',
};

function IssueWorkForm({
  issue,
  onDone,
}: {
  issue: Issue;
  onDone: () => void;
}) {
  const [workStatus, setWorkStatus] = useState(issue.contractorWorkStatus === 'unassigned' ? 'assigned' : issue.contractorWorkStatus ?? 'assigned');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const submitWork = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('workStatus', workStatus);
      fd.append('note', note);
      const before = beforeRef.current?.files?.[0];
      const after = afterRef.current?.files?.[0];
      if (before) fd.append('beforePhoto', before);
      if (after) fd.append('afterPhoto', after);
      await api.post(`/api/contractor/issues/${issue.id}/work`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: 'Update sent', description: 'The mayor’s office has been notified.' });
      onDone();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: 'Update failed', description: msg ?? 'Check required photos for this status.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 border rounded-xl p-4 bg-muted/30">
      <Alert className="bg-background">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">{workStatusHelp[workStatus] ?? 'Update your progress for the mayor.'}</AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>Work status</Label>
        <Select value={workStatus} onValueChange={setWorkStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="on_site">On site</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Note to mayor</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Crew dispatched, parts ordered, work finished…" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Before photo {workStatus === 'on_site' ? '(required)' : ''}</Label>
          <input ref={beforeRef} type="file" accept="image/*" className="text-xs w-full mt-1 file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1" />
        </div>
        <div>
          <Label className="text-xs">After photo {workStatus === 'completed' ? '(required)' : ''}</Label>
          <input ref={afterRef} type="file" accept="image/*" className="text-xs w-full mt-1 file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button disabled={submitting} onClick={() => void submitWork()}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Submit update
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

const ContractorPanel = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<ContractorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Issue[]>('/api/contractor/issues'),
      api.get<ContractorStats>('/api/contractor/stats'),
    ])
      .then(([issuesRes, statsRes]) => {
        setIssues(issuesRes.data);
        setStats(statsRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const active = issues.filter((i) => i.contractorWorkStatus !== 'completed').length;
  const done = issues.filter((i) => i.contractorWorkStatus === 'completed').length;

  return (
    <DashboardPage
      maxWidth="md"
      title="My repair jobs"
      description={`${user?.contractorLabel ?? user?.name} · ${getCategoryLabel(user?.contractorCategory ?? '')} · ${user?.city}. Update status and photos so the mayor can track progress.`}
    >
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total jobs', value: stats.totalJobs },
            { label: 'In progress', value: active },
            { label: 'Completed', value: done },
            { label: 'Pending', value: stats.pendingJobs },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-black text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && stats && stats.totalRatings > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">My performance rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <StarRating value={stats.averageRating} />
              <span className="text-lg font-bold">{stats.averageRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">from {stats.totalRatings} {stats.totalRatings === 1 ? 'review' : 'reviews'}</span>
            </div>
            {stats.recentRatings.length > 0 && (
              <div className="space-y-2">
                {stats.recentRatings.map((r, i) => (
                  <div key={i} className="text-xs border rounded-lg p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate max-w-[70%]">{r.issueTitle}</span>
                      <StarRating value={r.rating} />
                    </div>
                    {r.comment && <p className="text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <PageLoading label="Loading your jobs…" />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No jobs right now"
          description="When the department head assigns issues to you, they will appear here. Contact your department office if you expected jobs."
        />
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <Card key={issue.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base leading-snug">{issue.title}</CardTitle>
                  <Badge className={getCategoryColor(issue.category)}>{getCategoryLabel(issue.category)}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {issue.contractorWorkStatus?.replace(/_/g, ' ') ?? 'assigned'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {issue.neighborhood} · City status: {issue.status.replace(/_/g, ' ')}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{issue.description}</p>
                {(issue.contractorUpdates?.length ?? 0) > 0 && (
                  <ul className="text-xs space-y-2 border-l-2 border-primary/30 pl-3 text-muted-foreground">
                    {issue.contractorUpdates!.slice(-3).map((u) => (
                      <li key={u.id}>
                        <span className="font-medium text-foreground">{u.createdByName}</span> · {u.workStatus}
                        {u.note ? ` — ${u.note}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {activeId === issue.id ? (
                  <IssueWorkForm issue={issue} onDone={() => { setActiveId(null); load(); }} />
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveId(issue.id)}>
                    <Camera className="w-4 h-4" /> Post progress update
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardPage>
  );
};

export default ContractorPanel;
