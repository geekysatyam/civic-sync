import type { Types } from 'mongoose';

export function serializeArticle(doc: {
  _id: Types.ObjectId;
  headline: string;
  city: string;
  shortDescription?: string;
  fullContent?: string;
  coverImageUrl?: string;
  citizenQuotes?: { name?: string; quote?: string }[];
  outcomeStats?: { issuesFixed?: number; volunteersInvolved?: number; daysToResolve?: number };
  authorId: Types.ObjectId;
  authorName: string;
  authorRole: string;
  moderationStatus: string;
  moderationNote?: string;
  moderatedAt?: Date;
  publishedAt?: Date;
  createdAt?: Date;
}) {
  return {
    id: doc._id.toString(),
    headline: doc.headline,
    city: doc.city,
    shortDescription: doc.shortDescription ?? '',
    fullContent: doc.fullContent ?? '',
    coverImageUrl: doc.coverImageUrl ?? '',
    citizenQuotes: doc.citizenQuotes ?? [],
    outcomeStats: doc.outcomeStats ?? {},
    authorId: doc.authorId.toString(),
    authorName: doc.authorName,
    authorRole: doc.authorRole,
    moderationStatus: doc.moderationStatus,
    moderationNote: doc.moderationNote ?? '',
    moderatedAt: doc.moderatedAt?.toISOString(),
    publishedAt: doc.publishedAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString(),
  };
}
