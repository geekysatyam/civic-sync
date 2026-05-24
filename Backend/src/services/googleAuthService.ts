import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
};

function envTrim(key: string) {
  const v = process.env[key];
  return typeof v === 'string' ? v.trim() : '';
}

function requireGoogleConfig() {
  const clientId = envTrim('GOOGLE_CLIENT_ID');
  const clientSecret = envTrim('GOOGLE_CLIENT_SECRET');
  const redirectUri = getGoogleCallbackUrl();
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)');
  }
  if (clientId.includes(',') || clientId.includes(' ')) {
    throw new Error('GOOGLE_CLIENT_ID looks invalid — use only the Client ID string, one line, no commas');
  }
  return { clientId, clientSecret, redirectUri };
}

export function isGoogleOAuthEnabled() {
  return Boolean(envTrim('GOOGLE_CLIENT_ID') && envTrim('GOOGLE_CLIENT_SECRET'));
}

export function createOAuthClient() {
  const { clientId, clientSecret, redirectUri } = requireGoogleConfig();
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export function generateOAuthState() {
  return crypto.randomBytes(24).toString('hex');
}

export function getGoogleAuthUrl(state: string) {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });
}

export async function fetchGoogleProfile(code: string): Promise<GoogleProfile> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new Error('Google did not return an ID token');
  }
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: envTrim('GOOGLE_CLIENT_ID'),
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Incomplete Google profile');
  }
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email.split('@')[0],
    picture: payload.picture,
  };
}

export function primaryClientUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:8080').split(',')[0].trim();
}

/**
 * Redirect URI registered in Google Console.
 * In local dev, always use CLIENT_URL (Vite :8080) — never :5000 or OAuth cookies/state break.
 */
export function getGoogleCallbackUrl() {
  const client = primaryClientUrl().replace(/\/$/, '');
  const derived = `${client}/api/auth/google/callback`;
  const explicit = process.env.GOOGLE_CALLBACK_URL?.trim();
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    if (!explicit || explicit.includes(':5000')) {
      return derived;
    }
  }
  return explicit || derived;
}

export function warnIfCallbackPortMismatch() {
  const callback = getGoogleCallbackUrl();
  const client = primaryClientUrl();
  try {
    const cbPort = new URL(callback).port;
    const clientPort = new URL(client).port;
    if (cbPort && clientPort && cbPort !== clientPort) {
      console.warn(
        `[oauth] GOOGLE_CALLBACK_URL uses port ${cbPort} but CLIENT_URL uses ${clientPort}. ` +
          `This often causes invalid_state. Prefer: ${client}/api/auth/google/callback`
      );
    }
  } catch {
    /* ignore */
  }
}
