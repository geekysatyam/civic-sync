import type { Request, Response } from 'express';
import { Issue } from '../models/Issue.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { AuditLog } from '../models/AuditLog.js';
import { serializeIssue } from '../utils/serializeIssue.js';

async function getDeptContext(req: Request) {
  if (!req.userId) return null;
  const user = await User.findById(req.userId).lean();
  if (!user?.departmentId) return null;
  const dept = await Department.findById(user.departmentId).lean();
  if (!dept) return null;
  return { user, dept };
}

/** GET /api/dept-head/dashboard — issues scoped to this dept's city + category */
export async function dashboard(req: Request, res: Response) {
  const ctx = await getDeptContext(req);
  if (!ctx) {
    res.status(400).json({ error: 'No department linked to your account' });
    return;
  }
  const { dept } = ctx;
  const { status } = req.query;
  const q: Record<string, unknown> = { city: dept.city, category: dept.category };
  if (status) q.status = status;
  const issues = await Issue.find(q).sort({ priorityScore: -1, createdAt: -1 }).limit(200).lean();
  res.json({
    department: {
      id: dept._id,
      name: dept.name,
      city: dept.city,
      category: dept.category,
      avgResolutionDays: dept.avgResolutionDays,
      slaCompliance: dept.slaCompliance,
      openIssues: dept.openIssues,
      resolvedIssues: dept.resolvedIssues,
    },
    issues: issues.map((i) => serializeIssue(i as never, req.userId)),
  });
}

/** PATCH /api/dept-head/issues/:id/status */
export async function updateStatus(req: Request, res: Response) {
  const ctx = await getDeptContext(req);
  if (!ctx) {
    res.status(400).json({ error: 'No department linked to your account' });
    return;
  }
  const { dept } = ctx;
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }
  if (issue.city !== dept.city || issue.category !== dept.category) {
    res.status(403).json({ error: 'Issue does not belong to your department' });
    return;
  }
  const { status, note } = req.body as { status: string; note?: string };
  const prevStatus = issue.status;
  issue.status = status as never;
  if (status === 'resolved' && !issue.resolvedAt) issue.resolvedAt = new Date();
  await issue.save();

  AuditLog.create({
    issueId: issue._id,
    action: 'status_change',
    performedBy: req.userId,
    performedByRole: 'department_head',
    fromValue: prevStatus,
    toValue: status,
    note: note ?? '',
  }).catch(() => {});

  res.json(serializeIssue(issue.toObject() as never, req.userId));
}

/** POST /api/dept-head/issues/:id/broadcast */
export async function broadcast(req: Request, res: Response) {
  const ctx = await getDeptContext(req);
  if (!ctx) {
    res.status(400).json({ error: 'No department linked to your account' });
    return;
  }
  const { dept } = ctx;
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }
  if (issue.city !== dept.city || issue.category !== dept.category) {
    res.status(403).json({ error: 'Issue does not belong to your department' });
    return;
  }
  const { message } = req.body as { message: string };
  if (!message?.trim()) {
    res.status(400).json({ error: 'Message required' });
    return;
  }

  AuditLog.create({
    issueId: issue._id,
    action: 'broadcast',
    performedBy: req.userId,
    performedByRole: 'department_head',
    fromValue: '',
    toValue: message,
    note: '',
  }).catch(() => {});

  res.json({ ok: true, message });
}

/** GET /api/dept-head/contractors — contractors in same city as dept head */
export async function listContractors(req: Request, res: Response) {
  const ctx = await getDeptContext(req);
  if (!ctx) {
    res.status(400).json({ error: 'No department linked to your account' });
    return;
  }
  const { dept } = ctx;
  const contractors = await User.find({ role: 'contractor', city: dept.city })
    .select('name email contractorCategory contractorAverageRating contractorTotalRatings')
    .lean();
  res.json(
    contractors.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email,
      category: (c as { contractorCategory?: string }).contractorCategory ?? '',
      avgRating: (c as { contractorAverageRating?: number }).contractorAverageRating ?? 0,
      totalRatings: (c as { contractorTotalRatings?: number }).contractorTotalRatings ?? 0,
    }))
  );
}

/** PATCH /api/dept-head/issues/:id/assign-contractor — assign a contractor to an issue */
export async function assignContractor(req: Request, res: Response) {
  const ctx = await getDeptContext(req);
  if (!ctx) {
    res.status(400).json({ error: 'No department linked to your account' });
    return;
  }
  const { dept } = ctx;
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }
  if (issue.city !== dept.city || issue.category !== dept.category) {
    res.status(403).json({ error: 'Issue does not belong to your department' });
    return;
  }
  const { contractorId } = req.body as { contractorId?: string };
  if (!contractorId) {
    issue.assignedContractor = undefined as never;
    await issue.save();
    res.json({ ok: true, assignedContractor: null });
    return;
  }
  const contractor = await User.findOne({ _id: contractorId, role: 'contractor', city: dept.city }).lean();
  if (!contractor) {
    res.status(404).json({ error: 'Contractor not found in this city' });
    return;
  }
  issue.assignedContractor = contractor._id as never;
  if (issue.status === 'open') issue.status = 'in_progress';
  await issue.save();

  AuditLog.create({
    issueId: issue._id,
    action: 'contractor_assigned',
    performedBy: req.userId,
    performedByRole: 'department_head',
    fromValue: '',
    toValue: contractor.name,
    note: '',
  }).catch(() => {});

  res.json({ ok: true, assignedContractor: { id: contractor._id.toString(), name: contractor.name } });
}

/** GET /api/dept-head/stats — aggregate stats for the dept head's department */
export async function stats(req: Request, res: Response) {
  const ctx = await getDeptContext(req);
  if (!ctx) {
    res.status(400).json({ error: 'No department linked to your account' });
    return;
  }
  const { dept } = ctx;
  const filter = { city: dept.city, category: dept.category };

  const [total, open, inProgress, resolved, redAlerts, slaBreached] = await Promise.all([
    Issue.countDocuments(filter),
    Issue.countDocuments({ ...filter, status: 'open' }),
    Issue.countDocuments({ ...filter, status: 'in_progress' }),
    Issue.countDocuments({ ...filter, status: { $in: ['resolved', 'community_resolved'] } }),
    Issue.countDocuments({ ...filter, isRedAlert: true }),
    Issue.countDocuments({ ...filter, slaBreached: true }),
  ]);

  res.json({ total, open, inProgress, resolved, redAlerts, slaBreached });
}
