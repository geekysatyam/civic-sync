import { Resend } from 'resend';

let resend: Resend | null = null;

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const c = client();
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  if (!c) {
    console.warn('[email] RESEND_API_KEY not set, skipping:', subject, '→', to);
    return false;
  }
  try {
    await c.emails.send({ from, to, subject, html });
    return true;
  } catch (e) {
    console.error('[email] send failed', e);
    return false;
  }
}

export async function sendBulkSameSubject(recipients: string[], subject: string, html: string) {
  for (const to of recipients) {
    await sendEmail(to, subject, html);
  }
}
