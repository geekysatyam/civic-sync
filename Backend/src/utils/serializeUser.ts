import type { Types } from 'mongoose';

/** Accepts Mongoose documents or lean users (flexible for nested karma redemptions). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeUser(u: any) {
  const karmaRedemptions = (u.karmaRedemptions ?? []) as Array<{
    _id?: Types.ObjectId;
    rewardId?: Types.ObjectId;
    couponCode: string;
    businessName?: string;
    rewardDescription?: string;
    redeemedAt?: Date;
  }>;

  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    city: u.city,
    neighborhood: u.neighborhood ?? '',
    role: u.role,
    rank: u.rank,
    xp: u.xp ?? 0,
    karmaPoints: u.karmaPoints ?? 0,
    badges: (u.specialtyBadges ?? []).map((b: { badgeId: string }) => b.badgeId),
    issuesPosted: u.issuesPosted ?? 0,
    solutionsImplemented: u.solutionsImplemented ?? 0,
    volunteerHours: u.volunteerHours ?? 0,
    isTrustedReporter: u.isTrustedReporter ?? false,
    avatarUrl: u.avatarUrl ?? '',
    authProvider: u.authProvider ?? 'local',
    profileComplete: u.profileComplete !== false,
    phone: u.phone ?? '',
    phoneVerified: Boolean(u.phoneVerified),
    contractorCategory: u.contractorCategory ?? '',
    contractorLabel: u.contractorLabel ?? '',
    redeemedCoupons: karmaRedemptions.map((r) => ({
      id: r._id?.toString() ?? '',
      rewardId: r.rewardId?.toString() ?? '',
      couponCode: r.couponCode,
      businessName: r.businessName ?? '',
      description: r.rewardDescription ?? '',
      redeemedAt: r.redeemedAt ? new Date(r.redeemedAt).toISOString() : '',
    })),
  };
}
