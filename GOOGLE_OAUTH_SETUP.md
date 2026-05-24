# Google OAuth setup for CivicSync

CivicSync supports **Sign in with Google** for **citizen** accounts. After Google returns, new users complete the same extra fields as email signup (**city**, optional **neighborhood**, confirm **name**).

Government roles (mayor, state admin, contractor, platform admin) still use **email + password** only.

---

## 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Go to **APIs & Services → OAuth consent screen**.
   - User type: **External** (for testing) or Internal if Workspace-only.
   - Add app name, support email, developer contact.
   - Scopes: default `openid`, `email`, `profile` are enough.
   - **Test users**: add your Gmail addresses while the app is in "Testing".
4. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**
   - **Authorized JavaScript origins** (add each URL you use for the frontend):
     - `http://localhost:8080`
     - `http://localhost:5173`
     - Your production frontend URL (e.g. `https://your-app.up.railway.app`)
   - **Authorized redirect URIs** (must match `GOOGLE_CALLBACK_URL` exactly):
     - **Local dev:** `http://localhost:8080/api/auth/google/callback` (frontend/Vite port, not 5000)
     - **Production:** your public API or frontend URL + `/api/auth/google/callback`
5. Copy the **Client ID** and **Client secret**.

---

## 2. Backend environment (`backend/.env`)

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
CLIENT_URL=http://localhost:8080,http://localhost:5173
```

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Must match a redirect URI in Google Console |
| `CLIENT_URL` | First entry is where users land after OAuth (`/auth/callback`) |

Restart the backend after changing env vars.

Optional for local dev if refresh cookies fail:

```env
COOKIE_SECURE=false
```

---

## 3. Frontend (optional)

In dev, the Vite proxy sends `/api` to port **5000**, so you usually **do not** need `VITE_API_URL`.

If the frontend talks to the API on another host:

```env
# frontend/.env.local
VITE_API_URL=https://your-api.example.com
```

---

## 4. How the flow works

1. User clicks **Google** on sign-in or sign-up.
2. Browser goes to `GET /api/auth/google` → Google consent → `GET /api/auth/google/callback`.
3. Backend creates or links a **citizen** user, sets JWT + refresh cookie, redirects to:
   - `{CLIENT_URL}/auth/callback?accessToken=...&profileComplete=0|1`
4. If `profileComplete=0`, user sees **Finish setting up your account** (city required).
5. `PATCH /api/auth/complete-profile` saves city/neighborhood → user goes to `/feed`.

---

## 5. Production checklist

- [ ] OAuth consent screen **Published** (or test users added while Testing).
- [ ] Production redirect URI added in Google Console.
- [ ] `GOOGLE_CALLBACK_URL` uses the **public API** URL, not localhost.
- [ ] `CLIENT_URL` includes your production frontend origin (CORS).
- [ ] HTTPS in production (`COOKIE_SECURE` defaults to secure cookies when `NODE_ENV=production`).

---

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Button says Google not configured | Set all three `GOOGLE_*` vars and restart backend |
| `redirect_uri_mismatch` | `GOOGLE_CALLBACK_URL` must match Google Console exactly |
| `invalid_state` after Google OK | Use **8080** callback in dev, not 5000; restart backend after `.env` change |
| Lands on error `gov_account_use_password` | That Gmail is a seeded mayor/state account — use password login |
| Stuck after Google | Check `CLIENT_URL` matches the tab you use (e.g. `:8080`) |
| `/api/auth/google/status` returns `enabled: false` | Missing env vars on the server |

Test status endpoint:

```bash
curl http://localhost:5000/api/auth/google/status
# {"enabled":true}
```
