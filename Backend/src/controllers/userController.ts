import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Issue } from '../models/Issue.js';
import { serializeUser } from '../utils/serializeUser.js';
import {
  certificateAchievementTitle,
  streamCertificatePdf,
  upsertCertificate,
} from '../services/certificateService.js';
import { serializeCitizenLeaderboard } from '../utils/leaderboard.js';

export async function getProfile(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(serializeUser(user));
}

export async function patchProfile(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { name, neighborhood, avatarUrl } = req.body as Record<string, string>;
  const u = await User.findById(req.userId);
  if (!u) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (name) u.name = name;
  if (neighborhood !== undefined) u.neighborhood = neighborhood;
  if (avatarUrl !== undefined) u.avatarUrl = avatarUrl.trim().slice(0, 500);
  await u.save();
  res.json(serializeUser(u));
}

export async function leaderboard(req: Request, res: Response) {
  const { city } = req.query;
  const q = city ? { city: String(city) } : {};
  const users = await User.find({ ...q, role: 'citizen' })
    .sort({ karmaPoints: -1 })
    .limit(50)
    .lean();
  res.json(serializeCitizenLeaderboard(users));
}

export async function exportMyIssues(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const issues = await Issue.find({ reportedBy: req.userId })
    .sort({ createdAt: -1 })
    .select('title description category status city neighborhood upvotes aiSummary priorityScore isRedAlert slaBreached createdAt resolvedAt')
    .lean();

  res.json(
    issues.map((i) => ({
      title: i.title,
      description: i.description,
      category: i.category,
      status: i.status,
      city: i.city,
      neighborhood: i.neighborhood,
      upvotes: (i.upvotes as unknown[]).length,
      aiSummary: i.aiSummary ?? '',
      priorityScore: i.priorityScore ?? 0,
      isRedAlert: !!i.isRedAlert,
      slaBreached: !!i.slaBreached,
      reportedAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : '',
      resolvedAt: i.resolvedAt instanceof Date ? i.resolvedAt.toISOString() : null,
    }))
  );
}

export async function certificatePdf(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const targetId = req.params.id;
  if (targetId !== req.userId && req.userRole !== 'mayor' && req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const user = await User.findById(targetId);
  if (!user) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const cert = await upsertCertificate(user);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="civicsync-certificate-${cert.serial}.pdf"`
  );
  const badges = (user.specialtyBadges ?? []).map((b: { badgeId: string }) => b.badgeId);
  const mayor = await User.findOne({ role: 'mayor', city: cert.city }).select('name').lean();

  const featuredIssue = await Issue.findOne({
    reportedBy: targetId,
    status: { $in: ['resolved', 'community_resolved'] },
  })
    .sort({ updatedAt: -1 })
    .select('title category status')
    .lean()
    ?? await Issue.findOne({ reportedBy: targetId })
      .sort({ createdAt: -1 })
      .select('title category status')
      .lean();

  await streamCertificatePdf(
    {
      serial: cert.serial,
      holderName: cert.holderName,
      city: cert.city,
      rank: cert.rank,
      achievementTitle: certificateAchievementTitle(
        cert.rank,
        cert.volunteerHours,
        cert.solutionsImplemented
      ),
      volunteerHours: cert.volunteerHours,
      solutionsImplemented: cert.solutionsImplemented,
      issuedAt: cert.issuedAt,
      avatarUrl: user.avatarUrl,
      badges,
      mayorName: mayor?.name ?? `Mayor of ${cert.city}`,
      featuredIssueTitle: featuredIssue?.title,
      featuredIssueCategory: featuredIssue?.category,
      featuredIssueStatus: featuredIssue?.status,
    },
    res
  );
}
