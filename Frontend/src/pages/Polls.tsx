import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Clock, Plus, Loader2 } from 'lucide-react';
import type { Poll } from '@/types';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Polls = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [archived, setArchived] = useState<Poll[]>([]);
  const [tab, setTab] = useState<'active' | 'archived' | 'mine'>('active');
  const [myPolls, setMyPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [expires, setExpires] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const city = user?.city;
    Promise.all([
      api.get<Poll[]>('/api/polls', { params: { city } }),
      api.get<Poll[]>('/api/polls/archived', { params: { city } }),
      user ? api.get<Poll[]>('/api/polls/mine') : Promise.resolve({ data: [] as Poll[] }),
    ])
      .then(([active, arch, mine]) => {
        setPolls(active.data);
        setArchived(arch.data);
        setMyPolls(mine.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user?.city, user?.id]);

  const vote = async (pollId: string, optionId: string) => {
    try {
      await api.post(`/api/polls/${pollId}/vote`, { optionId });
      toast({ title: 'Vote recorded' });
      load();
    } catch {
      toast({ title: 'Sign in to vote', variant: 'destructive' });
    }
  };

  const submitPoll = async () => {
    if (!user || user.role !== 'citizen') {
      toast({ title: 'Citizen accounts only', description: 'Sign in as a citizen to create a poll.', variant: 'destructive' });
      return;
    }
    const options = [opt1, opt2].map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || options.length < 2 || !expires) {
      toast({ title: 'Add question, two options, and expiry', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/polls', {
        question: pollQuestion.trim(),
        options,
        city: user.city || 'Ludhiana',
        expiresAt: new Date(expires).toISOString(),
      });
      toast({ title: 'Poll created' });
      setOpen(false);
      setPollQuestion('');
      setOpt1('');
      setOpt2('');
      setExpires('');
      load();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: 'Could not create poll', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading polls…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-foreground">Nukkad Polls</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5" type="button">
              <Plus className="w-4 h-4" /> Create poll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New poll</DialogTitle>
              <DialogDescription>Citizens can create polls for their city. Mayor &quot;reverse pitch&quot; polls use the mayor dashboard.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="pq">Question</Label>
                <Textarea id="pq" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} rows={2} placeholder="What should we fix first?" />
              </div>
              <div>
                <Label>Option A</Label>
                <Input value={opt1} onChange={(e) => setOpt1(e.target.value)} placeholder="Roads" />
              </div>
              <div>
                <Label>Option B</Label>
                <Input value={opt2} onChange={(e) => setOpt2(e.target.value)} placeholder="Water" />
              </div>
              <div>
                <Label>Closes at</Label>
                <Input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">City: {user?.city ?? '—'}</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void submitPoll()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button type="button" size="sm" variant={tab === 'active' ? 'default' : 'outline'} onClick={() => setTab('active')}>
          Active
        </Button>
        <Button type="button" size="sm" variant={tab === 'archived' ? 'default' : 'outline'} onClick={() => setTab('archived')}>
          Archived
        </Button>
        <Button type="button" size="sm" variant={tab === 'mine' ? 'default' : 'outline'} onClick={() => setTab('mine')}>
          My polls {myPolls.length > 0 ? `(${myPolls.length})` : ''}
        </Button>
      </div>

      {tab === 'mine' && myPolls.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg bg-muted/30">
          You haven&apos;t created a poll yet. Tap <strong>Create poll</strong> — it appears here and under Active for your city.
        </p>
      )}

      {(tab === 'active' ? polls : tab === 'archived' ? archived : myPolls).map((poll) => {
        const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
        return (
          <Card key={poll.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={poll.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                    {poll.isActive ? 'Active' : 'Archived'}
                  </Badge>
                  {(poll.isMine || tab === 'mine') && (
                    <Badge variant="outline" className="text-xs">
                      Your poll
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {poll.isActive ? 'Open' : 'Ended'}
                </span>
              </div>
              <CardTitle className="text-base mt-2">{poll.question}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {poll.city} · {totalVotes} votes
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {poll.options.map((opt) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                return (
                  <div key={opt.id}>
                    <div className="flex items-center justify-between mb-1">
                      <button
                        type="button"
                        className={`text-sm font-medium text-left ${poll.isActive ? 'hover:text-accent cursor-pointer text-foreground' : 'text-foreground'}`}
                        onClick={() => {
                          if (poll.isActive) void vote(poll.id, opt.id);
                        }}
                      >
                        {opt.text}
                      </button>
                      <span className="text-xs font-bold text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Polls;
