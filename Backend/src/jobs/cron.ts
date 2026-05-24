import cron from 'node-cron';
import { Issue } from '../models/Issue.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { GhostAudit } from '../models/GhostAudit.js';
import { sendEmail } from '../services/emailService.js';

async function findMayorEmail(city: string) {
  const m = await User.findOne({ role: 'mayor', city }).select('email name').lean();
  return m?.email;
}

function safe(fn: () => Promise<void>) {
  return () => fn().catch((e) => console.error('[cron]', e));
}

export function startCronJobs() {
  cron.schedule('0 * * * *', safe(async () => {
    const now = new Date();
    const breached = await Issue.find({
      slaDeadline: { $lt: now },
      slaBreached: false,
      status: { $nin: ['resolved', 'community_resolved', 'recurred'] },
      acknowledgedAt: { $exists: true },
    }).lean();

    for (const issue of breached) {
      await Issue.updateOne({ _id: issue._id }, { slaBreached: true });
      const mayorEmail = await findMayorEmail(issue.city);
      if (mayorEmail) {
        await sendEmail(
          mayorEmail,
          `SLA breached: ${issue.title}`,
          `<p>Issue in ${issue.city} has breached its SLA deadline.</p><p>${issue.title}</p>`
        );
      }
      const mayors = await User.find({ role: 'mayor', city: issue.city }).select('_id').lean();
      for (const m of mayors) {
        await Notification.create({
          userId: m._id,
          type: 'sla_breach',
          title: 'SLA breach',
          message: issue.title,
          metadata: { issueId: issue._id.toString() },
        });
      }
    }
  }));

  cron.schedule('0 0 * * *', safe(async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const oldResolved = await Issue.find({
      status: { $in: ['resolved', 'community_resolved'] },
      resolvedAt: { $lt: sixMonthsAgo },
    }).lean();

    for (const issue of oldResolved) {
      const existing = await GhostAudit.findOne({ issueId: issue._id, status: 'pending' });
      if (existing) continue;
      const guardian = await User.findOne({ city: issue.city, rank: 'city_guardian' }).select('_id').lean();
      const assignee = guardian?._id ?? issue.reportedBy;
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 14);
      await GhostAudit.create({
        issueId: issue._id,
        scheduledAt,
        assignedTo: assignee,
        status: 'pending',
      });
      await Issue.updateOne(
        { _id: issue._id },
        { ghostAudit: { scheduledAt, assignedTo: assignee } }
      );
      await Notification.create({
        userId: assignee,
        type: 'audit_ping',
        title: 'Ghost Inspector audit',
        message: `Please verify resolved issue: ${issue.title}`,
        metadata: { issueId: issue._id.toString() },
      });
    }
  }));

  cron.schedule('0 0 1 * *', safe(async () => {
    await User.updateMany({ rank: 'block_captain' }, { $unset: { superVoteUsedAt: 1 } });
    const caps = await User.find({ rank: 'block_captain' }).select('_id').lean();
    for (const u of caps) {
      await Notification.create({
        userId: u._id,
        type: 'super_vote_reset',
        title: 'Super vote reset',
        message: 'Your monthly super vote has been reset.',
      });
    }
  }));

  cron.schedule('0 */2 * * *', safe(async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const alerts = await Issue.find({
      isRedAlert: true,
      redAlertAcknowledgedAt: { $exists: false },
      createdAt: { $lt: twoHoursAgo },
      redAlertUnacknowledgedFlag: false,
    }).lean();

    for (const issue of alerts) {
      await Issue.updateOne({ _id: issue._id }, { redAlertUnacknowledgedFlag: true });
      const admins = await User.find({ role: 'state_admin' }).select('_id').lean();
      for (const a of admins) {
        await Notification.create({
          userId: a._id,
          type: 'escalation',
          title: 'Unacknowledged Red Alert',
          message: `${issue.city}: ${issue.title}`,
          metadata: { issueId: issue._id.toString() },
        });
      }
    }
  }));

  cron.schedule('0 */6 * * *', safe(async () => {
    const open = await Issue.find({
      status: { $nin: ['resolved', 'community_resolved', 'recurred'] },
    }).select('_id aiSeverity upvotes isRedAlert slaBreached status').lean();

    const ops = open.map((issue) => {
      const severity = issue.aiSeverity ?? 3;
      const upvoteCount = Array.isArray(issue.upvotes) ? issue.upvotes.length : 0;
      const score =
        severity * 20 +
        upvoteCount * 2 +
        (issue.slaBreached ? 30 : 0) +
        (issue.isRedAlert ? 50 : 0) +
        (issue.status === 'recurred' ? 15 : 0);
      return { updateOne: { filter: { _id: issue._id }, update: { priorityScore: score } } };
    });

    if (ops.length) await Issue.bulkWrite(ops);
  }));

  console.log('Cron jobs scheduled');
}
