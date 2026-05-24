import type { Request, Response } from 'express';
import { Notification } from '../models/Notification.js';

const typeMap: Record<string, string> = {
  fix_confirmed: 'fix_confirmed',
  sla_breach: 'sla_breach',
  broadcast: 'broadcast',
  volunteer_reminder: 'volunteer',
  rank_up: 'rank_up',
  audit_ping: 'audit',
  community_resolution: 'verification',
  super_vote_reset: 'super_vote_reset',
  escalation: 'sla_breach',
  assignment: 'broadcast',
  contractor_update: 'broadcast',
};

export async function listNotifications(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const items = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100).lean();
  res.json(
    items.map((n) => ({
      id: n._id.toString(),
      type: typeMap[n.type] ?? n.type,
      title: n.title,
      message: n.message,
      timestamp: (n.createdAt ?? new Date()).toISOString(),
      read: n.isRead,
      metadata: n.metadata ?? {},
    }))
  );
}

export async function markRead(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await Notification.updateOne({ _id: req.params.id, userId: req.userId }, { isRead: true });
  res.json({ ok: true });
}

export async function markAllRead(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await Notification.updateMany({ userId: req.userId }, { isRead: true });
  res.json({ ok: true });
}
