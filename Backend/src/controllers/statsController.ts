import type { Request, Response } from 'express';
import { Issue } from '../models/Issue.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';

const slugToCity: Record<string, string> = {
  ludhiana: 'Ludhiana',
  amritsar: 'Amritsar',
  jalandhar: 'Jalandhar',
  patiala: 'Patiala',
  sahibzadaajitsinghnagar: 'Sahibzada Ajit Singh Nagar',
  bathinda: 'Bathinda',
  pathankot: 'Pathankot',
  hoshiarpur: 'Hoshiarpur',
  chandigarh: 'Chandigarh',
};

/** Public homepage metrics (approximate / live from DB). */
export async function publicSummary(_req: Request, res: Response) {
  const [resolved, cityList, citizens, openIssues] = await Promise.all([
    Issue.countDocuments({ status: { $in: ['resolved', 'community_resolved'] } }),
    Issue.distinct('city'),
    User.countDocuments({ role: 'citizen' }),
    Issue.countDocuments({
      status: { $nin: ['resolved', 'community_resolved', 'recurred'] },
    }),
  ]);
  const cities = cityList.filter(Boolean) as string[];
  const breached = await Issue.countDocuments({ slaBreached: true, status: { $ne: 'resolved' } });
  const slaApprox = openIssues > 0 ? Math.max(60, Math.min(99, Math.round(100 - (breached / openIssues) * 100))) : 92;

  res.json({
    issuesResolved: resolved,
    citiesActive: cities.length || 5,
    citizensParticipating: citizens || 0,
    slaComplianceApprox: slaApprox,
  });
}

/** Public: GET /api/stats/city/:slug — no auth required */
export async function publicCityStats(req: Request, res: Response) {
  const city = slugToCity[String(req.params.slug ?? '').toLowerCase()];
  if (!city) {
    res.status(404).json({ error: 'City not found' });
    return;
  }

  const [total, open, resolved, redAlerts, slaBreached, categoryBreakdown, departments] = await Promise.all([
    Issue.countDocuments({ city }),
    Issue.countDocuments({ city, status: { $nin: ['resolved', 'community_resolved'] } }),
    Issue.countDocuments({ city, status: { $in: ['resolved', 'community_resolved'] } }),
    Issue.countDocuments({ city, isRedAlert: true }),
    Issue.countDocuments({ city, slaBreached: true }),
    Issue.aggregate([
      { $match: { city } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Department.find({ city }).select('name category avgResolutionDays slaCompliance').lean(),
  ]);

  const ms30 = 30 * 24 * 60 * 60 * 1000;
  const resolvedLast30 = await Issue.countDocuments({
    city,
    status: { $in: ['resolved', 'community_resolved'] },
    resolvedAt: { $gte: new Date(Date.now() - ms30) },
  });

  res.json({
    city,
    total,
    open,
    resolved,
    resolvedLast30,
    redAlerts,
    slaBreached,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    categories: categoryBreakdown.map((r) => ({ category: r._id as string, count: r.count as number })),
    departments: departments.map((d) => ({
      name: d.name,
      category: d.category,
      avgResolutionDays: d.avgResolutionDays,
      slaCompliance: d.slaCompliance,
    })),
  });
}
