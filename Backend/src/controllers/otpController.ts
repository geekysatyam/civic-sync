import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { sendOtp, verifyOtp } from '../services/otpService.js';

export async function requestOtp(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { phone } = req.body as { phone?: string };
  if (!phone?.trim()) {
    res.status(400).json({ error: 'phone required' });
    return;
  }
  const result = sendOtp(phone);
  if (!result.ok) {
    res.status(400).json({ error: result.error ?? 'Could not send OTP' });
    return;
  }
  await User.updateOne({ _id: req.userId }, { phone: phone.trim() });
  res.json({
    ok: true,
    message: 'OTP sent (mock mode logs to server console when MOCK_OTP=true)',
    mockCode: result.mockCode,
  });
}

export async function confirmOtp(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { phone, code } = req.body as { phone?: string; code?: string };
  if (!phone?.trim() || !code?.trim()) {
    res.status(400).json({ error: 'phone and code required' });
    return;
  }
  if (!verifyOtp(phone, code)) {
    res.status(400).json({ error: 'Invalid or expired code' });
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.userId,
    { phone: phone.trim(), phoneVerified: true, verificationMethod: 'otp' },
    { new: true }
  );
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    ok: true,
    phoneVerified: true,
    message: 'Phone verified — you can adopt spots and submit community fixes',
  });
}

export async function otpStatus(req: Request, res: Response) {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.userId).select('phone phoneVerified').lean();
  res.json({
    phone: user?.phone ?? '',
    phoneVerified: Boolean(user?.phoneVerified),
    mockMode: process.env.MOCK_OTP === 'true' || process.env.NODE_ENV !== 'production',
  });
}
