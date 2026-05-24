import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  me,
  completeProfile,
  googleStatus,
  googleStart,
  googleCallback,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';
import { confirmOtp, otpStatus, requestOtp } from '../controllers/otpController.js';
import { ac } from '../utils/asyncHandler.js';

const r = Router();
r.get('/google/status', googleStatus);
r.get('/google', googleStart);
r.get('/google/callback', ac(googleCallback));
r.post('/register', ac(register));
r.post('/login', ac(login));
r.post('/logout', logout);
r.post('/refresh', refresh);
r.post('/forgot-password', ac(forgotPassword));
r.post('/reset-password', ac(resetPassword));
r.get('/me', authRequired, ac(me));
r.patch('/complete-profile', authRequired, ac(completeProfile));
r.get('/otp/status', authRequired, ac(otpStatus));
r.post('/otp/send', authRequired, ac(requestOtp));
r.post('/otp/verify', authRequired, ac(confirmOtp));

export default r;
