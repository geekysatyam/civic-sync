import { api } from '@/lib/api';

/** Base URL for API (empty in dev = Vite proxy). */
export function apiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? '';
}

export function startGoogleSignIn(returnTo?: string) {
  // Dev: always start OAuth on the Vite origin (8080) so redirect_uri stays on 8080
  const base = import.meta.env.DEV ? window.location.origin : apiBaseUrl();
  const params = new URLSearchParams();
  if (returnTo?.startsWith('/') && !returnTo.startsWith('//')) {
    params.set('returnTo', returnTo);
  }
  const q = params.toString();
  window.location.href = `${base}/api/auth/google${q ? `?${q}` : ''}`;
}

export async function fetchGoogleAuthEnabled(): Promise<{ enabled: boolean; redirectUri?: string | null }> {
  try {
    const { data } = await api.get<{ enabled: boolean; redirectUri?: string | null }>('/api/auth/google/status');
    return data;
  } catch {
    return { enabled: false };
  }
}

export const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  not_configured: 'Google sign-in is not configured on the server. Add GOOGLE_CLIENT_ID and related env vars.',
  gov_account_use_password: 'Government accounts must sign in with email and password, not Google.',
  email_linked_other_google: 'This email is linked to a different Google account.',
  google_failed: 'Google sign-in failed. Try again.',
  invalid_state: 'Sign-in session expired. Please try again.',
  access_denied: 'Google sign-in was cancelled.',
};
