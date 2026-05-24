import { getRankLabel, getRankColor } from '@/lib/civicLabels';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Star, TrendingUp, FileText, Heart, CheckCircle2, BadgeCheck } from 'lucide-react';
import type { LeaderboardEntry } from '@/types';

type Props = {
  entries: LeaderboardEntry[];
  title?: string;
  subtitle?: string;
  showCity?: boolean;
};

const CivicLeaderboard = ({ entries, title, subtitle, showCity = false }: Props) => {
  if (!entries.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No ranking data yet. Citizens earn karma by reporting issues, volunteering, and verified fixes.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div>
          {title ? <h2 className="text-lg font-bold text-foreground">{title}</h2> : null}
          {subtitle ? <p className="text-sm text-muted-foreground mt-1">{subtitle}</p> : null}
        </div>
      )}

      <Card className="overflow-hidden border-primary/10 shadow-sm">
        <div className="bg-gradient-to-r from-primary/5 via-transparent to-amber-500/5 px-4 py-3 border-b flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          Ranked by karma — hover a row to see why
        </div>
        <div className="divide-y">
          {entries.map((e) => (
            <div
              key={e.userId}
              className="group flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                    e.rank === 1
                      ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-200'
                      : e.rank === 2
                        ? 'bg-slate-200 text-slate-800'
                        : e.rank === 3
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {e.rank <= 3 ? <Star className="w-4 h-4 fill-current" /> : e.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold truncate">{e.name}</p>
                    {e.phoneVerified && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>Phone-verified citizen</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge className={`text-xs ${getRankColor(e.userRank)}`}>{getRankLabel(e.userRank)}</Badge>
                    {showCity && e.city ? (
                      <span className="text-xs text-muted-foreground">{e.city}</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {e.whyRanked ?? 'Civic participation'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6 text-center shrink-0">
                <div>
                  <p className="text-lg font-black text-primary tabular-nums">{e.karmaPoints}</p>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium">Karma</p>
                </div>
                <div className="hidden sm:block w-px bg-border h-10" />
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1" title="Issues reported">
                    <FileText className="w-3.5 h-3.5" /> {e.issuesPosted ?? 0}
                  </span>
                  <span className="flex items-center gap-1" title="Volunteer hours">
                    <Heart className="w-3.5 h-3.5" /> {e.volunteerHours ?? 0}h
                  </span>
                  <span className="flex items-center gap-1" title="Solutions">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {e.solutionsImplemented ?? 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground px-1">
        Karma rewards verified reports (+10), volunteer hours, drive pledges, and community-resolved issues. Rankings update as citizens participate.
      </p>
    </div>
  );
};

export default CivicLeaderboard;
