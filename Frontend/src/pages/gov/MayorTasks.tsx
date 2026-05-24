import { Fragment, useEffect, useState, useRef, useMemo } from 'react';
import { getCategoryLabel, getCategoryColor } from '@/lib/civicLabels';
import { getIssueStatusColor, getIssueStatusLabel, sortIssuesForMayor, getPriorityLabel } from '@/lib/issueStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Camera, Megaphone, AlertTriangle, ExternalLink, ChevronDown, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Issue } from '@/types';
import { api } from '@/lib/api';
import type { Department } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardPage from '@/components/dashboard/DashboardPage';
import PageLoading from '@/components/dashboard/PageLoading';
import EmptyState from '@/components/dashboard/EmptyState';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const statusOptions = ['open', 'acknowledged', 'in_progress', 'resolved', 'community_resolved', 'under_review', 'red_alert'];
const broadcastTemplates = ['Parts arrive Tuesday', 'Work begins tomorrow', 'Awaiting approval', 'Team dispatched'];

type AnomalyAlert = { category: string; thisWeek: number; lastWeek: number };

const MayorTasks = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoIssueId, setPhotoIssueId] = useState<string | null>(null);
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([]);

  const sortedIssues = useMemo(() => sortIssuesForMayor(issues), [issues]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Issue[]>('/api/mayor/tasks'),
      api.get<{ departments: Array<{ id: string; name: string; category: string; avgResolutionDays: number; slaCompliancePercent: number }> }>(
        '/api/mayor/scorecard'
      ),
    ])
      .then(([ti, td]) => {
        setIssues(ti.data);
        setDepartments(
          td.data.departments.map((d) => ({
            id: d.id,
            name: d.name,
            category: d.category as Department['category'],
            avgResolutionDays: d.avgResolutionDays,
            slaCompliancePercent: d.slaCompliancePercent,
          }))
        );
        setError(null);
      })
      .catch(() => setError('Could not load mayor tasks. Please check your connection and try again.'))
      .finally(() => setLoading(false));
    api.get<AnomalyAlert[]>('/api/mayor/anomalies').then((r) => setAnomalyAlerts(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { data } = await api.patch<Issue>(`/api/issues/${id}/status`, { status });
      setIssues((prev) => prev.map((i) => (i.id === id ? data : i)));
      toast({ title: 'Status updated', description: `Issue status changed to ${status}` });
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const assignDepartment = async (id: string, departmentId: string) => {
    const issue = issues.find((i) => i.id === id);
    if (!issue) return;
    try {
      const { data } = await api.patch<Issue>(`/api/issues/${id}/status`, {
        status: issue.status,
        departmentId,
      });
      setIssues((prev) => prev.map((i) => (i.id === id ? data : i)));
      toast({ title: 'Department assigned' });
    } catch {
      toast({ title: 'Could not assign department', variant: 'destructive' });
    }
  };

  const uploadAfterPhoto = async (file: File) => {
    if (!photoIssueId) return;
    const form = new FormData();
    form.append('photo', file);
    try {
      const { data } = await api.post<Issue>(`/api/issues/${photoIssueId}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIssues((prev) => prev.map((i) => (i.id === photoIssueId ? data : i)));
      toast({ title: 'After photo uploaded', description: 'Issue marked resolved.' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setPhotoIssueId(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const sendBroadcast = async (id: string, msg: string) => {
    try {
      await api.post(`/api/issues/${id}/broadcast`, { message: msg });
      toast({ title: 'Broadcast sent', description: `"${msg}" sent to upvoters.` });
      load();
    } catch {
      toast({ title: 'Broadcast failed', variant: 'destructive' });
    }
  };

  const rowClass = (issue: Issue) => {
    if (issue.isRedAlert) return 'bg-destructive/5 border-l-4 border-l-destructive';
    if (issue.slaBreached) return 'bg-amber-50/80 dark:bg-amber-950/20 border-l-4 border-l-amber-500';
    return '';
  };

  return (
    <DashboardPage
      maxWidth="xl"
      title="Task management"
      description={`Triage and resolve issues in ${user?.city ?? 'your city'}. Click a title or View for full details, photos, and map.`}
      actions={
        <>
          <Badge className="bg-accent/10 text-accent">{issues.length} issues</Badge>
          <Button variant="outline" size="sm" asChild>
            <Link to="/gov/mayor/contractors">Contractors</Link>
          </Button>
        </>
      }
    >
      {anomalyAlerts.length > 0 && (
        <Alert className="border-amber-500/50 bg-amber-50/80 dark:bg-amber-950/20 mb-2">
          <TrendingUp className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 dark:text-amber-200">
            <span className="font-semibold">Spike detected:</span>{' '}
            {anomalyAlerts.map((a, i) => (
              <span key={a.category}>
                {i > 0 && ', '}
                <strong>{a.category.replace(/_/g, ' ')}</strong> — {a.thisWeek} reports this week (was {a.lastWeek})
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <EmptyState title="No open issues" description="New citizen reports will appear here for triage." />
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Issue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Upvotes</TableHead>
                  <TableHead className="w-[100px]">View</TableHead>
                  <TableHead>Actions</TableHead>
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
                          {expandedId === issue.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          {issue.isRedAlert && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                          {issue.slaBreached && !issue.isRedAlert && (
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" title="SLA breach" />
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/issue/${issue.id}`}
                              className="text-sm font-semibold max-w-[200px] truncate text-primary hover:underline block"
                              title={issue.title}
                            >
                              {issue.title}
                            </Link>
                            {getPriorityLabel(issue.priorityScore ?? 0) && (
                              <Badge className={`text-[10px] px-1.5 h-4 mt-0.5 ${getPriorityLabel(issue.priorityScore ?? 0)!.className}`}>
                                {getPriorityLabel(issue.priorityScore ?? 0)!.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getCategoryColor(issue.category)}`}>{getCategoryLabel(issue.category)}</Badge>
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
                                <SelectItem key={s} value={s} className="text-xs">
                                  {getIssueStatusLabel(s)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={issue.assignedDepartment || ''}
                          onValueChange={(v) => void assignDepartment(issue.id, v)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm font-bold tabular-nums">{issue.upvotes}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" asChild>
                          <Link to={`/issue/${issue.id}`}>
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Upload After Photo"
                            type="button"
                            onClick={() => {
                              setPhotoIssueId(issue.id);
                              photoInputRef.current?.click();
                            }}
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </Button>
                          <Select onValueChange={(msg) => void sendBroadcast(issue.id, msg)}>
                            <SelectTrigger className="h-7 w-7 p-0 border-0 bg-transparent">
                              <Megaphone className="w-3.5 h-3.5" />
                            </SelectTrigger>
                            <SelectContent>
                              {broadcastTemplates.map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === issue.id && (
                      <TableRow key={`${issue.id}-detail`} className="bg-muted/30">
                        <TableCell colSpan={8} className="p-4">
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="md:col-span-2 space-y-2">
                              <p className="text-muted-foreground">{issue.description}</p>
                              <p>
                                <span className="font-semibold">Suggested fix:</span> {issue.suggestedSolution}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {issue.neighborhood}, {issue.city} · reported {issue.reportedAt}
                              </p>
                            </div>
                            {issue.photoBeforeUrl && issue.photoBeforeUrl !== '/placeholder.svg' && (
                              <img
                                src={issue.photoBeforeUrl}
                                alt=""
                                className="rounded-lg border max-h-32 object-cover w-full"
                              />
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

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadAfterPhoto(file);
        }}
      />
    </DashboardPage>
  );
};

export default MayorTasks;
