import type { Request, Response } from 'express';
import { StoryArticle } from '../models/StoryArticle.js';
import { Article } from '../models/Article.js';

function mapStoryShape(s: {
  _id: { toString(): string };
  headline: string;
  city: string;
  coverImageUrl?: string;
  shortDescription?: string;
  fullContent?: string;
  citizenQuotes?: { name?: string; quote?: string }[];
  outcomeStats?: { issuesFixed?: number; volunteersInvolved?: number; daysToResolve?: number };
}) {
  return {
    id: s._id.toString(),
    headline: s.headline,
    city: s.city,
    coverPhotoUrl: s.coverImageUrl ?? '/placeholder.svg',
    shortDescription: s.shortDescription,
    fullStory: s.fullContent,
    citizenQuotes: (s.citizenQuotes ?? []).map((q) => `${q.quote} — ${q.name}`),
    outcomeStats: s.outcomeStats
      ? [
          `${s.outcomeStats.issuesFixed ?? 0} issues fixed`,
          `${s.outcomeStats.volunteersInvolved ?? 0} volunteers`,
          `${s.outcomeStats.daysToResolve ?? 0} days to resolve`,
        ]
      : [],
  };
}

export async function listStories(_req: Request, res: Response) {
  const [legacy, moderated] = await Promise.all([
    StoryArticle.find().sort({ publishedAt: -1 }).limit(10).lean(),
    Article.find({ moderationStatus: 'approved' }).sort({ publishedAt: -1 }).limit(20).lean(),
  ]);
  const combined = [
    ...moderated.map((a) =>
      mapStoryShape({
        _id: a._id,
        headline: a.headline,
        city: a.city,
        coverImageUrl: a.coverImageUrl ?? undefined,
        shortDescription: a.shortDescription ?? undefined,
        fullContent: a.fullContent ?? undefined,
        citizenQuotes: (a.citizenQuotes ?? []) as { name?: string; quote?: string }[],
        outcomeStats: (a.outcomeStats ?? undefined) as { issuesFixed?: number; volunteersInvolved?: number; daysToResolve?: number } | undefined,
      })
    ),
    ...legacy.map((s) =>
      mapStoryShape({
        _id: s._id,
        headline: s.headline,
        city: s.city,
        coverImageUrl: s.coverImageUrl ?? undefined,
        shortDescription: s.shortDescription ?? undefined,
        fullContent: s.fullContent ?? undefined,
        citizenQuotes: (s.citizenQuotes ?? []) as { name?: string; quote?: string }[],
        outcomeStats: (s.outcomeStats ?? undefined) as { issuesFixed?: number; volunteersInvolved?: number; daysToResolve?: number } | undefined,
      })
    ),
  ];
  res.json(combined.slice(0, 24));
}
