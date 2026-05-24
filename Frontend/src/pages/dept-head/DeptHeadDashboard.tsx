import { Fragment, useEffect, useState, useMemo } from 'react';
import { getCategoryLabel, getCategoryColor } from '@/lib/civicLabels';
import { getIssueStatusColor, getIssueStatusLabel, sortIssuesForMayor, getPriorityLabel } from '@/lib/issueStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ChevronDown, ChevronRight, Clock, ExternalLink, Megaphone, HardHat } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Issue } from '@/types';
import { api } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import EmptyState from '@/components/dashboard/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const statusOptions = ['open', 'acknowledged', 'in_progress', 'resolved', 'under_review'];
const broadcastTemplates = ['Parts arrive Tuesday', 'Work begins tomorrow', 'Awaiting approval', 'Team dispatched'];
const UNASSIGNED_VALUE = '__unassigned__';

interface DeptInfo {
  id: string;
  name: string;
  city: string;
  category: string;
  avgResolutionDays: number;
  slaCompliance: number;
  openIssues: number;
  resolvedIssues: number;
}

interface DashboardResponse {
  department: DeptInfo;
  issues: Issue[];
}

interface StatsResponse {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  redAlerts: number;
  slaBreached: number;
}

interface ContractorRow {
  id: string;
  name: string;
  email: string;
  category: string;
  avgRating: number;
  totalRatings: number;
}

