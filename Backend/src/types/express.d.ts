import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: 'citizen' | 'mayor' | 'state_admin' | 'admin' | 'contractor';
    }
  }
}

export type AuthPayload = {
  sub: string;
  role: 'citizen' | 'mayor' | 'state_admin' | 'admin' | 'contractor';
};
