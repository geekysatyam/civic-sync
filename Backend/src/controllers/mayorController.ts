import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Issue } from '../models/Issue.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { CSRProject } from '../models/CSRProject.js';
import { GhostAudit } from '../models/GhostAudit.js';
import { Poll } from '../models/Poll.js';
import { getPredictiveAlerts, llmTranslate } from '../services/aiService.js';
import { AuditLog } from '../models/AuditLog.js';
import bcrypt from 'bcryptjs';
import { serializeIssue } from '../utils/serializeIssue.js';
import { serializeCitizenLeaderboard } from '../utils/leaderboard.js';

async function mayorCity(req: Request) {
  if (!req.userId) return null;
  const u = await User.findById(req.userId).lean();
  return u?.city ?? null;
}

export async function tasks(req: Request, res: Response) {
  if (req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const city = await mayorCity(req);
  if (!city) {
    res.status(400).json({ error: 'No city on profile' });
    return;
  }
  const { status, category } = req.query;
  const q: Record<string, unknown> = { city };
  if (status) q.status = status;
  if (category) q.category = category;
  const issues = await Issue.find(q).sort({ createdAt: -1 }).limit(200).lean();
  res.json(issues.map((i) => serializeIssue(i as never, req.userId)));
}

export async function heatmap(req: Request, res: Response) {
  if (req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const city = await mayorCity(req);
  if (!city) {
    res.status(400).json({ error: 'No city' });
    return;
  }
  const issues = await Issue.find({ city }).select('neighborhood category status').lean();
  const byHood: Record<string, number> = {};
  for (const i of issues) {
    const h = i.neighborhood || 'Unknown';
    byHood[h] = (byHood[h] ?? 0) + 1;
  }
  res.json(Object.entries(byHood).map(([neighborhood, count]) => ({ neighborhood, count })));
}

export async function scorecard(req: Request, res: Response) {
  if (req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const city = await mayorCity(req);
  if (!city) {
    res.status(400).json({ error: 'No city' });
    return;
  }
  const depts = await Department.find({ city }).lean();
  const deptIds = depts.map((d) => d._id);
  const issues = await Issue.find({ city, department: { $in: deptIds } })
    .select('department status resolutionTimeDays slaBreached resolvedAt createdAt')
    .lean();

  const now = Date.now();
  const ms30 = 30 * 24 * 60 * 60 * 1000;
  const since30 = new Date(now - ms30);
  const since60 = new Date(now - ms30 * 2);

  const byDept: Record<string, typeof issues> = {};
  for (const iss of issues) {
    const id = iss.department ? String(iss.department) : '';
    if (!id) continue;
    if (!byDept[id]) byDept[id] = [];
    byDept[id].push(iss);
  }

  const resolvedStatuses = new Set(['resolved', 'community_resolved']);

  const cityIssues = await Issue.find({ city })
    .select('status resolvedAt slaBreached isRedAlert createdAt')
    .lean();

  const isResolved = (status: string) => resolvedStatuses.has(status);
  const resolvedAt = (i: { resolvedAt?: Date | null; createdAt?: Date | null }) => {
    const d = i.resolvedAt ?? i.createdAt;
    return d ? new Date(d) : new Date(0);
  };

  const openIssues = cityIssues.filter((i) => !isResolved(i.status)).length;
  const slaBreaches = cityIssues.filter((i) => !isResolved(i.status) && i.slaBreached).length;
  const redAlerts = cityIssues.filter((i) => i.isRedAlert && !isResolved(i.status)).length;

  const resolvedRecent = cityIssues.filter(
    (i) => isResolved(i.status) && resolvedAt(i) >= since30
  );
  const resolvedPrior = cityIssues.filter(
    (i) => isResolved(i.status) && resolvedAt(i) >= since60 && resolvedAt(i) < since30
  );

  const slaPct = (list: typeof cityIssues) => {
    const resolved = list.filter((i) => isResolved(i.status));
    if (!resolved.length) return null;
    const ok = resolved.filter((i) => !i.slaBreached).length;
    return Math.round((100 * ok) / resolved.length);
  };

  const avgSla = slaPct(cityIssues) ?? 0;
  const avgSlaRecent = slaPct(resolvedRecent);
  const avgSlaPrior = slaPct(resolvedPrior);
  const slaTrend =
    avgSlaRecent != null && avgSlaPrior != null ? avgSlaRecent - avgSlaPrior : 0;

  const pctTrend = (current: number, prior: number) => {
    if (prior === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prior) / prior) * 100);
  };

  const departments = depts.map((d) => {
      const list = byDept[d._id.toString()] ?? [];
      const resolved = list.filter((i) => resolvedStatuses.has(i.status));
      const openCount = list.filter((i) => !resolvedStatuses.has(i.status)).length;

      let avgResolutionDays = d.avgResolutionDays;
      if (resolved.length) {
        const sum = resolved.reduce(
          (s, i) => s + (typeof i.resolutionTimeDays === 'number' ? i.resolutionTimeDays : 5),
          0
        );
        avgResolutionDays = Math.round((sum / resolved.length) * 10) / 10;
      }

      let slaCompliancePercent = d.slaCompliance;
      if (resolved.length) {
        const ok = resolved.filter((i) => !i.slaBreached).length;
        slaCompliancePercent = Math.round((100 * ok) / resolved.length);
      }

      return {
        id: d._id.toString(),
        name: d.name,
        category: d.category,
        avgResolutionDays,
        slaCompliancePercent,
        openIssues: openCount,
        resolvedIssuesCount: resolved.length,
        derivedFromIssues: list.length > 0,
      };
    });

  res.json({
    summary: {
      openIssues,
      openIssuesTrend: 0,
      resolvedLast30: resolvedRecent.length,
      resolvedPrior30: resolvedPrior.length,
      resolvedTrend: pctTrend(resolvedRecent.length, resolvedPrior.length),
      avgSlaCompliance: avgSla,
      slaTrend,
      slaBreaches,
      redAlerts,
    },
    departments,
  });
}

export async function predictive(req: Request, res: Response) {
  if (req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const city = (await mayorCity(req)) ?? 'Ludhiana';
  const month = new Date().getMonth() + 1;
  res.json(getPredictiveAlerts(city, month));
}

export async function slaAlerts(req: Request, res: Response) {
  if (req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const city = await mayorCity(req);
  if (!city) {
    res.status(400).json({ error: 'No city' });
    return;
  }
  const issues = await Issue.find({ city, slaBreached: true }).sort({ createdAt: -1 }).lean();
  res.json(issues.map((i) => serializeIssue(i as never, req.userId)));
}

export async function reversePitch(req: Request, res: Response) {
  if (req.userRole !== 'mayor' || !req.userId) {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const city = await mayorCity(req);
  const { question, options, expiresAt, neighborhood } = req.body as {
    question?: string;
    options?: string[];
    expiresAt?: string;
    neighborhood?: string;
  };
  if (!question || !options?.length || !expiresAt || !city) {
    res.status(400).json({ error: 'question, options, expiresAt required' });
    return;
  }
  const trimmed = options.map((o) => String(o).trim()).filter(Boolean);
  if (trimmed.length < 2) {
    res.status(400).json({ error: 'At least two non-empty options required' });
    return;
  }
  const poll = await Poll.create({
    question: question.trim(),
    options: trimmed.map((text) => ({ text, votes: [] })),
    createdBy: new mongoose.Types.ObjectId(req.userId),
    city,
    neighborhood: neighborhood?.trim() ?? '',
    expiresAt: new Date(expiresAt),
    isActive: true,
  });
  res.status(201).json({ id: poll._id.toString() });
}

export async function csrList(req: Request, res: Response) {
  if (req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const city = await mayorCity(req);
  const q: Record<string, unknown> = { governmentDeclinedAt: { $exists: true } };
  if (city) q.city = city;
  const projects = await CSRProject.find(q).lean();
  const iids = projects.map((p) => p.issueId).filter(Boolean) as mongoose.Types.ObjectId[];
  const issues = await Issue.find({ _id: { $in: iids } }).select('title').lean();
  const imap = Object.fromEntries(issues.map((i) => [i._id.toString(), i.title]));
  res.json(
    projects.map((p) => ({
      id: p._id.toString(),
      issueId: p.issueId?.toString() ?? '',
      issueTitle: imap[p.issueId?.toString() ?? ''] ?? p.title,
      businessName: p.sponsoredBy,
      status: p.status === 'funded' ? 'funded' : p.status,
      fundingAmount: p.fundingAmount,
      city: p.city,
    }))
  );
}

export async function csrForward(req: Request, res: Response) {
  if (req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const { sponsoredBy } = req.body as { sponsoredBy?: string };
  const update: Record<string, unknown> = { status: 'forwarded', forwardedAt: new Date() };
  if (sponsoredBy?.trim()) update.sponsoredBy = sponsoredBy.trim();
  const p = await CSRProject.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!p) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ ok: true, sponsoredBy: p.sponsoredBy ?? '' });
}

export async function ghostLog(req: Request, res: Response) {
  if (req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const city = await mayorCity(req);
  const audits = await GhostAudit.find()
    .sort({ scheduledAt: -1 })
    .limit(100)
    .lean();
  const issueIds = [...new Set(audits.map((a) => String(a.issueId)))].filter((id) =>
    mongoose.isValidObjectId(id)
  );
  const issues = await Issue.find({
    _id: { $in: issueIds.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select('title city resolvedAt')
    .lean();
  const map = Object.fromEntries(issues.map((i) => [i._id.toString(), i]));
  res.json(
    audits
      .filter((a) => {
        const iss = map[String(a.issueId)];
        return !city || !iss || iss.city === city;
      })
      .map((a) => {
        const iss = map[String(a.issueId)];
        return {
          id: a._id.toString(),
          issueId: String(a.issueId),
          issueTitle: iss?.title ?? '',
          resolvedAt: iss?.resolvedAt ? new Date(iss.resolvedAt).toISOString().slice(0, 10) : '',
          auditDueAt: a.scheduledAt?.toISOString().slice(0, 10) ?? '',
          assignedTo: a.assignedTo ? String(a.assignedTo) : '',
          status: a.status,
          city: iss?.city ?? city ?? '',
        };
      })
  );
}

export async function rateContractor(req: Request, res: Response) {
  const city = await mayorCity(req);
  if (!city) { res.status(403).json({ error: 'Mayor only' }); return; }
  const { id } = req.params;
  const { rating, comment } = req.body as { rating: number; comment?: string };
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'rating must be 1–5' });
    return;
  }
  const issue = await Issue.findOne({ _id: id, city }).lean();
  if (!issue) { res.status(404).json({ error: 'Issue not found' }); return; }
  if (!issue.assignedContractor) {
    res.status(400).json({ error: 'No contractor assigned to this issue' });
    return;
  }
  if (!['resolved', 'community_resolved'].includes(issue.status)) {
    res.status(400).json({ error: 'Can only rate after issue is resolved' });
    return;
  }
  await Issue.updateOne({ _id: id }, {
    contractorRating: rating,
    contractorRatingComment: comment?.trim() ?? '',
  });
  const contractor = await User.findById(issue.assignedContractor);
  if (contractor) {
    const prev = contractor.contractorAverageRating ?? 0;
    const count = contractor.contractorTotalRatings ?? 0;
    contractor.contractorTotalRatings = count + 1;
    contractor.contractorAverageRating = Math.round(((prev * count + rating) / (count + 1)) * 10) / 10;
    await contractor.save();
  }
  res.json({ ok: true });
}

export async function cityLeaderboard(req: Request, res: Response) {
  if (req.userRole !== 'mayor') {
    res.status(403).json({ error: 'Mayor only' });
    return;
  }
  const city = await mayorCity(req);
  if (!city) {
    res.status(400).json({ error: 'No city on profile' });
    return;
  }
  const users = await User.find({ role: 'citizen', city })
    .sort({ karmaPoints: -1 })
    .limit(50)
    .lean();
  res.json(serializeCitizenLeaderboard(users));
}

/** GET /api/mayor/anomalies — categories with 2× spike this week vs last week */
export async function anomalies(req: Request, res: Response) {
  const city = await mayorCity(req);
  if (!city) { res.status(400).json({ error: 'No city' }); return; }

  const now = Date.now();
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  const thisWeekStart = new Date(now - msWeek);
  const lastWeekStart = new Date(now - msWeek * 2);

  const [thisWeek, lastWeek] = await Promise.all([
    Issue.aggregate([
      { $match: { city, createdAt: { $gte: thisWeekStart } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    Issue.aggregate([
      { $match: { city, createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  const lastMap = new Map(lastWeek.map((r) => [r._id as string, r.count as number]));
  const alerts = thisWeek
    .filter((r) => {
      const last = lastMap.get(r._id as string) ?? 0;
      return r.count >= 3 && (last === 0 || r.count >= last * 2);
    })
    .map((r) => ({
      category: r._id as string,
      thisWeek: r.count as number,
      lastWeek: lastMap.get(r._id as string) ?? 0,
    }))
    .sort((a, b) => b.thisWeek - a.thisWeek);

  res.json(alerts);
}

/** GET /api/mayor/trend — 6-month monthly resolved issue counts for this city */
export async function trend(req: Request, res: Response) {
  const city = await mayorCity(req);
  if (!city) { res.status(400).json({ error: 'No city' }); return; }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const rows = await Issue.aggregate([
    {
      $match: {
        city,
        status: { $in: ['resolved', 'community_resolved'] },
        resolvedAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$resolvedAt' }, month: { $month: '$resolvedAt' } },
        resolved: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const map = new Map(rows.map((r) => [`${r._id.year}-${r._id.month}`, r.resolved as number]));
  res.json(
    months.map(({ year, month }) => ({
      label: new Date(year, month - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' }),
      resolved: map.get(`${year}-${month}`) ?? 0,
    }))
  );
}

/** GET /api/mayor/issues/:id/audit — audit trail for a specific issue */
export async function issueAudit(req: Request, res: Response) {
  const city = await mayorCity(req);
  if (!city) { res.status(403).json({ error: 'Mayor only' }); return; }
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  const issue = await Issue.findOne({ _id: req.params.id, city }).select('_id').lean();
  if (!issue) { res.status(404).json({ error: 'Issue not found' }); return; }

  const logs = await AuditLog.find({ issueId: req.params.id })
    .sort({ createdAt: 1 })
    .populate('performedBy', 'name')
    .lean();

  res.json(
    logs.map((l) => ({
      id: l._id.toString(),
      action: l.action,
      performedBy: (l.performedBy as { name?: string } | null)?.name ?? 'System',
      performedByRole: l.performedByRole,
      fromValue: l.fromValue,
      toValue: l.toValue,
      note: l.note,
      createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt),
    }))
  );
}

/** POST /api/mayor/issues/:id/translate — translate issue title + description to English */
export async function translateIssue(req: Request, res: Response) {
  const city = await mayorCity(req);
  if (!city) { res.status(403).json({ error: 'Mayor only' }); return; }
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  const issue = await Issue.findOne({ _id: req.params.id, city }).select('title description').lean();
  if (!issue) { res.status(404).json({ error: 'Issue not found' }); return; }

  const [translatedTitle, translatedDescription] = await Promise.all([
    llmTranslate(issue.title),
    llmTranslate(issue.description ?? ''),
  ]);

  res.json({ translatedTitle, translatedDescription });
}

/** GET /api/mayor/dept-heads — list dept heads in mayor's city */
export async function deptHeadList(req: Request, res: Response) {
  const city = await mayorCity(req);
  if (!city) { res.status(403).json({ error: 'Mayor only' }); return; }

  const heads = await User.find({ role: 'department_head', city }).lean();
  const deptIds = heads.map((h) => h.departmentId).filter(Boolean);
  const depts = await Department.find({ _id: { $in: deptIds } }).lean();
  const deptMap = Object.fromEntries(depts.map((d) => [d._id.toString(), d]));

  res.json(
    heads.map((h) => {
      const dept = h.departmentId ? deptMap[h.departmentId.toString()] : null;
      return {
        id: h._id.toString(),
        name: h.name,
        email: h.email,
        departmentId: dept?._id.toString() ?? '',
        departmentName: dept?.name ?? '',
        departmentCategory: dept?.category ?? '',
      };
    })
  );
}

/** POST /api/mayor/dept-heads — create a dept head account */
export async function deptHeadCreate(req: Request, res: Response) {
  const city = await mayorCity(req);
  if (!city) { res.status(403).json({ error: 'Mayor only' }); return; }

  const { name, email, password, departmentCategory } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    departmentCategory?: string;
  };

  if (!name || !email || !password || !departmentCategory) {
    res.status(400).json({ error: 'name, email, password, departmentCategory required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const dept = await Department.findOne({ city, category: departmentCategory }).lean();
  if (!dept) {
    res.status(400).json({ error: `No department for category ${departmentCategory} in ${city}` });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'department_head',
    city,
    rank: 'civic_scout',
    departmentId: dept._id,
  });

  await Department.updateOne({ _id: dept._id }, { $set: { headUserId: user._id } });

  res.status(201).json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    departmentId: dept._id.toString(),
    departmentName: dept.name,
    departmentCategory: dept.category,
  });
}
