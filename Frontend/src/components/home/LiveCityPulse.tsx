import { useEffect, useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Loader2, Hash } from 'lucide-react';
import type { Issue } from '@/types';
import { api } from '@/lib/api';
import { getCategoryLabel } from '@/lib/civicLabels';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const statusStyles: Record<string, string> = {
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  community_resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  acknowledged: 'bg-amber-50 text-amber-700 border-amber-200',
  open: 'bg-slate-100 text-slate-600 border-slate-200',
  red_alert: 'bg-red-50 text-red-700 border-red-200',
};

function issueImageUrl(issue: Issue): string | null {
  const url = issue.photoBeforeUrl || issue.photoAfterUrl;
  if (!url || url.includes('placeholder')) return null;
  return url;
}

const IssueExplorerCard = ({ issue }: { issue: Issue }) => {
  const img = issueImageUrl(issue);
  const statusLabel =
    issue.status === 'resolved' || issue.status === 'community_resolved'
      ? 'Completed'
      : issue.status === 'red_alert'
        ? 'Urgent'
        : issue.status.replace(/_/g, ' ');

  return (
    <Link
      to={`/issue/${issue.id}`}
      className="group block bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-100 via-blue-50 to-indigo-100 flex flex-col items-center justify-center gap-2 p-4">
            <span className="text-3xl opacity-60">📍</span>
            <span className="text-xs font-medium text-slate-500 text-center line-clamp-2">{issue.title}</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {getCategoryLabel(issue.category)}
        </span>
      </div>
      <div className="p-4 flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={cn('text-xs capitalize border', statusStyles[issue.status] || statusStyles.open)}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block" />
          {statusLabel}
        </Badge>
        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          {issue.city}
        </span>
      </div>
      <div className="px-4 pb-4 -mt-1 space-y-1">
        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{issue.title}</p>
        {issue.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{issue.description}</p>
        )}
      </div>
    </Link>
  );
};

type LiveCityPulseProps = {
  onSignUp?: () => void;
};

const LiveCityPulse = ({ onSignUp }: LiveCityPulseProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const { isAuthenticated } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ items: Issue[] }>('/api/issues', { params: { limit: 12 } })
      .then((r) => setIssues(r.data.items.slice(0, 6)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="live-pulse" className="py-20 sm:py-28 bg-section-lavender relative overflow-hidden scroll-mt-20">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-900/5 to-transparent pointer-events-none" />
      <div ref={ref} className="container max-w-6xl mx-auto px-4 relative">
        <div
          className={`text-center mb-14 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200 font-semibold gap-1">
            <Hash className="w-3 h-3" /> Live from your cities
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Explore{' '}
            <span className="text-gradient-brand">community issues</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Real reports from Punjab — upvote, comment, and track fixes with your neighbors.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-white/60 border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-slate-500">Could not load issues. Please try again later.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : issues.length === 0 ? (
          <p className="text-center text-slate-500 py-12">
            No issues yet —{' '}
            <button type="button" className="text-violet-600 font-semibold hover:underline" onClick={onSignUp}>
              report the first one
            </button>
            .
          </p>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {issues.map((issue) => (
              <IssueExplorerCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}

        <div className={`text-center mt-14 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {isAuthenticated ? (
            <Button size="lg" className="btn-gradient rounded-full px-8 gap-2 border-0" asChild>
              <Link to="/feed">
                Explore more <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" className="btn-gradient rounded-full px-8 gap-2 border-0" onClick={onSignUp}>
              Join to explore the full feed <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default LiveCityPulse;
