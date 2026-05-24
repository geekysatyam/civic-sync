/** Shared issue status labels and badge colors for cards, tables, and dashboards. */

export const issueStatusLabels: Record<string, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  community_resolved: 'Community Resolved',
  under_review: 'Under Review',
  recurred: 'Recurred',
  red_alert: 'Red Alert',
};

export const issueStatusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-900 font-medium dark:bg-blue-950 dark:text-blue-200',
  acknowledged: 'bg-amber-100 text-amber-900 font-medium dark:bg-amber-950 dark:text-amber-200',
  in_progress: 'bg-indigo-100 text-indigo-900 font-medium dark:bg-indigo-950 dark:text-indigo-200',
  resolved: 'bg-green-100 text-green-900 font-medium dark:bg-green-950 dark:text-green-200',
  community_resolved: 'bg-emerald-100 text-emerald-900 font-medium dark:bg-emerald-950 dark:text-emerald-200',
  under_review: 'bg-orange-100 text-orange-900 font-medium dark:bg-orange-950 dark:text-orange-200',
  recurred: 'bg-red-100 text-red-900 font-medium dark:bg-red-950 dark:text-red-200',
  red_alert: 'bg-red-200 text-red-950 font-semibold dark:bg-red-900 dark:text-red-100',
};

export function getIssueStatusLabel(status: string): string {
  return issueStatusLabels[status] ?? status.replace(/_/g, ' ');
}

export function getIssueStatusColor(status: string): string {
  return issueStatusColors[status] ?? 'bg-muted text-muted-foreground';
}

export function sortIssuesForMayor<T extends { isRedAlert?: boolean; slaBreached?: boolean; upvotes?: number; priorityScore?: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const score = (i: T) =>
      (i.priorityScore ?? 0) + (i.isRedAlert ? 1000 : 0) + (i.slaBreached ? 500 : 0) + (i.upvotes ?? 0);
    return score(b) - score(a);
  });
}

export function getPriorityLabel(score: number): { label: string; className: string } | null {
  if (score >= 90) return { label: 'Critical', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' };
  if (score >= 60) return { label: 'High', className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200' };
  if (score >= 40) return { label: 'Medium', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' };
  return null;
}
