import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Issue } from '../models/Issue.js';
import { Notification } from '../models/Notification.js';
import { uploadBuffer } from '../services/cloudinaryService.js';
import { serializeIssue } from '../utils/serializeIssue.js';
import { serializeUser } from '../utils/serializeUser.js';

const CONTRACTOR_CATEGORIES = [
  'roads',
  'water',
  'parks',
  'electricity',
  'hazards',
  'sanitation',
  'public_safety',
] as const;

export async function listContractors(req: Request, res: Response) {
  if (req.userRole !== 'mayor' || !req.userId) {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const mayor = await User.findById(req.userId).lean();
  if (!mayor) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const contractors = await User.find({
    role: 'contractor',
    city: mayor.city,
    createdByMayor: mayor._id,
  })
    .select('-passwordHash')
    .lean();
  res.json(
    contractors.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email,
      city: c.city,
      contractorCategory: c.contractorCategory,
      contractorLabel: c.contractorLabel ?? '',
    }))
  );
}

export async function createContractor(req: Request, res: Response) {
  if (req.userRole !== 'mayor' || !req.userId) {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const mayor = await User.findById(req.userId);
  if (!mayor) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const { name, email, password, contractorCategory, contractorLabel } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    contractorCategory?: string;
    contractorLabel?: string;
  };
  if (!name || !email || !password || !contractorCategory) {
    res.status(400).json({ error: 'name, email, password, contractorCategory required' });
    return;
  }
  if (!CONTRACTOR_CATEGORIES.includes(contractorCategory as (typeof CONTRACTOR_CATEGORIES)[number])) {
    res.status(400).json({ error: 'invalid contractorCategory' });
    return;
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const contractor = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'contractor',
    city: mayor.city,
    contractorCategory,
    contractorLabel: contractorLabel ?? name,
    createdByMayor: mayor._id,
    rank: 'civic_scout',
  });
  res.status(201).json({
    id: contractor._id.toString(),
    name: contractor.name,
    email: contractor.email,
    city: contractor.city,
    contractorCategory: contractor.contractorCategory,
    contractorLabel: contractor.contractorLabel,
  });
}

