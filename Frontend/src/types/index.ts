export type Role = 'citizen' | 'mayor' | 'state_admin' | 'admin' | 'contractor' | 'department_head';

export type IssueStatus =
  | 'open'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'community_resolved'
  | 'under_review'
  | 'recurred'
  | 'red_alert';

export type IssueCategory =
  | 'roads'
  | 'water'
  | 'parks'
  | 'electricity'
  | 'sanitation'
  | 'public_safety';

export type UserRank =
  | 'civic_scout'
  | 'block_captain'
  | 'neighborhood_advocate'
  | 'city_guardian'
  | 'district_champion'
  | 'state_legend';

export type BadgeType =
  | 'civic_newcomer'
  | 'pothole_patrol'
  | 'green_guardian'
  | 'water_warrior'
  | 'first_responder'
  | 'peacemaker'
  | 'community_builder'
  | 'night_owl'
  | 'streak_keeper'
  | 'super_voter'
  | 'ghost_inspector'
  | 'truth_seeker'
  | 'power_reporter'
  | 'sanitation_hero'
  | 'electric_eye'
  | 'volunteer_star';

export type AuditStatus = 'pending' | 'passed' | 'recurred';
export type CSRStatus = 'pending' | 'confirmed' | 'funded' | 'forwarded' | 'sponsored';

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Department {
  id: string;
  name: string;
  category: IssueCategory;
  avgResolutionDays: number;
  slaCompliancePercent: number;
}

export interface KarmaCoupon {
  id: string;
  rewardId: string;
  couponCode: string;
  businessName: string;
  description: string;
  redeemedAt: string;
}

export type AuthProvider = 'local' | 'google';

export interface User {
  id: string;
  name: string;
  email?: string;
  city: string;
  role: Role;
  rank: UserRank;
  xp: number;
  karmaPoints: number;
  badges: BadgeType[];
  issuesPosted: number;
  solutionsImplemented: number;
  volunteerHours: number;
  avatarUrl?: string;
  redeemedCoupons?: KarmaCoupon[];
  contractorCategory?: string;
  contractorLabel?: string;
  profileComplete?: boolean;
  authProvider?: AuthProvider;
  phone?: string;
  phoneVerified?: boolean;
}

export type ArticleModerationStatus = 'pending' | 'approved' | 'rejected';

export interface CivicArticle {
  id: string;
  headline: string;
  city: string;
  shortDescription: string;
  fullContent: string;
  coverImageUrl: string;
  authorName: string;
  authorRole: string;
  moderationStatus: ArticleModerationStatus;
  moderationNote?: string;
  publishedAt?: string;
  createdAt?: string;
}

export interface ContractorSummary {
  id: string;
  name: string;
  email: string;
  city: string;
  contractorCategory: string;
  contractorLabel: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  suggestedSolution: string;
  category: IssueCategory;
  status: IssueStatus;
  city: string;
  neighborhood: string;
  lat: number;
  lng: number;
  photoBeforeUrl: string;
  photoAfterUrl?: string;
  upvotes: number;
  reportedBy: string;
  reporterName?: string;
  reporterPhoneVerified?: boolean;
  reportedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionTimeDays?: number;
  assignedDepartment?: string;
  isRedAlert: boolean;
  slaBreached?: boolean;
  isTranslated: boolean;
  originalLanguage?: string;
  aiSummary?: string;
  costEstimate?: string;
  broadcasts: Broadcast[];
  comments: Comment[];
  pledges: Pledge[];
  isFakeFlagged: boolean;
  upvoted?: boolean;
  communityResolution?: {
    photo?: string;
    status?: 'pending' | 'approved' | 'rejected';
  };
  assignedContractorId?: string;
  contractorWorkStatus?: string;
  contractorRating?: number;
  contractorRatingComment?: string;
  contractorUpdates?: {
    id: string;
    note: string;
    workStatus: string;
    createdAt: string;
    createdByName: string;
  }[];
  aiSeverity?: number;
  priorityScore?: number;
}

export interface Broadcast {
  id: string;
  message: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Pledge {
  id: string;
  userId: string;
  userName: string;
  type: 'sweat' | 'tools';
  item: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  city: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  createdBy?: string;
  isMine?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface KarmaReward {
  id: string;
  businessName: string;
  description: string;
  pointCost: number;
  category: string;
}

export interface VolunteerDrive {
  id: string;
  title: string;
  description: string;
  city: string;
  date: string;
  neededItems: DriveItem[];
  pledgedItems: DriveItem[];
}

export interface DriveItem {
  name: string;
  quantity: number;
  pledgedBy?: string;
  pledgedByName?: string;
}

export interface GhostAudit {
  id: string;
  issueId: string;
  issueTitle: string;
  resolvedAt: string;
  auditDueAt: string;
  assignedTo: string;
  status: AuditStatus;
  city: string;
}

export interface StoryArticle {
  id: string;
  headline: string;
  city: string;
  coverPhotoUrl: string;
  shortDescription: string;
  fullStory: string;
  citizenQuotes: string[];
  outcomeStats: string[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  city: string;
  userRank: UserRank;
  karmaPoints: number;
  issuesPosted?: number;
  volunteerHours?: number;
  solutionsImplemented?: number;
  phoneVerified?: boolean;
  whyRanked?: string;
}

export interface PredictiveAlert {
  id: string;
  city: string;
  neighborhood: string;
  category: IssueCategory;
  message: string;
  season: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CSRProject {
  id: string;
  issueId: string;
  issueTitle: string;
  businessName: string;
  status: CSRStatus;
  fundingAmount?: number;
  city: string;
}

export interface Notification {
  id: string;
  type: 'fix_confirmed' | 'sla_breach' | 'broadcast' | 'volunteer' | 'audit' | 'audit_ping' | 'rank_up' | 'verification' | 'super_vote_reset';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: { issueId?: string; city?: string; couponCode?: string };
}
