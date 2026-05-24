import { useParams } from 'react-router-dom';
import { getCategoryLabel, getCategoryColor } from '@/lib/civicLabels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AccountabilityClock from '@/components/shared/AccountabilityClock';
import BeforeAfterViewer from '@/components/shared/BeforeAfterViewer';
import MapView from '@/components/shared/MapView';
import { ThumbsUp, Clock, Languages, Megaphone, Wrench, Hand, MessageSquare, Flag, CheckCircle2, DollarSign, Brain, Loader2, Share2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import VerifiedCitizenBadge from '@/components/shared/VerifiedCitizenBadge';
import { useAuth } from '@/contexts/AuthContext';
import type { Department, Issue } from '@/types';
import { api } from '@/lib/api';
import MayorIssuePanel from '@/components/gov/MayorIssuePanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const IssueDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [pledgeOpen, setPledgeOpen] = useState<'sweat' | 'tools' | null>(null);
  const [pledgeItem, setPledgeItem] = useState('');
  const [pledgeSending, setPledgeSending] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveSending, setResolveSending] = useState(false);
  const resolvePhotoRef = useRef<HTMLInputElement>(null);
  const [mayorDepartments, setMayorDepartments] = useState<Department[]>([]);
  const [upvoteAnim, setUpvoteAnim] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api
      .get<Issue>(`/api/issues/${id}`)
      .then((r) => setIssue(r.data))
      .catch(() => setError('Issue not found or API unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.role !== 'mayor') return;
    api
      .get<{ departments: Array<{ id: string; name: string; category: string }> }>('/api/mayor/scorecard')
      .then((r) =>
        setMayorDepartments(
          r.data.departments.map((d) => ({
            id: d.id,
            name: d.name,
            category: d.category as Department['category'],
            avgResolutionDays: 0,
            slaCompliancePercent: 0,
          }))
        )
      )
      .catch(() => setMayorDepartments([]));
  }, [user?.role]);

  const toggleUpvote = async () => {
    if (!id) return;
    try {
      const { data } = await api.patch<Issue>(`/api/issues/${id}/upvote`);
      setIssue(data);
      if (data.upvoted) {
        setUpvoteAnim(true);
        window.setTimeout(() => setUpvoteAnim(false), 450);
      }
      toast({ title: data.upvoted ? 'Upvoted' : 'Upvote removed' });
    } catch {
      toast({ title: 'Sign in as a citizen to upvote', variant: 'destructive' });
    }
  };

  const postComment = async () => {
    if (!id || !user || !commentText.trim()) return;
    setCommentSending(true);
    try {
      const { data } = await api.post<Issue>(`/api/issues/${id}/comments`, { text: commentText.trim() });
      setIssue(data);
      setCommentText('');
      toast({ title: 'Comment posted' });
    } catch {
      toast({ title: 'Could not post comment', description: 'Sign in and try again.', variant: 'destructive' });
    } finally {
      setCommentSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Issue not found.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isMayorForIssue = user?.role === 'mayor' && user.city === issue.city;
  const canFlag =
    !isMayorForIssue && user && (user.rank === 'neighborhood_advocate' || user.rank === 'city_guardian');
  const canVerify =
    !isMayorForIssue &&
    user &&
    (user.rank === 'neighborhood_advocate' || user.rank === 'city_guardian') &&
    issue.communityResolution?.status === 'pending';
  const isReporter = user?.id === issue.reportedBy;
  const showCitizenActions = user?.role === 'citizen';

  const submitPledge = async () => {
    if (!id || !pledgeOpen) return;
    setPledgeSending(true);
    try {
      const { data } = await api.post<Issue>(`/api/issues/${id}/pledge`, {
        type: pledgeOpen,
        item: pledgeItem.trim() || undefined,
      });
      setIssue(data);
      setPledgeOpen(null);
      setPledgeItem('');
      toast({ title: 'Pledge recorded' });
    } catch {
      toast({ title: 'Sign in to pledge', variant: 'destructive' });
    } finally {
      setPledgeSending(false);
    }
  };

  const submitCommunityResolve = async () => {
    if (!id) return;
    const file = resolvePhotoRef.current?.files?.[0];
    if (!file) {
      toast({ title: 'Photo required', description: 'Upload a photo of the fix.', variant: 'destructive' });
      return;
    }
    setResolveSending(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const { data } = await api.post<Issue>(`/api/issues/${id}/community-resolve`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIssue(data);
      setResolveOpen(false);
      if (resolvePhotoRef.current) resolvePhotoRef.current.value = '';
      toast({ title: 'Submitted for verification' });
    } catch {
      toast({ title: 'Only the original reporter can submit a community fix', variant: 'destructive' });
    } finally {
      setResolveSending(false);
    }
  };

  const verifyResolve = async (approve: boolean) => {
    if (!id) return;
    try {
      const { data } = await api.patch<Issue>(`/api/issues/${id}/verify-resolve`, { approve });
      setIssue(data);
      toast({ title: approve ? 'Fix verified' : 'Fix rejected' });
    } catch {
      toast({ title: 'Could not verify', variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {isMayorForIssue && (
        <MayorIssuePanel
          issue={issue}
          departments={mayorDepartments}
          onUpdated={setIssue}
          backTo="/gov/mayor"
        />
      )}

      <BeforeAfterViewer
        hasAfter={!!issue.photoAfterUrl}
        beforeUrl={issue.photoBeforeUrl}
        afterUrl={issue.photoAfterUrl}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={getCategoryColor(issue.category)}>{getCategoryLabel(issue.category)}</Badge>
        <Badge variant="outline">
          {issue.city} — {issue.neighborhood}
        </Badge>
        {issue.isRedAlert && <Badge className="bg-destructive text-destructive-foreground">🚨 Red Alert</Badge>}
        {issue.isTranslated && (
          <Badge className="bg-accent/10 text-accent gap-1">
            <Languages className="w-3 h-3" /> From {issue.originalLanguage}
          </Badge>
        )}
      </div>

      <h1 className="text-2xl font-black text-foreground">{issue.title}</h1>

      {issue.reporterName && (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 -mt-2">
          Reported by <span className="font-medium text-foreground">{issue.reporterName}</span>
          {issue.reporterPhoneVerified && <VerifiedCitizenBadge size="md" />}
        </p>
      )}

      {issue.aiSummary && (
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Brain className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-accent mb-1">AI Summary</p>
              <p className="text-sm text-foreground">{issue.aiSummary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">{issue.description}</p>
      <p className="text-sm">
        <span className="font-bold">Suggested Solution:</span> {issue.suggestedSolution}
      </p>

      {issue.costEstimate && (
        <div className="flex items-center gap-2 text-sm bg-muted rounded-lg p-3">
          <DollarSign className="w-4 h-4 text-success" />
          <span className="font-medium">Cost Estimate:</span> {issue.costEstimate}
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        {showCitizenActions && (
          <Button
            variant={issue.upvoted ? 'default' : 'outline'}
            size="sm"
            onClick={() => void toggleUpvote()}
            className={cn('gap-1.5', upvoteAnim && 'animate-upvote-bounce')}
          >
            <ThumbsUp className={cn('w-4 h-4', upvoteAnim && 'text-primary-foreground')} /> {issue.upvotes}
          </Button>
        )}
        {!showCitizenActions && (
          <span className="text-sm font-semibold tabular-nums">{issue.upvotes} upvotes</span>
        )}
        <AccountabilityClock acknowledgedAt={issue.acknowledgedAt} />
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> Reported {issue.reportedAt}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground ml-auto"
          type="button"
          onClick={async () => {
            const url = window.location.href;
            if (navigator.share) {
              try { await navigator.share({ title: issue.title, text: issue.description, url }); } catch { /* cancelled */ }
            } else {
              await navigator.clipboard.writeText(url);
              toast({ title: 'Link copied to clipboard' });
            }
          }}
        >
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </div>

      <MapView center={[issue.lat, issue.lng]} zoom={15} markers={[{ lat: issue.lat, lng: issue.lng, label: issue.title }]} height={192} />

      {issue.broadcasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Government Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {issue.broadcasts.map((b) => (
              <div key={b.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                <div>
                  <p className="text-foreground">{b.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(b.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {issue.pledges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sweat & Tools Pledges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {issue.pledges.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                {p.type === 'sweat' ? <Hand className="w-4 h-4 text-warning" /> : <Wrench className="w-4 h-4 text-accent" />}
                <span className="font-medium">{p.userName}</span> pledged: {p.item}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {canVerify && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex flex-wrap gap-2 items-center justify-between">
            <p className="text-sm font-medium">Community fix pending verification</p>
            <div className="flex gap-2">
              <Button size="sm" type="button" onClick={() => void verifyResolve(true)}>
                Approve
              </Button>
              <Button size="sm" variant="outline" type="button" onClick={() => void verifyResolve(false)}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showCitizenActions && (
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            type="button"
            onClick={() => {
              setPledgeItem('');
              setPledgeOpen('sweat');
            }}
          >
            <Hand className="w-4 h-4" /> Pledge Time
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            type="button"
            onClick={() => {
              setPledgeItem('');
              setPledgeOpen('tools');
            }}
          >
            <Wrench className="w-4 h-4" /> Pledge Tools
          </Button>
          {isReporter && issue.status !== 'resolved' && issue.status !== 'community_resolved' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-success border-success/30 hover:bg-success/10"
              type="button"
              onClick={() => setResolveOpen(true)}
            >
              <CheckCircle2 className="w-4 h-4" /> Mark Community Fixed
            </Button>
          )}
          {canFlag && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={async () => {
                try {
                  await api.post(`/api/issues/${issue.id}/flag-fake`);
                  toast({ title: 'Flagged for review' });
                  load();
                } catch {
                  toast({ title: 'Could not flag', variant: 'destructive' });
                }
              }}
            >
              <Flag className="w-4 h-4" /> Flag Fake Fix
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Comments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a public comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button
                type="button"
                size="sm"
                disabled={!commentText.trim() || commentSending}
                onClick={() => void postComment()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {commentSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post comment'}
              </Button>
            </div>
          )}
          {!user && <p className="text-sm text-muted-foreground">Sign in to join the discussion.</p>}
          {issue.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
          ) : (
            <ul className="space-y-4 border-t pt-4">
              {issue.comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="font-medium text-foreground">{c.userName}</p>
                  <p className="text-muted-foreground mt-0.5">{c.text}</p>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    {new Date(c.timestamp).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={pledgeOpen !== null} onOpenChange={(o) => !o && setPledgeOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pledgeOpen === 'sweat' ? 'Pledge your time' : 'Pledge tools'}</DialogTitle>
            <DialogDescription>Let neighbors know what you can contribute to fix this issue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="pledge-item">What you&apos;ll contribute (optional)</Label>
            <Input
              id="pledge-item"
              value={pledgeItem}
              onChange={(e) => setPledgeItem(e.target.value)}
              placeholder={pledgeOpen === 'sweat' ? '2 hours Saturday morning' : 'Ladder and paint'}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPledgeOpen(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={pledgeSending} onClick={() => void submitPledge()}>
              {pledgeSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit pledge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark community fixed</DialogTitle>
            <DialogDescription>Upload a photo showing the fix. Advocates will verify before it counts as resolved.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="resolve-photo">After photo</Label>
            <Input id="resolve-photo" type="file" accept="image/*" ref={resolvePhotoRef} className="mt-1.5" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={resolveSending} onClick={() => void submitCommunityResolve()}>
              {resolveSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IssueDetail;
