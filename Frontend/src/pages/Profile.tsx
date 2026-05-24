import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getRankLabel, getRankColor } from '@/lib/civicLabels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Award, Flame, Droplets, TreePine, Zap, Heart, Download, Camera, Lock, Eye, Loader2, Shield, Sparkles, Clock, TrendingUp, Search, Megaphone, Trash2, Lightbulb, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BadgeType } from '@/types';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardPage from '@/components/dashboard/DashboardPage';
import VerifiedCitizenBadge from '@/components/shared/VerifiedCitizenBadge';

const badgeConfig: Record<BadgeType, { label: string; icon: typeof Star; color: string }> = {
  civic_newcomer:   { label: 'Civic Newcomer',   icon: Sparkles,   color: 'text-violet-500' },
  pothole_patrol:   { label: 'Pothole Patrol',    icon: Flame,      color: 'text-amber-600' },
  green_guardian:   { label: 'Green Guardian',    icon: TreePine,   color: 'text-green-600' },
  water_warrior:    { label: 'Water Warrior',     icon: Droplets,   color: 'text-blue-600' },
  first_responder:  { label: 'First Responder',   icon: Zap,        color: 'text-red-600' },
  peacemaker:       { label: 'Peacemaker',        icon: Heart,      color: 'text-purple-600' },
  community_builder:{ label: 'Community Builder', icon: Award,      color: 'text-teal-600' },
  night_owl:        { label: 'Night Owl',         icon: Clock,      color: 'text-indigo-500' },
  streak_keeper:    { label: 'Streak Keeper',     icon: TrendingUp, color: 'text-orange-500' },
  super_voter:      { label: 'Super Voter',       icon: Megaphone,  color: 'text-pink-600' },
  ghost_inspector:  { label: 'Ghost Inspector',   icon: Search,     color: 'text-slate-600' },
  truth_seeker:     { label: 'Truth Seeker',      icon: Shield,     color: 'text-cyan-600' },
  power_reporter:   { label: 'Power Reporter',    icon: Star,       color: 'text-yellow-600' },
  sanitation_hero:  { label: 'Sanitation Hero',   icon: Trash2,     color: 'text-lime-600' },
  electric_eye:     { label: 'Electric Eye',      icon: Lightbulb,  color: 'text-yellow-500' },
  volunteer_star:   { label: 'Volunteer Star',    icon: Users,      color: 'text-emerald-600' },
};

const allBadges: BadgeType[] = Object.keys(badgeConfig) as BadgeType[];

const badgeUnlockHints: Record<BadgeType, string> = {
  civic_newcomer:    'Awarded automatically on signup — welcome to CivicSync!',
  pothole_patrol:    'Report 5+ road or pavement issues',
  green_guardian:    'Contribute to 3+ parks & green space issues',
  water_warrior:     'Report 3+ water supply or drainage problems',
  first_responder:   'Flag a public safety or red-alert issue',
  peacemaker:        'Help verify 3+ community resolutions',
  community_builder: 'Reach 500 karma from reports, volunteer hours & solutions',
  night_owl:         'Submit a report between midnight and 5 AM',
  streak_keeper:     'Report issues 7 days in a row',
  super_voter:       'Use your monthly super-vote as Block Captain+',
  ghost_inspector:   'Complete a ghost audit as City Guardian',
  truth_seeker:      'Flag a fake fix that gets confirmed by the department',
  power_reporter:    'Have 10+ issues acknowledged by departments',
  sanitation_hero:   'Report 5+ sanitation issues',
  electric_eye:      'Report 5+ electricity issues',
  volunteer_star:    'Log 20+ volunteer hours',
};

const badgeCategories: { label: string; ids: BadgeType[] }[] = [
  { label: 'Welcome',   ids: ['civic_newcomer'] },
  { label: 'Reporting', ids: ['pothole_patrol', 'water_warrior', 'first_responder', 'sanitation_hero', 'electric_eye', 'power_reporter'] },
  { label: 'Community', ids: ['peacemaker', 'community_builder', 'truth_seeker', 'super_voter'] },
  { label: 'Volunteer', ids: ['green_guardian', 'volunteer_star'] },
  { label: 'Special',   ids: ['night_owl', 'streak_keeper', 'ghost_inspector'] },
];

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=civic1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=civic2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=civic3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=civic4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=civic5',
];

