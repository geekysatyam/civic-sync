/** Cookie options for refresh token (OAuth callback + login). */
export function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const forceSecure = process.env.COOKIE_SECURE === 'true';
  const secure = isProd || forceSecure;
  return {
    httpOnly: true,
    sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export const REFRESH_COOKIE = 'refreshToken';

/** Options for clearCookie — omit maxAge (deprecated in Express 5). */
export function refreshClearCookieOptions() {
  const { maxAge: _maxAge, ...opts } = refreshCookieOptions();
  return opts;
}

export function oauthClearCookieOptions() {
  const { maxAge: _maxAge, ...opts } = oauthCookieOptions();
  return opts;
}

/** OAuth CSRF cookies — path `/` so they work behind the Vite `/api` proxy on :8080. */
export function oauthCookieOptions(maxAgeMs = 10 * 60 * 1000) {
  const base = refreshCookieOptions();
  return {
    ...base,
    path: '/',
    maxAge: maxAgeMs,
  };
}
