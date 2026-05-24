import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Issue } from '../models/Issue.js';
import { Article } from '../models/Article.js';
import { VolunteerDrive } from '../models/VolunteerDrive.js';

function requireAdmin(req: Request, res: Response): boolean {
  if (req.userRole !== 'admin') {
    res.status(403).json({ error: 'Platform admin only' });
    return false;
  }
  return true;
}

/** GET /api/admin/stats — system-wide counts */
export async function systemStats(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;
  const [
    totalUsers,
    citizens,
    mayors,
    contractors,
    deptHeads,
    totalIssues,
    openIssues,
    resolvedIssues,
    totalArticles,
    pendingArticles,
    totalDrives,
    bannedUsers,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'citizen' }),
    User.countDocuments({ role: 'mayor' }),
    User.countDocuments({ role: 'contractor' }),
    User.countDocuments({ role: 'department_head' }),
    Issue.countDocuments({}),
    Issue.countDocuments({ status: { $in: ['open', 'acknowledged', 'in_progress'] } }),
    Issue.countDocuments({ status: { $in: ['resolved', 'community_resolved'] } }),
    Article.countDocuments({}),
    Article.countDocuments({ status: 'pending' }),
    VolunteerDrive.countDocuments({}),
    User.countDocuments({ banned: true }),
  ]);

  res.json({
    users: { total: totalUsers, citizens, mayors, contractors, deptHeads, banned: bannedUsers },
    issues: { total: totalIssues, open: openIssues, resolved: resolvedIssues },
    articles: { total: totalArticles, pending: pendingArticles },
    drives: { total: totalDrives },
  });
}

/** GET /api/admin/users — paginated user list with optional search */
export async function listUsers(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;
  const { search, role, page = '1', limit = '20' } = req.query as Record<string, string>;
  const q: Record<string, unknown> = {};
  if (search?.trim()) {
    const r = new RegExp(search.trim(), 'i');
    q.$or = [{ name: r }, { email: r }];
  }
  if (role && role !== 'all') q.role = role;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(q)
      .select('name email role city rank xp karmaPoints banned createdAt phoneVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(q),
  ]);
  res.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      city: u.city ?? '',
      rank: u.rank ?? '',
      xp: u.xp ?? 0,
      karmaPoints: u.karmaPoints ?? 0,
      banned: Boolean((u as { banned?: boolean }).banned),
      phoneVerified: Boolean(u.phoneVerified),
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : '',
    })),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
}

/** PATCH /api/admin/users/:id/ban — toggle ban on a user */
export async function toggleBan(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  if (id === req.userId) {
    res.status(400).json({ error: 'Cannot ban yourself' });
    return;
  }
  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const newBanState = !(user as { banned?: boolean }).banned;
  await User.updateOne({ _id: id }, { banned: newBanState });
  res.json({ ok: true, banned: newBanState });
}

/** DELETE /api/admin/users/:id — hard delete a user (irreversible) */
export async function deleteUser(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  if (id === req.userId) {
    res.status(400).json({ error: 'Cannot delete yourself' });
    return;
  }
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ ok: true });
}
