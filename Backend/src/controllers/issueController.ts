import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Issue } from '../models/Issue.js';
import { User } from '../models/User.js';
import { GhostAudit } from '../models/GhostAudit.js';
import { awardCitizen } from '../services/karmaService.js';
import { Department } from '../models/Department.js';
import { Notification } from '../models/Notification.js';
import {
  estimateCost,
  detectDuplicate,
  getTranslationLabel,
  llmSummary,
  llmSeverity,
  llmAbuseCheck,
} from '../services/aiService.js';
import { AuditLog } from '../models/AuditLog.js';
import { reverseGeocode } from '../services/geocodingService.js';
import { uploadBuffer } from '../services/cloudinaryService.js';
import { sendBulkSameSubject } from '../services/emailService.js';
import { reporterMetaByIds } from '../utils/issueReporter.js';
import { serializeIssue } from '../utils/serializeIssue.js';

async function findDepartment(city: string, category: string) {
  return Department.findOne({ city, category }).lean();
}

export async function listIssues(req: Request, res: Response) {
  const { city, neighborhood, category, status, page = '1', limit = '20' } = req.query;
  const q: Record<string, unknown> = {};
  if (city) q.city = city;
  if (neighborhood) q.neighborhood = new RegExp(String(neighborhood), 'i');
  if (category) q.category = category;
  if (status) q.status = status;
  const p = Math.max(1, parseInt(String(page), 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  const [items, total] = await Promise.all([
    Issue.find(q)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Issue.countDocuments(q),
  ]);
  const reporterMeta = await reporterMetaByIds(items.map((i) => i.reportedBy.toString()));
  res.json({
    items: items.map((doc) =>
      serializeIssue(doc as never, req.userId, reporterMeta[doc.reportedBy.toString()])
    ),
    total,
    page: p,
    limit: l,
  });
}

export async function getIssue(req: Request, res: Response) {
  const doc = await Issue.findById(req.params.id).lean();
  if (!doc) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const reporterMeta = await reporterMetaByIds([doc.reportedBy.toString()]);
  res.json(serializeIssue(doc as never, req.userId, reporterMeta[doc.reportedBy.toString()]));
}

export async function createIssue(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const title = String(body.title ?? '');
  const description = String(body.description ?? '');
  const suggestedSolution = String(body.suggestedSolution ?? '');
  const category = String(body.category ?? '');
  let city = String(body.city ?? '');
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const rawAlert = body.isRedAlert;
  const isRedAlert =
    rawAlert === true ||
    rawAlert === 'true' ||
    rawAlert === '1' ||
    String(rawAlert).toLowerCase() === 'true';
  if (!title || !description || !suggestedSolution || !category || Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400).json({ error: 'title, description, suggestedSolution, category, lat, lng required' });
    return;
  }

  let neighborhood = String(body.neighborhood ?? '');
  if (!neighborhood || !city) {
    const geo = await reverseGeocode(lat, lng);
    if (!neighborhood) neighborhood = geo.neighborhood || 'Unknown';
    if (!city) city = geo.city || 'Ludhiana';
  }

  const candidates = await Issue.find({ city, category })
    .limit(200)
    .select('category coordinates isDuplicate')
    .lean();
  const dup = detectDuplicate(
    lat,
    lng,
    category,
    candidates.map((i) => ({
      _id: i._id as mongoose.Types.ObjectId,
      category: i.category,
      coordinates: {
        lat: i.coordinates?.lat ?? 0,
        lng: i.coordinates?.lng ?? 0,
      },
      isDuplicate: i.isDuplicate,
    }))
  );

  const [abuse, summary, severity] = await Promise.all([
    llmAbuseCheck(`${title} ${description} ${suggestedSolution}`),
    llmSummary({ title, description, category }),
    llmSeverity({ title, description, category, isRedAlert }),
  ]);
  const trans = getTranslationLabel(`${title} ${description}`);
  const cost = estimateCost(category);
  const priorityScore = (severity * 20) + (isRedAlert ? 50 : 0);

  const photos: { url: string; type: 'before' | 'after'; uploadedBy: mongoose.Types.ObjectId }[] = [];
  const file = req.file as Express.Multer.File | undefined;
  if (file?.buffer) {
    const up = await uploadBuffer(file.buffer);
    photos.push({ url: up.url, type: 'before', uploadedBy: new mongoose.Types.ObjectId(req.userId) });
  }

  let status: string = abuse.isAbusive ? 'under_review' : 'open';
  if (isRedAlert) status = 'red_alert';

  const issue = await Issue.create({
    title,
    description,
    suggestedSolution,
    category,
    city,
    neighborhood,
    coordinates: { lat, lng },
    photos,
    reportedBy: req.userId,
    upvotes: [],
    status,
    isRedAlert,
    aiSummary: summary,
    aiSeverity: severity,
    priorityScore,
    aiCostEstimate: cost.display,
    aiResourceEstimate: { workers: cost.workers, hours: cost.hours, materials: cost.materials },
    isTranslated: trans.isTranslated,
    originalLanguage: trans.originalLang,
    isAbuseFlagged: abuse.isAbusive,
    abuseReviewStatus: abuse.isAbusive ? 'pending' : 'cleared',
    isDuplicate: !!dup,
    duplicateOf: dup?._id,
    comments: [],
    pledges: [],
    broadcasts: [],
  });

  await User.updateOne({ _id: req.userId }, { $inc: { issuesPosted: 1 } });
  await awardCitizen(req.userId, 15, 25, { reason: 'reporting a civic issue' });

  const lean = await Issue.findById(issue._id).lean();
  res.status(201).json(serializeIssue(lean as never, req.userId));
}

export async function toggleUpvote(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const uid = new mongoose.Types.ObjectId(req.userId);
  const idx = issue.upvotes.findIndex((id) => id.equals(uid));
  if (idx >= 0) {
    issue.upvotes.splice(idx, 1);
  } else {
    issue.upvotes.push(uid);
    const reporterId = issue.reportedBy?.toString();
    if (reporterId && reporterId !== req.userId) {
      await awardCitizen(reporterId, 3, 5, { reason: 'community upvote on your issue' });
    }
  }
  await issue.save();
  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}

export async function acknowledgeIssue(req: Request, res: Response) {
  if (!req.userId || req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const mayor = await User.findById(req.userId);
  const issue = await Issue.findById(req.params.id);
  if (!issue || !mayor) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (issue.city !== mayor.city) {
    res.status(403).json({ error: 'Wrong city' });
    return;
  }
  const dept = await findDepartment(issue.city, issue.category);
  const now = new Date();
  issue.acknowledgedAt = now;
  issue.status = 'acknowledged';
  if (issue.isRedAlert) issue.redAlertAcknowledgedAt = now;
  if (dept) {
    issue.department = dept._id as mongoose.Types.ObjectId;
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + (dept.avgResolutionDays ?? 7));
    issue.slaDeadline = deadline;
  }
  await issue.save();
  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}

export async function updateIssueStatus(req: Request, res: Response) {
  if (!req.userId || req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const mayor = await User.findById(req.userId);
  const issue = await Issue.findById(req.params.id);
  if (!issue || !mayor || issue.city !== mayor.city) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const { status, departmentId } = req.body as { status?: string; departmentId?: string };
  const allowed = ['under_review', 'acknowledged', 'in_progress', 'community_resolved', 'resolved', 'recurred', 'open', 'red_alert'];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: 'invalid status' });
    return;
  }
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    issue.department = new mongoose.Types.ObjectId(departmentId);
  }
  if (status === 'acknowledged' && !issue.acknowledgedAt) {
    const now = new Date();
    issue.acknowledgedAt = now;
    if (issue.isRedAlert) issue.redAlertAcknowledgedAt = now;
    if (!issue.department) {
      const dept = await findDepartment(issue.city, issue.category);
      if (dept) {
        issue.department = dept._id as mongoose.Types.ObjectId;
        const deadline = new Date(now);
        deadline.setDate(deadline.getDate() + (dept.avgResolutionDays ?? 7));
        issue.slaDeadline = deadline;
      }
    }
  }
  const prevStatus = issue.status;
  issue.status = status as typeof issue.status;
  if (status === 'resolved' || status === 'community_resolved') {
    issue.resolvedAt = new Date();
    if (issue.acknowledgedAt) {
      issue.resolutionTimeDays = Math.ceil(
        (issue.resolvedAt.getTime() - issue.acknowledgedAt.getTime()) / (86400 * 1000)
      );
    }
  }
  await issue.save();
  AuditLog.create({
    issueId: issue._id,
    action: 'status_change',
    performedBy: req.userId,
    performedByRole: req.userRole ?? 'mayor',
    fromValue: prevStatus,
    toValue: status,
  }).catch(() => {});
  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}

