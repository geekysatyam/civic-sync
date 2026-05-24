/** Dev/mock OTP — replace with Twilio/MSG91 for production. */

const pending = new Map<string, { code: string; expiresAt: number }>();

const CODE_TTL_MS = 10 * 60 * 1000;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return digits.length >= 10 ? `+${digits}` : '';
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sendOtp(phone: string): { ok: boolean; mockCode?: string; error?: string } {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 12) {
    return { ok: false, error: 'Invalid phone number (use 10-digit India mobile)' };
  }
  const code = generateOtpCode();
  pending.set(normalized, { code, expiresAt: Date.now() + CODE_TTL_MS });
  const expose =
    process.env.MOCK_OTP === 'true' || process.env.NODE_ENV !== 'production';
  if (expose) {
    console.log(`[otp:mock] ${normalized} → ${code}`);
  }
  return { ok: true, mockCode: expose ? code : undefined };
}

export function verifyOtp(phone: string, code: string): boolean {
  const normalized = normalizePhone(phone);
  const entry = pending.get(normalized);
  if (!entry || entry.expiresAt < Date.now()) {
    pending.delete(normalized);
    return false;
  }
  if (entry.code !== code.trim()) return false;
  pending.delete(normalized);
  return true;
}
