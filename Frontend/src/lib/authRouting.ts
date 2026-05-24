import type { Role } from '@/types';

/** Default landing route after sign-in, based on server role (RBAC). */
export function homePathForRole(role: Role): string {
  if (role === 'mayor') return '/gov/mayor';
  if (role === 'state_admin') return '/gov/state';
  if (role === 'admin') return '/gov/admin/moderation';
  if (role === 'contractor') return '/contractor';
  if (role === 'department_head') return '/dept-head';
  return '/feed';
}

export function roleLabel(role: Role | null | undefined): string {
  if (!role) return 'Guest';
  const labels: Record<Role, string> = {
    citizen: 'Citizen',
    mayor: 'Mayor',
    state_admin: 'State admin',
    admin: 'Admin',
    contractor: 'Contractor',
    department_head: 'Dept. Head',
  };
  return labels[role];
}

export function canWriteArticles(role: Role | null, rank?: string): boolean {
  if (role === 'mayor' || role === 'state_admin') return true;
  if (role === 'citizen' && rank === 'city_guardian') return true;
  return false;
}

export function roleHint(role: Role): string {
  const hints: Record<Role, string> = {
    citizen: 'Report issues, earn karma, and help your neighborhood.',
    mayor: 'Manage city issues, contractors, and department performance.',
    state_admin: 'Oversee cities, emergencies, articles, and statewide metrics.',
    admin: 'Moderate articles and platform content before publish.',
    contractor: 'Complete assigned repair jobs with photo proof for the mayor.',
    department_head: 'Triage and update issues assigned to your department.',
  };
  return hints[role];
}
