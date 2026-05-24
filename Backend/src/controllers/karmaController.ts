import crypto from 'crypto';
import type { Request, Response } from 'express';
import { KarmaReward } from '../models/KarmaReward.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { serializeUser } from '../utils/serializeUser.js';

export async function listRewards(req: Request, res: Response) {
  const { city } = req.query;
  const q: Record<string, unknown> = { isActive: true };
  if (city) q.city = city;
  const rewards = await KarmaReward.find(q).lean();
  res.json(
    rewards.map((r) => ({
      id: r._id.toString(),
      businessName: r.businessName,
      description: r.description,
      pointCost: r.karmaCost,
      category: r.category ?? 'General',
    }))
  );
}

export async function redeem(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const reward = await KarmaReward.findById(req.params.id);
  if (!reward || !reward.isActive) {
    res.status(404).json({ error: 'Reward not found' });
    return;
  }
  const user = await User.findById(req.userId).lean();
  if (!user || (user.karmaPoints ?? 0) < reward.karmaCost) {
    res.status(400).json({ error: 'Insufficient karma' });
    return;
  }
  const couponCode = `CS-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const updated = await User.findByIdAndUpdate(
    req.userId,
    {
      $inc: { karmaPoints: -reward.karmaCost },
      $push: {
        karmaRedemptions: {
          rewardId: reward._id,
          couponCode,
          businessName: reward.businessName,
          rewardDescription: reward.description,
          redeemedAt: new Date(),
        },
      },
    },
    { new: true }
  );
  if (!updated) {
    res.status(500).json({ error: 'Update failed' });
    return;
  }
  await Notification.create({
    userId: updated._id,
    type: 'fix_confirmed',
    title: 'Reward redeemed',
    message: `Coupon ${couponCode}: ${reward.businessName} — ${reward.description}`,
    metadata: { rewardId: reward._id.toString(), couponCode },
  });
  res.json({
    ok: true,
    karmaPoints: updated.karmaPoints,
    couponCode,
    businessName: reward.businessName,
    description: reward.description,
  });
}

export async function listRedemptions(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.userId).lean();
  if (!user) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(serializeUser(user as never).redeemedCoupons);
}
