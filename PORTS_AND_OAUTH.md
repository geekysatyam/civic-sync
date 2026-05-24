# CivicSync — local ports & Google OAuth (ideal setup)

## Port map (local development)

| # | Service | Port | URL | Who uses it |
|---|---------|------|-----|-------------|
| 001 | **Frontend (Vite)** | **8080** | http://localhost:8080 | You open this in the browser |
| 002 | **Backend API** | **5000** | http://localhost:5000 | Only the Vite proxy + health checks; not for OAuth in browser |
| 003 | MongoDB | 27017 | mongodb://localhost:27017/civicsync | Backend only |

### Traffic flow

```
Browser  →  http://localhost:8080        (React app)
Browser  →  http://localhost:8080/api/*  (Vite proxy)
Vite     →  http://127.0.0.1:5000/api/* (Express API)
Google   →  http://localhost:8080/api/auth/google/callback  (must match Google Console)
```

**Do not** open `http://localhost:5000/api/auth/google` for sign-in. Always use the app on **8080**.

---

## Ideal `backend/.env` (local)

```env
PORT=5000
CLIENT_URL=http://localhost:8080,http://localhost:5173

GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

COOKIE_SECURE=false
```

- `CLIENT_URL` is comma-separated **browser origins** (for CORS + post-login redirect).
- `GOOGLE_CALLBACK_URL` is a **single full URL** (no commas).
- `GOOGLE_CLIENT_ID` must be **one line**, no commas, no extra text.

---

## Ideal `frontend` (local)

Leave `VITE_API_URL` **unset** in dev so `/api` is proxied to port 5000.

```env
# frontend/.env.local — optional
# VITE_API_URL=
```

---

## Why `redirect_uri_mismatch` happens

Google compares the `redirect_uri` in the auth request with **Authorized redirect URIs** on your OAuth client.

Your app now sends:

```text
http://localhost:8080/api/auth/google/callback
```

That string must appear **character-for-character** in Google Cloud Console.

Common causes:

1. URI not added in Console (only `:5000` was added earlier).
2. OAuth client type is **Desktop** or **Chrome extension** instead of **Web application**.
3. Typo: trailing `/`, `https` vs `http`, wrong port.
4. Editing a **different** OAuth client than the `GOOGLE_CLIENT_ID` in `.env`.

The `Comma-separated` text in some error screens is **not** part of your client ID — it often comes from the `CLIENT_URL` comment in docs being copied by mistake. Your `.env` client ID line should end with `.com` only.

---

## Google Cloud Console checklist

1. **APIs & Services → Credentials**
2. Open OAuth 2.0 Client ID used in `.env` (type: **Web application**).
3. **Authorized JavaScript origins**
   - `http://localhost:8080`
4. **Authorized redirect URIs**
   - `http://localhost:8080/api/auth/google/callback`
5. **Save** and wait 1–5 minutes.
6. **OAuth consent screen**: add your Gmail under **Test users** if app is in Testing.

---

## Verify before clicking Google

1. Backend running:
   ```powershell
   cd backend
   npm run dev
   ```
   Log must show: `http://localhost:8080/api/auth/google/callback`

2. Frontend running:
   ```powershell
   cd frontend
   npm run dev
   ```
   Open http://localhost:8080

3. Status endpoint (via proxy):
   ```text
   http://localhost:8080/api/auth/google/status
   ```
   Expect:
   ```json
   {
     "enabled": true,
     "redirectUri": "http://localhost:8080/api/auth/google/callback",
     "clientUrl": "http://localhost:8080",
     "registerInGoogleConsole": { ... }
   }
   ```

4. Sign in from **8080** only.

---

## Two terminals (required)

| Terminal | Command | Port |
|----------|---------|------|
| 1 | `cd backend && npm run dev` | 5000 |
| 2 | `cd frontend && npm run dev` | 8080 |

Running `npm run dev` from repo root fails — there is no root `package.json`.
