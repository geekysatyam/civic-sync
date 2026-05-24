import type { Types } from 'mongoose';
import type { ReporterMeta } from './issueReporter.js';

type Photo = { url?: string; type?: string };
type Broadcast = { message?: string; sentAt?: Date };
type Comment = { _id: Types.ObjectId; userId?: Types.ObjectId; userName?: string; text?: string; timestamp?: Date };
type Pledge = { _id: Types.ObjectId; userName?: string; type?: string; item?: string };

export type IssueLean = {
  _id: Types.ObjectId;
  createdAt?: Date;
  title: string;
  description: string;
  suggestedSolution: string;
  category: string;
  status: string;
  city: string;
  neighborhood: string;
  coordinates: { lat: number; lng: number };
  photos: Photo[];
  reportedBy: Types.ObjectId;
  upvotes: Types.ObjectId[];
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  resolutionTimeDays?: number;
  department?: Types.ObjectId;
  isRedAlert: boolean;
  isTranslated: boolean;
  originalLanguage?: string;
  aiSummary?: string;
  aiSeverity?: number;
  aiCostEstimate?: string;
  priorityScore?: number;
  contractorRating?: number;
  contractorRatingComment?: string;
  broadcasts: Broadcast[];
  comments: Comment[];
  pledges: Pledge[];
  isFakeFlagged: boolean;
  isAbuseFlagged?: boolean;
  slaBreached?: boolean;
  communityResolution?: {
    photo?: string;
    status?: string;
  };
  assignedContractor?: Types.ObjectId;
  contractorWorkStatus?: string;
  contractorUpdates?: {
    note?: string;
    workStatus?: string;
    createdAt?: Date;
    createdByName?: string;
  }[];
};

export function serializeIssue(doc: IssueLean, currentUserId?: string, reporter?: ReporterMeta) {
  const before = doc.photos?.find((p) => p.type === 'before');
  const after = doc.photos?.find((p) => p.type === 'after');
  const upvoterIds = (doc.upvotes ?? []).map((id) => id.toString());
  const upvoted = currentUserId ? upvoterIds.includes(currentUserId) : false;

  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    suggestedSolution: doc.suggestedSolution,
    category: doc.category,
    status: doc.status,
    city: doc.city,
    neighborhood: doc.neighborhood,
    lat: doc.coordinates.lat,
    lng: doc.coordinates.lng,
    photoBeforeUrl: before?.url || '/placeholder.svg',
    photoAfterUrl: after?.url,
    upvotes: doc.upvotes?.length ?? 0,
    upvoted,
    reportedBy: doc.reportedBy.toString(),
    reporterName: reporter?.name,
    reporterPhoneVerified: Boolean(reporter?.phoneVerified),
    reportedAt: (doc.createdAt ?? new Date()).toISOString().slice(0, 10),
    acknowledgedAt: doc.acknowledgedAt?.toISOString(),
    resolvedAt: doc.resolvedAt?.toISOString().slice(0, 10),
    resolutionTimeDays: doc.resolutionTimeDays,
    assignedDepartment: doc.department?.toString(),
    isRedAlert: doc.isRedAlert,
    slaBreached: Boolean(doc.slaBreached),
    isTranslated: doc.isTranslated,
    originalLanguage: doc.originalLanguage,
    aiSummary: doc.aiSummary,
    aiSeverity: doc.aiSeverity,
    priorityScore: doc.priorityScore ?? 0,
    costEstimate: doc.aiCostEstimate,
    contractorRating: doc.contractorRating,
    contractorRatingComment: doc.contractorRatingComment,
    broadcasts: (doc.broadcasts ?? []).map((b, i) => ({
      id: `b-${i}`,
      message: b.message ?? '',
      timestamp: (b.sentAt ?? new Date()).toISOString(),
    })),
    comments: (doc.comments ?? []).map((c) => ({
      id: c._id.toString(),
      userId: c.userId?.toString() ?? '',
      userName: c.userName ?? '',
      text: c.text ?? '',
      timestamp: (c.timestamp ?? new Date()).toISOString(),
    })),
    pledges: (doc.pledges ?? []).map((p) => ({
      id: p._id.toString(),
      userId: '',
      userName: p.userName ?? '',
      type: (p.type as 'sweat' | 'tools') ?? 'sweat',
      item: p.item ?? '',
    })),
    isFakeFlagged: doc.isFakeFlagged,
    communityResolution: doc.communityResolution,
    assignedContractorId: doc.assignedContractor?.toString(),
    contractorWorkStatus: doc.contractorWorkStatus ?? 'unassigned',
    contractorUpdates: (doc.contractorUpdates ?? []).map((u, i) => ({
      id: `cu-${i}`,
      note: u.note ?? '',
      workStatus: u.workStatus ?? '',
      createdAt: (u.createdAt ?? new Date()).toISOString(),
      createdByName: u.createdByName ?? '',
    })),
  };
}
