export function buildWhyRanked(u: {
  issuesPosted?: number;
  volunteerHours?: number;
  solutionsImplemented?: number;
}) {
  const parts: string[] = [];
  if ((u.issuesPosted ?? 0) > 0) parts.push(`${u.issuesPosted} issues reported`);
  if ((u.volunteerHours ?? 0) > 0) parts.push(`${u.volunteerHours} volunteer hours`);
  if ((u.solutionsImplemented ?? 0) > 0) parts.push(`${u.solutionsImplemented} community solutions`);
  if (!parts.length) return 'Karma from civic participation';
  return `Karma from ${parts.join(' · ')}`;
}

export function serializeCitizenLeaderboard(
  users: {
    _id: { toString(): string };
    name: string;
    city?: string;
    rank: string;
    karmaPoints?: number;
    issuesPosted?: number;
    volunteerHours?: number;
    solutionsImplemented?: number;
    phoneVerified?: boolean;
  }[]
) {
  return users.map((u, i) => ({
    rank: i + 1,
    userId: u._id.toString(),
    name: u.name,
    city: u.city,
    userRank: u.rank,
    karmaPoints: u.karmaPoints ?? 0,
    issuesPosted: u.issuesPosted ?? 0,
    volunteerHours: u.volunteerHours ?? 0,
    solutionsImplemented: u.solutionsImplemented ?? 0,
    phoneVerified: u.phoneVerified ?? false,
    whyRanked: buildWhyRanked(u),
  }));
}
