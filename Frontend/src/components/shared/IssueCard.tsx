import { Link } from 'react-router-dom';
import type { Issue } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getCategoryLabel, getCategoryColor } from '@/lib/civicLabels';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { ThumbsUp, Clock, AlertTriangle, Languages, ShieldAlert } from 'lucide-react';

import { getIssueStatusColor, getIssueStatusLabel } from '@/lib/issueStatus';
import VerifiedCitizenBadge from '@/components/shared/VerifiedCitizenBadge';

const IssueCard = ({ issue, showLink = true }: { issue: Issue; showLink?: boolean }) => {
  const CatIcon = getCategoryIcon(issue.category);

  const content = (
    <div
      className={`bg-card rounded-xl border shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3 ${
        issue.isRedAlert ? 'animate-pulse-red border-destructive' : issue.slaBreached ? 'border-amber-400/60' : ''
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={`text-xs ${getIssueStatusColor(issue.status)}`}>{getIssueStatusLabel(issue.status)}</Badge>
        <Badge className={`text-xs gap-1 ${getCategoryColor(issue.category)}`}>
          <CatIcon className="w-3 h-3" />
          {getCategoryLabel(issue.category)}
        </Badge>
        <Badge variant="outline" className="text-xs">{issue.city}</Badge>
        {issue.isRedAlert && (
          <Badge className="bg-destructive text-destructive-foreground text-xs gap-1">
            <AlertTriangle className="w-3 h-3" /> Emergency
          </Badge>
        )}
      </div>

      <h3 className="font-bold text-sm text-card-foreground leading-tight">{issue.title}</h3>

      {issue.reporterName && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span>Reported by {issue.reporterName}</span>
          {issue.reporterPhoneVerified && <VerifiedCitizenBadge />}
        </p>
      )}

      {issue.aiSummary && (
        <p className="text-xs text-foreground/70 line-clamp-2">{issue.aiSummary}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-foreground/60 flex-wrap">
        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {issue.upvotes}</span>
        {issue.resolutionTimeDays && (
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {issue.resolutionTimeDays}d</span>
        )}
        {issue.isTranslated && (
          <span className="flex items-center gap-1 text-accent"><Languages className="w-3 h-3" /> {issue.originalLanguage}</span>
        )}
        {issue.isFakeFlagged && (
          <span className="flex items-center gap-1 text-destructive"><ShieldAlert className="w-3 h-3" /> Flagged</span>
        )}
      </div>
    </div>
  );

  if (showLink) {
    return <Link to={`/issue/${issue.id}`} className="block">{content}</Link>;
  }
  return content;
};

export default IssueCard;
