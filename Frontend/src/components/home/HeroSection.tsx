import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MapPin, Sparkles, ThumbsUp, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { homePathForRole } from '@/lib/authRouting';

type HeroSectionProps = {
  onSignIn?: () => void;
  onSignUp?: () => void;
};

type Summary = {
  issuesResolved: number;
  citiesActive: number;
  citizensParticipating: number;
};

const HeroSection = ({ onSignIn, onSignUp }: HeroSectionProps) => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Summary>({
    issuesResolved: 0,
    citiesActive: 9,
    citizensParticipating: 0,
  });
  const [issuesReported, setIssuesReported] = useState(0);

  useEffect(() => {
    api
      .get<Summary & { slaComplianceApprox: number }>('/api/stats/summary')
      .then((r) => setStats(r.data))
      .catch(() => {});
    api
      .get<{ total: number }>('/api/issues', { params: { limit: 1 } })
      .then((r) => setIssuesReported(r.data.total))
      .catch(() => {});
  }, []);

  const scrollToFeed = () => {
    document.getElementById('live-pulse')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const fmt = (n: number, fallback: string) => (n > 0 ? `${n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n}+` : fallback);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-hero pt-20">
      <div className="absolute inset-0 hero-grid opacity-60" />
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-violet-600/30 blur-[100px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-16 w-80 h-80 rounded-full bg-blue-600/25 blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.2s' }} />

      <div className="container max-w-6xl mx-auto px-4 py-16 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <Badge className="mb-6 bg-violet-500/20 text-violet-200 border-violet-400/30 hover:bg-violet-500/25 font-medium px-4 py-1">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
              Civic engagement platform
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
              Your Voice,{' '}
              <span className="text-gradient-brand">Your City</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              CivicSync connects citizens with local authorities to surface, prioritize, and resolve community issues — transparently.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-center lg:items-start justify-center lg:justify-start gap-3">
              {isAuthenticated && role ? (
                <Button
                  size="lg"
                  onClick={() => navigate(homePathForRole(role))}
                  className="btn-gradient rounded-full px-8 h-12 text-base gap-2 border-0"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to dashboard
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={onSignUp}
                  className="btn-gradient rounded-full px-8 h-12 text-base gap-2 border-0"
                >
                  Report an issue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToFeed}
                className="rounded-full h-12 px-8 border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Explore
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToHowItWorks}
                className="rounded-full h-12 px-8 border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                How it works
              </Button>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Already on CivicSync?{' '}
              <button type="button" className="text-violet-300 font-semibold hover:text-white hover:underline" onClick={onSignIn}>
                Sign in
              </button>
            </p>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-lg mx-auto lg:mx-0">
              {[
                { value: fmt(issuesReported, '2.4k+'), label: 'Issues reported', color: 'text-cyan-400' },
                { value: fmt(stats.issuesResolved, '1.8k+'), label: 'Resolved', color: 'text-emerald-400' },
                { value: fmt(stats.citizensParticipating, '5k+'), label: 'Community members', color: 'text-blue-400' },
                { value: `${stats.citiesActive || 9}+`, label: 'Cities active', color: 'text-amber-400' },
              ].map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <div className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="glass-card rounded-2xl p-5 max-w-md ml-auto animate-float">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Street light outage</h3>
                  <p className="text-xs text-slate-400">Main St & 5th Ave</p>
                </div>
                <Badge className="ml-auto bg-amber-500/20 text-amber-200 border-amber-500/30 text-xs">Pending</Badge>
              </div>
              <div className="h-36 rounded-xl overflow-hidden border border-white/5 mb-4 relative">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=70"
                  alt="Street light outage location"
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 flex items-end p-2">
                  <span className="text-xs text-white/80 flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5">
                    <MapPin className="w-3 h-3 text-red-400" /> Main St & 5th Ave
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ThumbsUp className="w-4 h-4 text-violet-400" /> 24 votes
                </span>
                <div className="flex -space-x-2">
                  {['bg-pink-500', 'bg-violet-500', 'bg-blue-500'].map((c) => (
                    <div key={c} className={`w-7 h-7 rounded-full ${c} border-2 border-slate-800`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-8 glass-card rounded-xl px-4 py-3 flex items-center gap-2 shadow-xl animate-float" style={{ animationDelay: '0.8s' }}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Issue resolved!</p>
                <p className="text-xs text-slate-400">2 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