const rankXpThresholds = {
  civic_scout: 0,
  block_captain: 500,
  neighborhood_advocate: 1500,
  city_guardian: 4000,
  district_champion: 9000,
  state_legend: 20000,
};
const rankOrder = ['civic_scout', 'block_captain', 'neighborhood_advocate', 'city_guardian', 'district_champion', 'state_legend'] as const;

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [certPreviewOpen, setCertPreviewOpen] = useState(false);
  const [certPreviewUrl, setCertPreviewUrl] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState(false);

  if (!user) return null;

  const certFilename = `CivicSync_Certificate_${user.name.replace(/\s+/g, '-')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  const currentIdx = rankOrder.indexOf(user.rank);
  const nextRank = currentIdx < rankOrder.length - 1 ? rankOrder[currentIdx + 1] : null;
  const currentThreshold = rankXpThresholds[user.rank];
  const nextThreshold = nextRank ? rankXpThresholds[nextRank] : user.xp;
  const progress = nextRank ? ((user.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100 : 100;

  const fetchCertificateBlob = async () => {
    const res = await api.get(`/api/users/${user.id}/certificates`, { responseType: 'blob' });
    return res.data as Blob;
  };

  const downloadCertificate = async () => {
    try {
      const blob = await fetchCertificateBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = certFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Certificate downloaded' });
    } catch {
      toast({ title: 'Could not download PDF', description: 'Sign in and ensure the API is running.', variant: 'destructive' });
    }
  };

  const openCertificatePreview = async () => {
    setCertLoading(true);
    setCertPreviewOpen(true);
    try {
      if (certPreviewUrl) URL.revokeObjectURL(certPreviewUrl);
      const blob = await fetchCertificateBlob();
      setCertPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setCertPreviewOpen(false);
      toast({ title: 'Could not load preview', variant: 'destructive' });
    } finally {
      setCertLoading(false);
    }
  };

  const setAvatar = async (avatarUrl: string) => {
    try {
      await api.patch('/api/users/profile', { avatarUrl });
      await refreshProfile();
      toast({ title: 'Profile photo updated' });
    } catch {
      toast({ title: 'Could not save avatar', variant: 'destructive' });
    }
  };

  const onAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f?.type.startsWith('image/')) {
      toast({ title: 'Choose an image file', variant: 'destructive' });
      return;
    }
    try {
      const fd = new FormData();
      fd.append('file', f);
      const { data } = await api.post<{ url: string }>('/api/upload/image', fd);
      await setAvatar(data.url);
    } catch {
      toast({ title: 'Upload failed', description: 'Configure Cloudinary in the backend for uploads.', variant: 'destructive' });
    }
    e.target.value = '';
  };

  return (
    <DashboardPage maxWidth="lg" title="Your profile" description="Track rank progress, specialty badges, and your verifiable civic certificate.">
      <Card className="overflow-hidden border-primary/10 shadow-md">
        <div className="h-2 bg-gradient-to-r from-primary via-teal-500 to-amber-400" />
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg ring-2 ring-primary/20">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="w-4 h-4" />
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onAvatarUpload(e)} />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2 justify-center sm:justify-start">
              {user.name}
              {user.phoneVerified && <VerifiedCitizenBadge size="md" />}
            </h1>
            <p className="text-muted-foreground">{user.city}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
              <Badge className={getRankColor(user.rank)}>{getRankLabel(user.rank)}</Badge>
              {user.rank === 'city_guardian' && <Badge className="bg-accent/10 text-accent border-accent/20">Trusted Reporter</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Preset avatars:</p>
            <div className="flex flex-wrap gap-2 mt-1 justify-center sm:justify-start">
              {AVATAR_PRESETS.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => void setAvatar(src)}
                  className="w-10 h-10 rounded-full border-2 border-transparent hover:border-accent hover:scale-105 transition-all overflow-hidden bg-muted"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div className="text-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 px-6 py-4 border border-amber-200/50">
            <p className="text-3xl font-black text-amber-700 dark:text-amber-400 tabular-nums">{user.karmaPoints}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Karma</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              {user.xp.toLocaleString()} XP
            </span>
            {nextRank && (
              <span className="text-xs text-muted-foreground">
                Next: <strong className="text-foreground">{getRankLabel(nextRank)}</strong> at {nextThreshold.toLocaleString()} XP
              </span>
            )}
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-teal-500 transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          {nextRank ? (
            <p className="text-sm font-medium text-foreground mt-3">
              You need <strong>{Math.max(0, nextThreshold - user.xp).toLocaleString()} XP</strong> to reach{' '}
              {getRankLabel(nextRank)}.
            </p>
          ) : (
            <p className="text-sm font-medium text-success mt-3">Maximum civic rank achieved.</p>
          )}
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            {user.rank === 'block_captain' && <p>✦ Unlocked: Monthly Super-Vote</p>}
            {user.rank === 'neighborhood_advocate' && <p>✦ Unlocked: Community Verifier + Fake Fix Flagging</p>}
            {user.rank === 'city_guardian' && <p>✦ Unlocked: Post bypass + Ghost Inspector duties</p>}
            {user.rank === 'district_champion' && <p>✦ Unlocked: District-wide analytics + Priority escalation</p>}
            {user.rank === 'state_legend' && <p>✦ Unlocked: State leaderboard + Permanent Trusted Reporter</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Issues Posted', value: user.issuesPosted },
          { label: 'Solutions Done', value: user.solutionsImplemented },
          { label: 'Volunteer Hours', value: user.volunteerHours },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-black text-foreground tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Specialty Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Tabs defaultValue="Reporting">
              <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
                {badgeCategories.map((c) => (
                  <TabsTrigger key={c.label} value={c.label} className="text-xs">
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {badgeCategories.map((cat) => (
                <TabsContent key={cat.label} value={cat.label}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {cat.ids.map((b) => {
                      const cfg = badgeConfig[b];
                      const unlocked = user.badges.includes(b);
                      return (
                        <Tooltip key={b}>
                          <TooltipTrigger asChild>
                            <div
                              className={`relative flex flex-col items-center text-center gap-2 p-4 rounded-xl border-2 transition-all cursor-default ${
                                unlocked
                                  ? 'border-primary/30 bg-gradient-to-b from-primary/5 to-card shadow-sm hover:shadow-md'
                                  : 'border-dashed border-muted-foreground/25 bg-muted/30 grayscale'
                              }`}
                            >
                              {!unlocked && (
                                <div className="absolute top-2 right-2">
                                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                              )}
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  unlocked ? 'bg-background shadow-inner' : 'bg-muted'
                                }`}
                              >
                                <cfg.icon className={`w-7 h-7 ${unlocked ? cfg.color : 'text-muted-foreground/50'}`} />
                              </div>
                              <p className={`text-xs font-bold ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {cfg.label}
                              </p>
                              <Badge variant={unlocked ? 'default' : 'secondary'} className="text-[10px]">
                                {unlocked ? 'Unlocked' : 'Locked'}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs text-xs">
                            {unlocked ? `${cfg.label} — earned through civic participation` : badgeUnlockHints[b]}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TooltipProvider>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2 h-12 hover:bg-primary/5 transition-colors"
          type="button"
          onClick={() => void openCertificatePreview()}
        >
          <Eye className="w-4 h-4" /> Preview certificate
        </Button>
        <Button
          variant="default"
          className="flex-1 gap-2 h-12"
          type="button"
          onClick={() => void downloadCertificate()}
        >
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>
      <Button
        variant="outline"
        className="w-full gap-2 h-10"
        type="button"
        onClick={async () => {
          try {
            const { data } = await api.get<object[]>('/api/users/me/issues/export');
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CivicSync_Issues_${user.name.replace(/\s+/g, '-')}_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast({ title: `Exported ${(data as object[]).length} issues` });
          } catch {
            toast({ title: 'Export failed', variant: 'destructive' });
          }
        }}
      >
        <Download className="w-4 h-4" /> Export my issues (JSON)
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        QR on the certificate links to a public verify page — share it to let anyone confirm your civic record.
      </p>

      <Dialog
        open={certPreviewOpen}
        onOpenChange={(open) => {
          setCertPreviewOpen(open);
          if (!open && certPreviewUrl) {
            URL.revokeObjectURL(certPreviewUrl);
            setCertPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Certificate preview</DialogTitle>
            <DialogDescription>{certFilename}</DialogDescription>
          </DialogHeader>
          <div className="min-h-[420px] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {certLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : certPreviewUrl ? (
              <iframe title="Certificate PDF" src={certPreviewUrl} className="w-full h-[60vh] border-0" />
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCertPreviewOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => void downloadCertificate()}>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPage>
  );
};

export default Profile;