export async function pledgeIssue(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { type, item } = req.body as { type?: string; item?: string };
  if (!type || !['sweat', 'tools'].includes(type)) {
    res.status(400).json({ error: 'type must be sweat or tools' });
    return;
  }
  const itemText = item?.trim() || (type === 'sweat' ? 'Volunteer time' : 'Tools / equipment');
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }
  const uid = new mongoose.Types.ObjectId(req.userId);
  const existing = issue.pledges.find((p) => p.userId?.equals(uid) && p.type === type);
  if (existing) {
    existing.item = itemText;
  } else {
    issue.pledges.push({
      userId: uid,
      userName: user.name,
      type: type as 'sweat' | 'tools',
      item: itemText,
    });
  }
  await issue.save();
  await awardCitizen(req.userId, 5, 5, { reason: 'pledging help on an issue' });
  const lean = await Issue.findById(issue._id).lean();
  res.status(201).json(serializeIssue(lean as never, req.userId));
}

export async function uploadAfterPhoto(req: Request, res: Response) {
  if (!req.userId || req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const mayor = await User.findById(req.userId);
  const issue = await Issue.findById(req.params.id);
  const file = req.file as Express.Multer.File | undefined;
  if (!issue || !mayor || issue.city !== mayor.city || !file?.buffer) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  const up = await uploadBuffer(file.buffer);
  for (let i = issue.photos.length - 1; i >= 0; i--) {
    if (issue.photos[i].type === 'after') issue.photos.splice(i, 1);
  }
  issue.photos.push({
    url: up.url,
    type: 'after',
    uploadedBy: new mongoose.Types.ObjectId(req.userId),
    uploadedAt: new Date(),
  });
  issue.status = 'resolved';
  issue.resolvedAt = new Date();
  await issue.save();
  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}

export async function broadcastIssue(req: Request, res: Response) {
  if (!req.userId || req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const mayor = await User.findById(req.userId);
  const issue = await Issue.findById(req.params.id);
  if (!issue || !mayor || issue.city !== mayor.city) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const { message } = req.body as { message?: string };
  if (!message) {
    res.status(400).json({ error: 'message required' });
    return;
  }
  issue.broadcasts.push({
    message,
    sentAt: new Date(),
    sentBy: new mongoose.Types.ObjectId(req.userId),
  });
  await issue.save();

  const users = await User.find({ _id: { $in: issue.upvotes } }).select('email name').lean();
  const emails = users.map((u) => u.email).filter(Boolean) as string[];
  const html = `<p><strong>${issue.title}</strong></p><p>${message}</p>`;
  await sendBulkSameSubject(emails, `CivicSync update: ${issue.title}`, html);

  for (const uid of issue.upvotes) {
    await Notification.create({
      userId: uid,
      type: 'broadcast',
      title: 'Issue update',
      message,
      metadata: { issueId: issue._id.toString() },
    });
  }

  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}

export async function communityResolve(req: Request, res: Response) {
  if (!req.userId || req.userRole !== 'citizen') {
    res.status(403).json({ error: 'Citizen only' });
    return;
  }
  const issue = await Issue.findById(req.params.id);
  const file = req.file as Express.Multer.File | undefined;
  if (!issue || issue.reportedBy.toString() !== req.userId) {
    res.status(403).json({ error: 'Only original poster' });
    return;
  }
  if (!file?.buffer) {
    res.status(400).json({ error: 'photo required' });
    return;
  }
  const up = await uploadBuffer(file.buffer);
  issue.communityResolution = {
    photo: up.url,
    submittedBy: new mongoose.Types.ObjectId(req.userId),
    submittedAt: new Date(),
    status: 'pending',
  };
  issue.status = 'community_resolved';
  await issue.save();
  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}

export async function verifyResolve(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user || !['neighborhood_advocate', 'city_guardian'].includes(user.rank)) {
    res.status(403).json({ error: 'Advocate or Guardian only' });
    return;
  }
  const issue = await Issue.findById(req.params.id);
  if (!issue?.communityResolution) {
    res.status(400).json({ error: 'No pending resolution' });
    return;
  }
  const { approve } = req.body as { approve?: boolean };
  if (approve) {
    issue.communityResolution.status = 'approved';
    issue.communityResolution.verifiedBy = new mongoose.Types.ObjectId(req.userId);
    issue.communityResolution.verifiedAt = new Date();
    issue.status = 'resolved';
    issue.resolvedAt = new Date();
    await awardCitizen(req.userId, 20, 30, { reason: 'verifying a community fix' });
    const reporterId = issue.reportedBy?.toString();
    if (reporterId) {
      await User.updateOne({ _id: reporterId }, { $inc: { solutionsImplemented: 1 } });
      await awardCitizen(reporterId, 25, 40, { reason: 'community fix approved' });
    }
  } else {
    issue.communityResolution.status = 'rejected';
    issue.status = 'open';
  }
  await issue.save();
  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}

export async function flagFake(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user || !['neighborhood_advocate', 'city_guardian'].includes(user.rank)) {
    res.status(403).json({ error: 'Advocate or Guardian only' });
    return;
  }
  const issue = await Issue.findByIdAndUpdate(req.params.id, { isFakeFlagged: true, status: 'under_review' }, { new: true }).lean();
  if (!issue) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(serializeIssue(issue as never, req.userId));
}