export async function assignContractor(req: Request, res: Response) {
  if (req.userRole !== 'mayor' || !req.userId) {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const mayor = await User.findById(req.userId);
  const issue = await Issue.findById(req.params.issueId);
  if (!mayor || !issue || issue.city !== mayor.city) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const { contractorId } = req.body as { contractorId?: string };
  if (!contractorId || !mongoose.Types.ObjectId.isValid(contractorId)) {
    res.status(400).json({ error: 'contractorId required' });
    return;
  }
  const contractor = await User.findOne({
    _id: contractorId,
    role: 'contractor',
    city: mayor.city,
    createdByMayor: mayor._id,
  });
  if (!contractor) {
    res.status(404).json({ error: 'Contractor not found in your city' });
    return;
  }
  issue.assignedContractor = contractor._id as mongoose.Types.ObjectId;
  issue.contractorWorkStatus = 'assigned';
  if (issue.status === 'open' || issue.status === 'acknowledged') {
    issue.status = 'in_progress';
  }
  await issue.save();

  await Notification.create({
    userId: contractor._id,
    type: 'assignment',
    title: 'New repair assignment',
    message: `You were assigned: ${issue.title}`,
    metadata: { issueId: issue._id.toString() },
  });

  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}

export async function contractorStats(req: Request, res: Response) {
  if (req.userRole !== 'contractor' || !req.userId) {
    res.status(403).json({ error: 'Contractor only' });
    return;
  }
  const contractor = await User.findById(req.userId).lean();
  if (!contractor) { res.status(404).json({ error: 'Not found' }); return; }

  const [total, completed, onSite, rated] = await Promise.all([
    Issue.countDocuments({ assignedContractor: contractor._id }),
    Issue.countDocuments({ assignedContractor: contractor._id, contractorWorkStatus: 'completed' }),
    Issue.countDocuments({ assignedContractor: contractor._id, contractorWorkStatus: 'on_site' }),
    Issue.find({ assignedContractor: contractor._id, contractorRating: { $exists: true } })
      .select('contractorRating contractorRatingComment title')
      .lean(),
  ]);

  res.json({
    name: contractor.name,
    city: contractor.city,
    category: contractor.contractorCategory,
    label: contractor.contractorLabel,
    totalJobs: total,
    completedJobs: completed,
    inProgressJobs: onSite,
    pendingJobs: total - completed - onSite,
    averageRating: contractor.contractorAverageRating ?? 0,
    totalRatings: contractor.contractorTotalRatings ?? 0,
    recentRatings: rated.slice(-5).reverse().map((r) => ({
      issueTitle: r.title,
      rating: r.contractorRating,
      comment: r.contractorRatingComment ?? '',
    })),
  });
}

export async function listContractorIssues(req: Request, res: Response) {
  if (req.userRole !== 'contractor' || !req.userId) {
    res.status(403).json({ error: 'Contractor only' });
    return;
  }
  const contractor = await User.findById(req.userId).lean();
  if (!contractor) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const issues = await Issue.find({
    city: contractor.city,
    assignedContractor: contractor._id,
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();
  res.json(issues.map((i) => serializeIssue(i as never, req.userId)));
}

export async function updateContractorWork(req: Request, res: Response) {
  if (req.userRole !== 'contractor' || !req.userId) {
    res.status(403).json({ error: 'Contractor only' });
    return;
  }
  const contractor = await User.findById(req.userId);
  const issue = await Issue.findById(req.params.issueId);
  if (!contractor || !issue || issue.city !== contractor.city) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const assigned = issue.assignedContractor?.toString() === req.userId;
  if (!assigned) {
    res.status(403).json({ error: 'Issue not assigned to you' });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const workStatus = String(body.workStatus ?? issue.contractorWorkStatus ?? 'assigned');
  const note = String(body.note ?? '').trim();
  const allowedStatus = ['assigned', 'on_site', 'completed'];
  if (!allowedStatus.includes(workStatus)) {
    res.status(400).json({ error: 'invalid workStatus' });
    return;
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const beforeFile = files?.beforePhoto?.[0];
  const afterFile = files?.afterPhoto?.[0];

  if (workStatus === 'on_site' && !beforeFile) {
    const hasBefore = issue.photos?.some((p) => p.type === 'before');
    if (!hasBefore) {
      res.status(400).json({ error: 'Before photo required when starting on-site work' });
      return;
    }
  }
  if (workStatus === 'completed') {
    const hasAfter = issue.photos?.some((p) => p.type === 'after') || afterFile;
    if (!hasAfter) {
      res.status(400).json({ error: 'After photo required to mark completed' });
      return;
    }
  }

  const photoList = (issue.photos ?? []).map((p) => ({
    url: p.url,
    type: p.type,
    uploadedBy: p.uploadedBy,
    uploadedAt: p.uploadedAt,
  }));
  if (beforeFile) {
    const up = await uploadBuffer(beforeFile.buffer);
    const filtered = photoList.filter((p) => p.type !== 'before');
    filtered.push({
      url: up.url,
      type: 'before' as const,
      uploadedBy: contractor._id as mongoose.Types.ObjectId,
      uploadedAt: new Date(),
    });
    issue.set('photos', filtered);
  }
  if (afterFile) {
    const up = await uploadBuffer(afterFile.buffer);
    const current = (issue.photos ?? []).map((p) => ({
      url: p.url,
      type: p.type,
      uploadedBy: p.uploadedBy,
      uploadedAt: p.uploadedAt,
    }));
    const filtered = current.filter((p) => p.type !== 'after');
    filtered.push({
      url: up.url,
      type: 'after' as const,
      uploadedBy: contractor._id as mongoose.Types.ObjectId,
      uploadedAt: new Date(),
    });
    issue.set('photos', filtered);
  }

  if (!issue.assignedContractor) {
    issue.assignedContractor = contractor._id as mongoose.Types.ObjectId;
  }
  issue.contractorWorkStatus = workStatus as typeof issue.contractorWorkStatus;
  issue.contractorUpdates = issue.contractorUpdates ?? [];
  issue.contractorUpdates.push({
    note: note || `Status → ${workStatus}`,
    workStatus,
    createdAt: new Date(),
    createdBy: contractor._id as mongoose.Types.ObjectId,
    createdByName: contractor.contractorLabel || contractor.name,
  });

  if (workStatus === 'completed') {
    issue.status = 'resolved';
    issue.resolvedAt = new Date();
  } else if (issue.status === 'open' || issue.status === 'acknowledged') {
    issue.status = 'in_progress';
  }

  await issue.save();

  const mayor = await User.findOne({ role: 'mayor', city: issue.city }).select('_id').lean();
  if (mayor) {
    await Notification.create({
      userId: mayor._id,
      type: 'contractor_update',
      title: 'Contractor progress',
      message: `${contractor.contractorLabel || contractor.name}: ${issue.title} → ${workStatus}`,
      metadata: { issueId: issue._id.toString(), workStatus },
    });
  }

  const lean = await Issue.findById(issue._id).lean();
  res.json(serializeIssue(lean as never, req.userId));
}
