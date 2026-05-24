import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { GhostAudit } from '../models/GhostAudit.js';
import { Issue } from '../models/Issue.js';
export async function listMyGhostAudits(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const uid = new mongoose.Types.ObjectId(req.userId);
  const audits = await GhostAudit.find({ assignedTo: uid, status: 'pending' })
    .sort({ scheduledAt: 1 })
    .limit(50)
    .lean();

  const issueIds = audits.map((a) => a.issueId).filter(Boolean);
  const issues = await Issue.find({ _id: { $in: issueIds } })
    .select('title city neighborhood status resolvedAt')
    .lean();
  const issueMap = Object.fromEntries(issues.map((i) => [i._id.toString(), i]));

  res.json(
    audits.map((a) => {
      const iss = issueMap[String(a.issueId)];
      return {
        id: a._id.toString(),
        issueId: String(a.issueId),
        issueTitle: iss?.title ?? 'Unknown issue',
        city: iss?.city ?? '',
        neighborhood: iss?.neighborhood ?? '',
        issueStatus: iss?.status ?? '',
        resolvedAt: iss?.resolvedAt ? new Date(iss.resolvedAt).toISOString().slice(0, 10) : '',
        auditDueAt: a.scheduledAt?.toISOString().slice(0, 10) ?? '',
        status: a.status,
      };
    })
  );
}
