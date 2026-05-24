import type { Issue } from '@/types';

export function generateAISummary(issue: Pick<Issue, 'title' | 'description' | 'upvotes' | 'category'>): string {
  return `${issue.title}. ${issue.upvotes} citizen upvotes. Category: ${issue.category}. ${issue.description.slice(0, 80)}`;
}

export function estimateCost(category: string): string {
  const estimates: Record<string, string> = {
    roads: '2 workers, 4 hrs, 500kg asphalt — ₹15,000',
    water: '3 workers, 6 hrs, drainage pipes — ₹28,000',
    parks: '2 workers, 3 hrs, materials — ₹12,000',
    electricity: '2 electricians, 3 hrs, parts — ₹18,000',
    sanitation: '4 workers, JCB, 1 day — ₹35,000',
    public_safety: '1 worker, 1 hr, safety equipment — ₹5,000',
  };
  return estimates[category] || '2 workers, 4 hrs — ₹20,000';
}

export function detectDuplicates(issues: Issue[], newIssue: Pick<Issue, 'lat' | 'lng' | 'category'>): Issue[] {
  return issues.filter(
    (i) =>
      i.category === newIssue.category &&
      Math.abs(i.lat - newIssue.lat) < 0.005 &&
      Math.abs(i.lng - newIssue.lng) < 0.005
  );
}

export function detectLanguage(text: string): { isTranslated: boolean; originalLanguage?: string } {
  const punjabiPattern = /[\u0A00-\u0A7F]/;
  const hindiPattern = /[\u0900-\u097F]/;
  if (punjabiPattern.test(text)) return { isTranslated: true, originalLanguage: 'Punjabi' };
  if (hindiPattern.test(text)) return { isTranslated: true, originalLanguage: 'Hindi' };
  return { isTranslated: false };
}

export function checkAbuse(text: string): boolean {
  const abuseWords = ['scam', 'fraud', 'corrupt', 'bribe', 'idiot', 'stupid'];
  return abuseWords.some((w) => text.toLowerCase().includes(w));
}

export function generatePredictiveAlert(city: string, month: number): string | null {
  if (month >= 6 && month <= 8) return `Monsoon alert for ${city}: Pre-clear drains and reinforce weak road patches.`;
  if (month >= 4 && month <= 5) return `Summer alert for ${city}: Check transformer loads and water supply reserves.`;
  if (month >= 11 && month <= 12) return `Winter alert for ${city}: Inspect road visibility markers and streetlights.`;
  return null;
}
