import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';

type Rank = 'civic_scout' | 'block_captain' | 'neighborhood_advocate' | 'city_guardian';

const RANK_BY_XP: { minXp: number; rank: Rank }[] = [
  { minXp: 4000, rank: 'city_guardian' },
  { minXp: 1500, rank: 'neighborhood_advocate' },
  { minXp: 500, rank: 'block_captain' },
  { minXp: 0, rank: 'civic_scout' },
];

function rankForXp(xp: number): Rank {
  for (const row of RANK_BY_XP) {
    if (xp >= row.minXp) return row.rank;
  }
  return 'civic_scout';
}

/** Award karma + XP to citizens; auto-promote rank when XP thresholds are met. */
export async function awardCitizen(
  userId: string,
  karma: number,
  xp: number,
  opts?: { reason?: string }
) {
  if (karma <= 0 && xp <= 0) return;
  const user = await User.findById(userId);
  if (!user || user.role !== 'citizen') return;

  const prevRank = user.rank;
  user.karmaPoints = Math.max(0, (user.karmaPoints ?? 0) + karma);
  user.xp = Math.max(0, (user.xp ?? 0) + xp);
  const nextRank = rankForXp(user.xp);
  user.rank = nextRank;

  await user.save();

  if (nextRank !== prevRank && opts?.reason) {
    await Notification.create({
      userId: user._id,
      type: 'rank_up',
      title: 'Rank up!',
      message: `You reached ${nextRank.replace(/_/g, ' ')} — ${opts.reason}`,
      metadata: { rank: nextRank },
    });
  }
}