const DeptHeadDashboard = () => {
  const [dept, setDept] = useState<DeptInfo | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [contractors, setContractors] = useState<ContractorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const sortedIssues = useMemo(() => sortIssuesForMayor(issues), [issues]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<DashboardResponse>('/api/dept-head/dashboard'),
      api.get<StatsResponse>('/api/dept-head/stats'),
    ])
      .then(([dr, sr]) => {
        setDept(dr.data.department);
        setIssues(dr.data.issues);
        setStats(sr.data);
        setError(null);
      })
      .catch((e) => {
        const status = (e as { response?: { status?: number; data?: { error?: string } } })?.response?.status;
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
        if (status === 400 && msg?.includes('No department')) {
          setError('Your account has no department linked. Ask your mayor to create your account via Mayor → Department Heads.');
        } else {
          setError('Could not load dashboard. Check your connection.');
        }
      })
      .finally(() => setLoading(false));
    api.get<ContractorRow[]>('/api/dept-head/contractors').then((r) => setContractors(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { data } = await api.patch<Issue>(`/api/dept-head/issues/${id}/status`, { status });
      setIssues((prev) => prev.map((i) => (i.id === id ? data : i)));
      toast({ title: 'Status updated' });
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const assignContractor = async (issueId: string, contractorId: string) => {
    setAssigningId(issueId);
    try {
      await api.patch(`/api/dept-head/issues/${issueId}/assign-contractor`, {
        contractorId: contractorId || undefined,
      });
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId ? { ...i, assignedContractorId: contractorId || undefined } : i
        )
      );
      const name = contractors.find((c) => c.id === contractorId)?.name ?? '';
      toast({ title: contractorId ? `Assigned to ${name}` : 'Contractor removed' });
    } catch {
      toast({ title: 'Assignment failed', variant: 'destructive' });
    } finally {
      setAssigningId(null);
    }
  };

  const sendBroadcast = async (id: string, msg: string) => {
    try {
      await api.post(`/api/dept-head/issues/${id}/broadcast`, { message: msg });
      toast({ title: 'Broadcast sent' });
    } catch {
      toast({ title: 'Broadcast failed', variant: 'destructive' });
    }
  };

  const rowClass = (issue: Issue) => {
    if (issue.isRedAlert) return 'bg-destructive/5 border-l-4 border-l-destructive';
    if (issue.slaBreached) return 'bg-amber-50/80 dark:bg-amber-950/20 border-l-4 border-l-amber-500';
    return '';
  };

  const statCards = stats && dept
    ? [
        { label: 'Total', value: stats.total },
        { label: 'Open', value: stats.open },
        { label: 'In progress', value: stats.inProgress },
        { label: 'Resolved', value: stats.resolved },
        { label: 'Red alerts', value: stats.redAlerts, red: true },
        { label: 'SLA breach', value: stats.slaBreached, amber: true },
      ]
    : [];

  return (
    <DashboardPage
      maxWidth="xl"
      title={dept ? `${dept.name} — ${dept.city}` : 'My Department'}
      description={
        dept
          ? `${getCategoryLabel(dept.category)} · Avg resolution ${dept.avgResolutionDays}d · SLA ${dept.slaCompliance}%`
          : undefined
      }
      actions={<Badge className="bg-accent/10 text-accent">{issues.length} issues</Badge>}
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : (
        <>
          {statCards.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
              {statCards.map((s) => (
                <Card key={s.label}>
                  <CardHeader className="pb-1 pt-3 px-4">
                    <p className="text-xs text-muted-foreground font-normal">{s.label}</p>
                  </CardHeader>
                  <CardContent className="pb-3 px-4">
                    <span className={`text-2xl font-black tabular-nums ${s.red ? 'text-destructive' : s.amber ? 'text-amber-600' : ''}`}>
                      {s.value}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {contractors.length > 0 && (
            <Card className="mb-4 border-accent/30 bg-accent/5">
              <CardContent className="p-3 flex flex-wrap gap-2 items-center">
                <HardHat className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-medium text-accent">Available contractors ({contractors.length}):</span>
                {contractors.map((c) => (
                  <Badge key={c.id} variant="secondary" className="text-xs font-normal">
                    {c.name}{c.avgRating > 0 ? ` · ★${c.avgRating}` : ''}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {issues.length === 0 ? (
            <EmptyState title="No issues" description="Issues assigned to your department will appear here." />
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Issue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contractor</TableHead>
                      <TableHead className="text-center">↑</TableHead>
                      <TableHead className="w-20">View</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedIssues.map((issue) => (
                      <Fragment key={issue.id}>
                        <TableRow className={rowClass(issue)}>
                          <TableCell className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
                            >
                              {expandedId === issue.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </Button>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              {issue.isRedAlert && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                              {issue.slaBreached && !issue.isRedAlert && <Clock className="w-4 h-4 text-amber-600 shrink-0" />}
                              <div className="min-w-0">
                                <Link
                                  to={`/issue/${issue.id}`}
                                  className="text-sm font-semibold max-w-[220px] truncate text-primary hover:underline block"
                                  title={issue.title}
                                >
                                  {issue.title}
                                </Link>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Badge className={`text-[10px] px-1 h-4 ${getCategoryColor(issue.category)}`}>
                                    {getCategoryLabel(issue.category)}
                                  </Badge>
                                  {getPriorityLabel(issue.priorityScore ?? 0) && (
                                    <Badge className={`text-[10px] px-1.5 h-4 ${getPriorityLabel(issue.priorityScore ?? 0)!.className}`}>
                                      {getPriorityLabel(issue.priorityScore ?? 0)!.label}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={`text-xs ${getIssueStatusColor(issue.status)}`}>
                                {getIssueStatusLabel(issue.status)}
                              </Badge>
                              <Select value={issue.status} onValueChange={(v) => void updateStatus(issue.id, v)}>
                                <SelectTrigger className="w-36 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs">{getIssueStatusLabel(s)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>

                          <TableCell>
                            {contractors.length > 0 ? (
                              <Select
                                value={issue.assignedContractorId ?? UNASSIGNED_VALUE}
                                onValueChange={(v) => void assignContractor(issue.id, v === UNASSIGNED_VALUE ? '' : v)}
                                disabled={assigningId === issue.id}
                              >
                                <SelectTrigger className="w-36 h-8 text-xs">
                                  <SelectValue placeholder={<span className="text-muted-foreground">Assign…</span>} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={UNASSIGNED_VALUE} className="text-xs text-muted-foreground">— Remove —</SelectItem>
                                  {contractors.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="text-xs">
                                      {c.name}{c.avgRating > 0 ? ` ★${c.avgRating}` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground">No contractors</span>
                            )}
                          </TableCell>

                          <TableCell className="text-center text-sm font-bold tabular-nums">{issue.upvotes}</TableCell>

                          <TableCell>
                            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" asChild>
                              <Link to={`/issue/${issue.id}`}>View <ExternalLink className="w-3 h-3" /></Link>
                            </Button>
                          </TableCell>

                          <TableCell>
                            <Select onValueChange={(msg) => void sendBroadcast(issue.id, msg)}>
                              <SelectTrigger className="h-7 w-7 p-0 border-0 bg-transparent">
                                <Megaphone className="w-3.5 h-3.5" />
                              </SelectTrigger>
                              <SelectContent>
                                {broadcastTemplates.map((t) => (
                                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>

                        {expandedId === issue.id && (
                          <TableRow key={`${issue.id}-detail`} className="bg-muted/30">
                            <TableCell colSpan={7} className="p-4">
                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="md:col-span-2 space-y-2">
                                  <p className="text-muted-foreground">{issue.description}</p>
                                  <p><span className="font-semibold">Suggested fix:</span> {issue.suggestedSolution}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {issue.neighborhood}, {issue.city} · reported {issue.reportedAt}
                                    {issue.assignedContractorId && (
                                      <> · contractor assigned</>
                                    )}
                                  </p>
                                  {(issue.contractorUpdates?.length ?? 0) > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contractor updates</p>
                                      <ul className="text-xs space-y-1 border-l-2 border-primary/30 pl-3 text-muted-foreground">
                                        {issue.contractorUpdates!.slice(-3).map((u) => (
                                          <li key={u.id}><span className="font-medium text-foreground">{u.createdByName}</span> · {u.workStatus}{u.note ? ` — ${u.note}` : ''}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                {issue.photoBeforeUrl && issue.photoBeforeUrl !== '/placeholder.svg' && (
                                  <img src={issue.photoBeforeUrl} alt="" className="rounded-lg border max-h-32 object-cover w-full" />
                                )}
                              </div>
                              <Button size="sm" className="mt-3" variant="secondary" asChild>
                                <Link to={`/issue/${issue.id}`}>Open full issue page</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </DashboardPage>
  );
};

export default DeptHeadDashboard;
