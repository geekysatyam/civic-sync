import type { Request, Response } from 'express';
import { Issue } from '../models/Issue.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Notification } from '../models/Notification.js';
import { getPredictiveAlerts } from '../services/aiService.js';
import { serializeIssue } from '../utils/serializeIssue.js';
import { cities } from '../seed/constants.js';

const PUNJAB_CITIES = [...cities];

export async function heatmap(req: Request, res: Response) {
  if (req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'State admin only' });
    return;
  }
  const out: { city: string; issueCount: number; redAlerts: number }[] = [];
  for (const city of PUNJAB_CITIES) {
    const issueCount = await Issue.countDocuments({ city });
    const redAlerts = await Issue.countDocuments({ city, isRedAlert: true, status: { $in: ['red_alert', 'open', 'in_progress'] } });
    out.push({ city, issueCount, redAlerts });
  }
  res.json(out);
}

export async function cityLeaderboard(req: Request, res: Response) {
  if (req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'State admin only' });
    return;
  }
  const rows = await Promise.all(
    PUNJAB_CITIES.map(async (city) => {
      const resolved = await Issue.countDocuments({ city, status: { $in: ['resolved', 'community_resolved'] } });
      const total = await Issue.countDocuments({ city });
      const open = await Issue.countDocuments({ city, status: { $in: ['open', 'in_progress', 'acknowledged', 'red_alert'] } });
      const redAlerts = await Issue.countDocuments({ city, isRedAlert: true, status: { $in: ['red_alert', 'open', 'in_progress'] } });
      const satisfaction = total ? Math.round((resolved / total) * 100) : 0;
      const whyRanked =
        total === 0
          ? 'No issues logged yet in seed data'
          : `${resolved} of ${total} issues closed (${satisfaction}% resolution)${open ? ` · ${open} still open` : ''}${redAlerts ? ` · ${redAlerts} red alert${redAlerts > 1 ? 's' : ''}` : ''}`;
      return {
        city,
        resolvedIssues: resolved,
        totalIssues: total,
        openIssues: open,
        redAlerts,
        satisfactionScore: satisfaction,
        whyRanked,
      };
    })
  );
  rows.sort((a, b) => b.satisfactionScore - a.satisfactionScore || b.resolvedIssues - a.resolvedIssues);
  res.json(rows.map((r, i) => ({ ...r, rank: i + 1 })));
}

export async function trends(req: Request, res: Response) {
  if (req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'State admin only' });
    return;
  }
  const month = new Date().getMonth() + 1;
  const cards = PUNJAB_CITIES.flatMap((c) => getPredictiveAlerts(c, month)).slice(0, 12);
  res.json({ cards, summary: 'Macro insights derived from seasonal patterns and historical category load.' });
}

export async function emergencyFeed(req: Request, res: Response) {
  if (req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'State admin only' });
    return;
  }
  const issues = await Issue.find({
    isRedAlert: true,
    status: { $in: ['red_alert', 'open', 'in_progress', 'acknowledged'] },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json(issues.map((i) => serializeIssue(i as never, req.userId)));
}

export async function userLeaderboard(req: Request, res: Response) {
  if (req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'State admin only' });
    return;
  }
  const users = await User.find({ role: 'citizen' })
    .sort({ karmaPoints: -1 })
    .limit(50)
    .lean();
  res.json(
    users.map((u, i) => ({
      rank: i + 1,
      userId: u._id.toString(),
      name: u.name,
      city: u.city,
      userRank: u.rank,
      karmaPoints: u.karmaPoints ?? 0,
    }))
  );
}

export async function contractorStatus(req: Request, res: Response) {
  if (req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'State admin only' });
    return;
  }
  const rows = await Promise.all(
    PUNJAB_CITIES.map(async (city) => {
      const contractors = await User.find({ role: 'contractor', city }).select('name contractorCategory').lean();
      const contractorIds = contractors.map((c) => c._id);
      const assigned = await Issue.countDocuments({ city, assignedContractor: { $in: contractorIds } });
      const onSite = await Issue.countDocuments({ city, contractorWorkStatus: 'on_site' });
      const completed = await Issue.countDocuments({ city, contractorWorkStatus: 'completed' });
      const open = await Issue.countDocuments({
        city,
        assignedContractor: { $in: contractorIds },
        contractorWorkStatus: { $in: ['assigned', 'on_site'] },
      });
      return {
        city,
        contractorCount: contractors.length,
        contractors: contractors.map((c) => ({
          id: c._id.toString(),
          name: c.name,
          category: c.contractorCategory,
        })),
        issuesAssigned: assigned,
        issuesOnSite: onSite,
        issuesCompleted: completed,
        issuesActive: open,
      };
    })
  );
  res.json(rows);
}

/** GET /api/state/departments — department performance across all cities */
export async function departmentStatus(req: Request, res: Response) {
  if (req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'State admin only' });
    return;
  }
  const depts = await Department.find({}).lean();
  const issuesByCityCategory = await Issue.aggregate([
    { $group: { _id: { city: '$city', category: '$category' }, total: { $sum: 1 }, open: { $sum: { $cond: [{ $in: ['$status', ['open', 'acknowledged']] }, 1, 0] } }, resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'community_resolved']] }, 1, 0] } }, slaBreached: { $sum: { $cond: ['$slaBreached', 1, 0] } } } },
  ]);
  const issueMap: Record<string, { total: number; open: number; resolved: number; slaBreached: number }> = {};
  for (const row of issuesByCityCategory) {
    const key = `${row._id.city}|${row._id.category}`;
    issueMap[key] = { total: row.total, open: row.open, resolved: row.resolved, slaBreached: row.slaBreached };
  }
  const byCity: Record<string, { city: string; departments: { name: string; category: string; slaCompliance: number; avgResolutionDays: number; open: number; resolved: number; slaBreached: number }[] }> = {};
  for (const city of cities) byCity[city] = { city, departments: [] };
  for (const d of depts) {
    const stats = issueMap[`${d.city}|${d.category}`] ?? { total: 0, open: 0, resolved: 0, slaBreached: 0 };
    if (byCity[d.city]) {
      byCity[d.city].departments.push({ name: d.name, category: d.category, slaCompliance: d.slaCompliance, avgResolutionDays: d.avgResolutionDays, open: stats.open, resolved: stats.resolved, slaBreached: stats.slaBreached });
    }
  }
  res.json(Object.values(byCity).filter((c) => c.departments.length > 0));
}

export async function pingMayor(req: Request, res: Response) {
  if (req.userRole !== 'state_admin') {
    res.status(403).json({ error: 'State admin only' });
    return;
  }
  const city = req.params.city;
  const mayors = await User.find({ role: 'mayor', city }).select('_id').lean();
  for (const m of mayors) {
    await Notification.create({
      userId: m._id,
      type: 'escalation',
      title: 'State escalation',
      message: `State admin pinged your office regarding ${city}.`,
      metadata: { city },
    });
  }
  res.json({ ok: true, notified: mayors.length });
}
