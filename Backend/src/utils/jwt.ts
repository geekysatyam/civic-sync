import jwt from 'jsonwebtoken';
import type { AuthPayload } from '../types/express.js';

function accessSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
}

function refreshSecret() {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error('JWT_REFRESH_SECRET not set');
  return s;
}

export function signAccessToken(payload: AuthPayload) {
  return jwt.sign(payload, accessSecret(), { expiresIn: '15m' });
}

export function signRefreshToken(payload: AuthPayload) {
  return jwt.sign(payload, refreshSecret(), { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret()) as AuthPayload;
}