export async function addComment(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { text } = req.body as { text?: string };
  const trimmed = text?.trim();
  if (!trimmed) {
    res.status(400).json({ error: 'text required' });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }
  issue.comments.push({
    userId: new mongoose.Types.ObjectId(req.userId),
    userName: user.name,
    text: trimmed,
    timestamp: new Date(),
  });
  await issue.save();
  const lean = await Issue.findById(issue._id).lean();
  res.status(201).json(serializeIssue(lean as never, req.userId));
}

export async function ghostResponse(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.userId);
  if (!user || user.rank !== 'city_guardian') {
    res.status(403).json({ error: 'City Guardian only' });
    return;
  }
  const { response } = req.body as { response?: 'still_good' | 'recurred' };
  if (!response || !['still_good', 'recurred'].includes(response)) {
    res.status(400).json({ error: 'response: still_good | recurred' });
    return;
  }
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  issue.ghostAudit = {
    ...issue.ghostAudit,
    response,
    respondedAt: new Date(),
    assignedTo: new mongoose.Types.ObjectId(req.userId),
  };
  if (response === 'recurred') issue.status = 'recurred';
  await issue.save();

  const auditStatus = response === 'still_good' ? 'passed' : 'recurred';
  await GhostAudit.updateMany(
    { issueId: issue._id, status: 'pending' },
    { status: auditStatus, respondedAt: new Date(), assignedTo: new mongoose.Types.ObjectId(req.userId) }
  );
  await awardCitizen(req.userId, 15, 25, { reason: 'ghost inspector audit' });

  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}
