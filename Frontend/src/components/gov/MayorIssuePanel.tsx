import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Megaphone, ArrowLeft, Loader2, Star, Languages, History, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Department, Issue } from '@/types';
import { api } from '@/lib/api';

type AuditEntry = {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  fromValue: string;
  toValue: string;
  note: string;
  createdAt: string;
};

const statusOptions = ['open', 'acknowledged', 'in_progress', 'resolved', 'community_resolved', 'under_review', 'red_alert'];
const broadcastTemplates = ['Parts arrive Tuesday', 'Work begins tomorrow', 'Awaiting approval', 'Team dispatched'];

type Props = {
  issue: Issue;
  departments: Department[];
  onUpdated: (issue: Issue) => void;
  backTo?: string;
};

const MayorIssuePanel = ({ issue, departments, onUpdated, backTo = '/gov/mayor' }: Props) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDone, setRatingDone] = useState(!!issue.contractorRating);
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState<{ title: string; description: string } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[] | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const submitRating = async () => {
    if (!ratingValue) return;
    setRatingSubmitting(true);
    try {
      await api.post(`/api/mayor/issues/${issue.id}/rate-contractor`, {
        rating: ratingValue,
        comment: ratingComment,
      });
      setRatingDone(true);
      toast({ title: 'Rating submitted', description: `${ratingValue} stars saved.` });
    } catch {
      toast({ title: 'Rating failed', variant: 'destructive' });
    } finally {
      setRatingSubmitting(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const { data } = await api.patch<Issue>(`/api/issues/${issue.id}/status`, { status });
      onUpdated(data);
      toast({ title: 'Status updated', description: status.replace(/_/g, ' ') });
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const assignDepartment = async (departmentId: string) => {
    try {
      const { data } = await api.patch<Issue>(`/api/issues/${issue.id}/status`, {
        status: issue.status,
        departmentId,
      });
      onUpdated(data);
      toast({ title: 'Department assigned' });
    } catch {
      toast({ title: 'Could not assign department', variant: 'destructive' });
    }
  };

  const uploadAfterPhoto = async (file: File) => {
    setPhotoUploading(true);
    const form = new FormData();
    form.append('photo', file);
    try {
      const { data } = await api.post<Issue>(`/api/issues/${issue.id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdated(data);
      toast({ title: 'After photo uploaded', description: 'Issue marked resolved.' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const translate = async () => {
    setTranslating(true);
    try {
      const { data } = await api.post<{ translatedTitle: string; translatedDescription: string }>(
        `/api/mayor/issues/${issue.id}/translate`
      );
      setTranslation({ title: data.translatedTitle, description: data.translatedDescription });
    } catch {
      toast({ title: 'Translation failed', variant: 'destructive' });
    } finally {
      setTranslating(false);
    }
  };

  const loadAudit = async () => {
    if (auditLog !== null) { setAuditOpen((o) => !o); return; }
    setAuditOpen(true);
    setAuditLoading(true);
    try {
      const { data } = await api.get<AuditEntry[]>(`/api/mayor/issues/${issue.id}/audit`);
      setAuditLog(data);
    } catch {
      toast({ title: 'Could not load audit log', variant: 'destructive' });
    } finally {
      setAuditLoading(false);
    }
  };

  const sendBroadcast = async (msg: string) => {
    try {
      await api.post(`/api/issues/${issue.id}/broadcast`, { message: msg });
      const { data } = await api.get<Issue>(`/api/issues/${issue.id}`);
      onUpdated(data);
      toast({ title: 'Broadcast sent', description: `"${msg}" sent to upvoters.` });
    } catch {
      toast({ title: 'Broadcast failed', variant: 'destructive' });
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Mayor triage</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1.5 h-8" asChild>
            <Link to={backTo}>
              <ArrowLeft className="w-4 h-4" /> Back to tasks
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
            <Select value={issue.status} onValueChange={(v) => void updateStatus(v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Department</p>
            <Select value={issue.assignedDepartment || ''} onValueChange={(v) => void assignDepartment(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Assign department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={photoUploading}
            onClick={() => photoInputRef.current?.click()}
          >
            {photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Upload after photo
          </Button>
          <Select onValueChange={(msg) => void sendBroadcast(msg)}>
            <SelectTrigger className="h-9 w-auto gap-1.5 px-3">
              <Megaphone className="w-4 h-4" />
              <span className="text-sm">Broadcast</span>
            </SelectTrigger>
            <SelectContent>
              {broadcastTemplates.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="tabular-nums">
            {issue.upvotes} upvotes
          </Badge>
        </div>

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

        <div className="flex flex-wrap gap-2 pt-1 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void translate()}
            disabled={translating}
          >
            {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
            Translate
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void loadAudit()}
          >
            <History className="w-3.5 h-3.5" />
            Audit log
            {auditOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </Button>
        </div>

        {translation && (
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">English translation</p>
            <p className="font-medium">{translation.title}</p>
            <p className="text-muted-foreground">{translation.description}</p>
          </div>
        )}

        {auditOpen && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Audit trail</p>
            {auditLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
              </div>
            ) : auditLog && auditLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">No audit entries yet.</p>
            ) : (
              <ol className="space-y-2">
                {(auditLog ?? []).map((entry) => (
                  <li key={entry.id} className="flex gap-3 text-xs">
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium">{entry.performedBy}</span>
                      {' '}
                      <span className="text-muted-foreground">({entry.performedByRole.replace(/_/g, ' ')})</span>
                      {' — '}
                      <span className="capitalize">{entry.action.replace(/_/g, ' ')}</span>
                      {entry.fromValue && entry.toValue ? (
                        <span className="text-muted-foreground"> · {entry.fromValue} → {entry.toValue}</span>
                      ) : entry.toValue ? (
                        <span className="text-muted-foreground"> · {entry.toValue}</span>
                      ) : null}
                      {entry.note ? <span className="text-muted-foreground"> ({entry.note})</span> : null}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {issue.assignedContractorId && ['resolved', 'community_resolved'].includes(issue.status) && (
          <div className="border rounded-xl p-3 space-y-2 bg-amber-50/50 border-amber-200">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rate contractor work</p>
            {ratingDone ? (
              <p className="text-sm text-green-700 font-medium">
                ✓ Rating submitted ({issue.contractorRating ?? ratingValue} stars)
              </p>
            ) : (
              <>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRatingValue(s)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          s <= ratingValue ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={2}
                  placeholder="Optional feedback for the contractor…"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  disabled={!ratingValue || ratingSubmitting}
                  onClick={() => void submitRating()}
                >
                  {ratingSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Submit rating
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MayorIssuePanel;
