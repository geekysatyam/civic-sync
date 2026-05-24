/** Short-lived OAuth state (CSRF) — survives when cookies are lost across ports in local dev. */
const pending = new Map<string, { returnTo: string; expiresAt: number }>();

const TTL_MS = 10 * 60 * 1000;

export function saveOAuthState(state: string, returnTo: string) {
  pending.set(state, { returnTo, expiresAt: Date.now() + TTL_MS });
}

export function consumeOAuthState(state: string): { returnTo: string } | null {
  const row = pending.get(state);
  pending.delete(state);
  if (!row || row.expiresAt < Date.now()) return null;
  return { returnTo: row.returnTo };
}

export function pruneOAuthState() {
  const now = Date.now();
  for (const [key, row] of pending) {
    if (row.expiresAt < now) pending.delete(key);
  }
}
