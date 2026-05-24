import { User } from '../models/User.js';

export type ReporterMeta = { name: string; phoneVerified: boolean };

export async function reporterMetaByIds(ids: string[]): Promise<Record<string, ReporterMeta>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const users = await User.find({ _id: { $in: unique } }).select('name phoneVerified').lean();
  const out: Record<string, ReporterMeta> = {};
  for (const u of users) {
    out[u._id.toString()] = {
      name: u.name,
      phoneVerified: Boolean(u.phoneVerified),
    };
  }
  return out;
}
