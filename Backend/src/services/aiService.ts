import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IssueDocShape } from './issueTypes.js';

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-1.5-flash' })
  : null;

export function generateSummary(issue: {
  title: string;
  description: string;
  category: string;
  upvoteCount?: number;
}): string {
  const u = issue.upvoteCount ?? 0;
  const snippet = issue.description.slice(0, 120);
  return `${issue.title}. ${u} citizen upvotes. Category: ${issue.category}. ${snippet}`;
}

export function estimateCost(category: string): { workers: number; hours: number; materials: string; display: string } {
  const table: Record<string, { workers: number; hours: number; materials: string; display: string }> = {
    roads: { workers: 2, hours: 4, materials: '500kg asphalt', display: '2 workers, 4 hrs, 500kg asphalt — ₹15,000' },
    water: { workers: 3, hours: 6, materials: 'drainage pipes', display: '3 workers, 6 hrs, drainage pipes — ₹28,000' },
    parks: { workers: 2, hours: 3, materials: 'landscape materials', display: '2 workers, 3 hrs, materials — ₹12,000' },
    electricity: { workers: 2, hours: 3, materials: 'LED modules', display: '2 electricians, 3 hrs, 12 LED modules — ₹18,000' },
    sanitation: { workers: 4, hours: 8, materials: 'JCB + disposal', display: '4 workers, JCB, 1 day — ₹35,000' },
    public_safety: { workers: 1, hours: 1, materials: 'safety equipment', display: '1 worker, 1 hr, safety equipment — ₹5,000' },
    hazards: { workers: 2, hours: 2, materials: 'barricades', display: '2 workers, 2 hrs — ₹8,000' },
  };
  return table[category] ?? { workers: 2, hours: 4, materials: 'mixed', display: '2 workers, 4 hrs — ₹20,000' };
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function detectDuplicate(
  newLat: number,
  newLng: number,
  category: string,
  existing: IssueDocShape[]
): IssueDocShape | null {
  for (const i of existing) {
    if (i.category !== category || i.isDuplicate) continue;
    const d = haversineMeters(newLat, newLng, i.coordinates.lat, i.coordinates.lng);
    if (d <= 50) return i;
  }
  return null;
}

export function checkAbuse(text: string): { isAbusive: boolean; reason?: string } {
  const abuseWords = ['scam', 'fraud', 'corrupt', 'bribe', 'idiot', 'stupid'];
  const lower = text.toLowerCase();
  for (const w of abuseWords) {
    if (lower.includes(w)) return { isAbusive: true, reason: `Contains blocked term: ${w}` };
  }
  return { isAbusive: false };
}

export function getTranslationLabel(text: string): { isTranslated: boolean; originalLang?: string } {
  const punjabiPattern = /[\u0A00-\u0A7F]/;
  const hindiPattern = /[\u0900-\u097F]/;
  if (punjabiPattern.test(text)) return { isTranslated: true, originalLang: 'Punjabi' };
  if (hindiPattern.test(text)) return { isTranslated: true, originalLang: 'Hindi' };
  return { isTranslated: false };
}

export type PredictiveAlertItem = {
  id: string;
  city: string;
  neighborhood: string;
  category: string;
  message: string;
  season: string;
  severity: 'low' | 'medium' | 'high';
};

export async function llmSummary(issue: {
  title: string;
  description: string;
  category: string;
}): Promise<string> {
  if (!geminiClient) return generateSummary({ ...issue, upvoteCount: 0 });
  try {
    const prompt = `Summarize this civic issue in exactly 2 concise sentences for a government officer. Be factual and direct.\nTitle: ${issue.title}\nCategory: ${issue.category}\nDescription: ${issue.description.slice(0, 500)}`;
    const result = await geminiClient.generateContent(prompt);
    return result.response.text().trim() || generateSummary({ ...issue, upvoteCount: 0 });
  } catch {
    return generateSummary({ ...issue, upvoteCount: 0 });
  }
}

export async function llmSeverity(issue: {
  title: string;
  description: string;
  category: string;
  isRedAlert?: boolean;
}): Promise<number> {
  if (issue.isRedAlert) return 5;
  if (!geminiClient) return 3;
  try {
    const prompt = `Rate the severity of this civic issue on a scale of 1 (minor inconvenience) to 5 (critical emergency affecting safety/health). Reply with ONLY a single digit.\nTitle: ${issue.title}\nCategory: ${issue.category}\nDescription: ${issue.description.slice(0, 400)}`;
    const result = await geminiClient.generateContent(prompt);
    const n = parseInt(result.response.text().trim(), 10);
    return Number.isNaN(n) ? 3 : Math.min(5, Math.max(1, n));
  } catch {
    return 3;
  }
}

export async function llmAbuseCheck(text: string): Promise<{ isAbusive: boolean; reason?: string }> {
  const fast = checkAbuse(text);
  if (fast.isAbusive) return fast;
  if (!geminiClient) return fast;
  try {
    const prompt = `Is the following civic complaint text abusive, offensive, defamatory, or a clearly false/spam report? Reply with ONLY "YES: <short reason>" or "NO".\n\n${text.slice(0, 600)}`;
    const result = await geminiClient.generateContent(prompt);
    const reply = result.response.text().trim();
    if (reply.toUpperCase().startsWith('YES')) {
      return { isAbusive: true, reason: reply.slice(4).trim() || 'Flagged by AI moderation' };
    }
    return { isAbusive: false };
  } catch {
    return fast;
  }
}

export async function llmTranslate(text: string): Promise<string> {
  if (!geminiClient) return text;
  try {
    const prompt = `Translate the following civic complaint text to clear English. If it is already in English, return it unchanged. Reply with ONLY the translated text, no preamble.\n\n${text.slice(0, 1000)}`;
    const result = await geminiClient.generateContent(prompt);
    return result.response.text().trim() || text;
  } catch {
    return text;
  }
}

export function getPredictiveAlerts(city: string, month: number): PredictiveAlertItem[] {
  const alerts: PredictiveAlertItem[] = [];
  const id = (s: string) => `pa-${city}-${s}`;
  if (month >= 6 && month <= 9) {
    alerts.push({
      id: id('monsoon'),
      city,
      neighborhood: 'Citywide',
      category: 'water',
      message: `Monsoon prep for ${city}: schedule drain clearing and weak road patches`,
      season: 'Monsoon',
      severity: 'high',
    });
  }
  if (month >= 3 && month <= 5) {
    alerts.push({
      id: id('summer'),
      city,
      neighborhood: 'Industrial',
      category: 'electricity',
      message: `Summer load review for ${city}: transformer capacity and feeder lines`,
      season: 'Summer',
      severity: 'medium',
    });
  }
  if (month >= 10 || month <= 1) {
    alerts.push({
      id: id('winter'),
      city,
      neighborhood: 'Highways',
      category: 'roads',
      message: `Winter visibility for ${city}: road markers and streetlight checks`,
      season: 'Winter',
      severity: 'low',
    });
  }
  return alerts;
}
