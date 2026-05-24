import type { Request, Response, NextFunction } from 'express';

export function requireRoles(
  ...roles: Array<'citizen' | 'mayor' | 'state_admin' | 'admin' | 'contractor' | 'department_head'>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

export const requireCitizen = requireRoles('citizen');
export const requireMayor = requireRoles('mayor');
export const requireState = requireRoles('state_admin');
export const requireAdmin = requireRoles('admin');
export const requireModerator = requireRoles('admin', 'state_admin');
export const requireContractor = requireRoles('contractor');
export const requireDeptHead = requireRoles('department_head');

/** city_guardian citizens, mayor, or state_admin may submit articles */
export async function requireArticleAuthor(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (req.userRole === 'mayor' || req.userRole === 'state_admin') {
    next();
    return;
  }
  if (req.userRole === 'citizen') {
    const { User } = await import('../models/User.js');
    const u = await User.findById(req.userId).lean();
    if (u?.rank === 'city_guardian') {
      next();
      return;
    }
    res.status(403).json({ error: 'City Guardian rank required to publish articles' });
    return;
  }
  res.status(403).json({ error: 'Forbidden' });
  return;
}

/** Advocate or City Guardian ranks for certain citizen actions */
export async function requireAdvocateOrGuardian(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== 'citizen') {
    res.status(403).json({ error: 'Citizens only' });
    return;
  }
  const { User } = await import('../models/User.js');
  const u = await User.findById(req.userId).lean();
  if (!u || !['neighborhood_advocate', 'city_guardian'].includes(u.rank)) {
    res.status(403).json({ error: 'Neighborhood Advocate or City Guardian required' });
    return;
  }
  next();
}

export async function requireCityGuardian(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== 'citizen') {
    res.status(403).json({ error: 'Citizens only' });
    return;
  }
  const { User } = await import('../models/User.js');
  const u = await User.findById(req.userId).lean();
  if (!u || u.rank !== 'city_guardian') {
    res.status(403).json({ error: 'City Guardian required' });
    return;
  }
  next();
}
