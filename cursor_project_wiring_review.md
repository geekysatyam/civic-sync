# Project wiring review
_Exported on 5/23/2026 at 00:52:45 GMT+5:30 from Cursor (3.5.17)_

---

**User**

I am planning to expand my project 
do the following things 
Article creation thing Give authprity to city_guardian , mayor and state to create article but before putting it to page being moderatted by admin . 
Another city wise different contractor panel . give authority to mayors to create different contractor user like electricity and other else and contractors few thing are necessary some to update and also to update before and after repair so that mayor is updated for issue 
Contractor will be only able to see issue take actions 

Make frontend for thing and wire up in backend too 

---

**Cursor**

Exploring the codebase to design articles with admin moderation and a city-scoped contractor workflow, then implementing backend and frontend.


Implementing backend models and APIs first, then frontend pages and wiring.


Implementing frontend pages and wiring.


Implemented both features end-to-end (backend + frontend). Here is what you have now:

---

## 1. Articles with admin moderation

**Who can write:** City Guardian citizens, mayors, state admins  
**Flow:** Submit → `pending` → admin approves/rejects → approved articles show on homepage Success Stories (`/api/stories` merges moderated articles + legacy seed stories)

| API | Purpose |
|-----|---------|
| `POST /api/articles` | Submit article |
| `GET /api/articles/mine` | Author’s submissions |
| `GET /api/articles/pending` | Admin queue |
| `PATCH /api/articles/:id/moderate` | Approve / reject |
| `GET /api/articles` | Public approved list |

**Frontend**
- `/articles/write` — compose story  
- `/articles/mine` — track status (pending / approved / rejected)  
- `/gov/admin/moderation` — admin review UI  

**Login:** `admin@civicsync.gov` / `password123` (after `npm run seed:admin`)

---

## 2. City contractors (mayor-managed)

**Mayor** creates contractor accounts per trade (electricity, water, roads, etc.) for their city only.

**Contractor** can:
- See jobs in their city (assigned to them **or** matching their trade category)  
- Post work updates with status: `assigned` → `on_site` → `completed`  
- Upload **before** photo (required when moving on-site if none exists)  
- Upload **after** photo (required to mark **completed**)  
- Mayor gets in-app notifications on each update  

| API | Purpose |
|-----|---------|
| `GET/POST /api/contractors` | List / create contractors (mayor) |
| `PATCH /api/contractors/issues/:issueId/assign` | Assign issue to contractor |
| `GET /api/contractor/issues` | Contractor job list |
| `POST /api/contractor/issues/:issueId/work` | Photos + status + note |

**Frontend**
- `/gov/mayor/contractors` — create contractors + assign issues  
- `/contractor` — contractor repair panel  

Contractors log in with the email/password the mayor sets (not public self-registration).

---

## New roles

- `admin` — article moderation  
- `contractor` — repair panel only  

Updated: User model, JWT auth, sidebars, routing, `SEED_CREDENTIALS.md`.

---

## How to try it

```bash
cd backend
npm run seed:admin    # creates admin@civicsync.gov
npm run seed:user     # city_guardian gurpreet@demo.com
npm run dev

cd frontend
npm run dev
```

**Quick test paths**
1. Sign in as `gurpreet@demo.com` → **Write article** → submit  
2. Sign in as `admin@civicsync.gov` → **Article moderation** → approve  
3. Sign in as `mayor@ludhiana.gov` → **Contractors** → create electrician account → assign an issue  
4. Sign in as that contractor → **My repair jobs** → upload before/after + update status  

---

## Notes

- Re-run `npm run seed:admin` to add the admin account if your DB was seeded earlier.  
- Existing users keep old roles; new `admin` / `contractor` users come from seed or mayor-created contractors.  
- Completing a repair sets the issue to `resolved` and notifies the mayor.

If you want next steps, we can add email alerts for moderation, contractor-only “assigned to me” filtering, or a public `/articles` browse page.

---

**User**

@QA.md (523-546) 

---

**Cursor**

Implementing bulk seeding, state-admin article moderation, contractor status for state admins, and city/state leaderboards. Exploring the codebase first.


Implementing bulk seed and the requested APIs and frontend pages.


Creating bulk seed and wiring APIs and frontend pages.


Implemented everything from QA.md (523–546): bulk seed, state article moderation, contractor status, and leaderboards.

### Bulk seed (`backend/src/seed/bulkSeed.ts`)
- **9 cities** in `constants.ts` (Ludhiana through Chandigarh, including SAS Nagar, Bathinda, Pathankot, Hoshiarpur)
- **9 mayors** + departments per city (`adminSeed.ts`)
- **71 citizens**, **18 contractors**, **~108 issues**, **36 articles** (approved / pending / rejected), polls, notifications
- `npm run seed -- --reset` runs admin + bulk (replaces the old small `userSeed` for full seed)

**Sample logins** (password `password123`):
- `gurpreet@demo.com` — Ludhiana city guardian  
- `citizen.<cityslug>.<n>@civicsync.demo`  
- `contractor.roads.ludhiana@civicsync.demo` (and similar per city/category)  
- `state@punjab.gov` / `admin@civicsync.gov` / `mayor@ludhiana.gov`

Details: [SEED_CREDENTIALS.md](d:\project\CivicSync\SEED_CREDENTIALS.md)

### State admin can moderate articles
- Backend: `admin` **or** `state_admin` on pending list + approve/reject
- UI: **State → Article moderation** at `/gov/state/moderation`

### New state & mayor pages
| Route | What it shows |
|-------|----------------|
| `/gov/state/contractors` | Contractor counts & issue assignment status by city |
| `/gov/state/citizens` | Top 50 citizens statewide (karma) |
| `/gov/state/leaderboard` | City resolution-rate ranking (all 9 cities) |
| `/gov/mayor/leaderboard` | Top citizens in the mayor’s city |

Sidebars updated for state and mayor dashboards.

### APIs added
- `GET /api/state/contractor-status`
- `GET /api/state/users/leaderboard`
- `GET /api/mayor/leaderboard`

Run locally:

```powershell
cd d:\project\CivicSync\backend
npm run seed -- --reset
```

Then sign in as `state@punjab.gov` or `mayor@ludhiana.gov` with `password123` to try moderation, contractor status, and leaderboards.

---

**User**

review the landing page and refine the all users, mayors, contractors etc  page for good user experience

---

**Cursor**

Reviewing the landing page and role-specific dashboards to identify UX improvements.


Creating shared dashboard layout components and refining the landing page and role-specific experiences.


Refined the landing experience and aligned role dashboards around a consistent layout. Here is what changed:

### Landing page
- **Nav**: Mobile menu (sheet), clearer links (“Live issues”, “For government”), **My dashboard** when signed in.
- **Hero**: Logged-in users get **Go to dashboard**; live stats default to **9 cities**.
- **For government**: Role cards for citizens, mayors, state admin, contractors, and platform admin, with sign-in guidance.
- **CTA**: Authenticated users see **Open your dashboard** instead of duplicate sign-up buttons.

### Shared dashboard UX
New reusable pieces under `frontend/src/components/dashboard/`:
- **DashboardPage** — title, description, optional actions
- **PageLoading** / **EmptyState** — consistent loading and empty states

**Role layout** header now shows city badge, avatar initials, role hint, and a labeled **Sign out**.

### Role-specific pages
| Area | Improvements |
|------|----------------|
| **Citizens** | Feed & profile use `DashboardPage`; feed has **Report issue** in header; **Leaderboard** in sidebar; public leaderboard filters by your city when logged in |
| **Mayor** | Task board with contractor shortcut, empty states; contractors page wrapped in shell; city leaderboard with top-3 styling |
| **State** | City leaderboard with progress bars; contractor status with summary stats; citizen leaderboard & article moderation polished |
| **Contractor** | Fixed shared file-input bug (each job has its own form); status help text; summary cards; clearer empty state |
| **Admin** | Article moderation uses the same shell as state |

### How to review
1. `npm run seed -- --reset` in `backend/` (if you want fresh demo data).
2. Open `/` — scroll landing, try mobile menu, sign in as different roles.
3. Compare `gurpreet@demo.com`, `mayor@ludhiana.gov`, `state@punjab.gov`, `contractor.roads.ludhiana@civicsync.demo` (password `password123`).

If you want a next pass, we can add quick-start cards on each role’s home route (e.g. mayor: “3 issues need triage”) using live API counts.

---

**User**

review the project and add google oauth and also after oauth keep the rest signup things look for that and also tell me what to do

---

**Cursor**

Reviewing the auth and signup flow, then implementing Google OAuth with post-OAuth profile completion.


Implementing Google OAuth with a post-login profile completion step matching the existing signup fields.


Google OAuth is wired up with the same post-signup step as email registration (city, neighborhood, name).

### What was added

**Backend**
- `GET /api/auth/google` → Google consent screen  
- `GET /api/auth/google/callback` → creates/links citizen, issues JWT  
- `GET /api/auth/google/status` → `{ enabled: true/false }`  
- `PATCH /api/auth/complete-profile` → city (required), neighborhood, name  
- User fields: `googleId`, `authProvider`, `profileComplete`  
- Dependency: `google-auth-library`

**Frontend**
- **Google** on sign-in and sign-up modals  
- `/auth/callback` — handles redirect after Google  
- `/auth/complete-profile` — same extra fields as signup (city required for Google users)  
- Incomplete profiles are redirected here before `/feed`

**Docs:** [GOOGLE_OAUTH_SETUP.md](d:\project\CivicSync\GOOGLE_OAUTH_SETUP.md)

---

### What you need to do

#### 1. Google Cloud Console
1. [console.cloud.google.com](https://console.cloud.google.com) → your project  
2. **OAuth consent screen** → External → add test users (while in Testing)  
3. **Credentials** → **OAuth client ID** → **Web application**  
4. **Authorized JavaScript origins:**  
   - `http://localhost:8080`  
   - (and production frontend URL when you deploy)  
5. **Authorized redirect URIs:**  
   - `http://localhost:5000/api/auth/google/callback`  
   - (production: `https://YOUR-API/api/auth/google/callback`)  
6. Copy **Client ID** and **Client secret**

#### 2. `backend/.env`
```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:8080,http://localhost:5173
```

Optional if refresh cookies fail locally:
```env
COOKIE_SECURE=false
```

#### 3. Restart services
```powershell
cd d:\project\CivicSync\backend
npm run dev

cd d:\project\CivicSync\frontend
npm run dev
```

#### 4. Verify
```powershell
curl http://localhost:5000/api/auth/google/status
```
Should return `{"enabled":true}`.

#### 5. Test flow
1. Open `http://localhost:8080` → **Get started** or **Sign in**  
2. Click **Google**  
3. Pick a Google account (must be a **test user** if the app is still in Testing)  
4. You should land on **Finish setting up your account** → pick **city** → **Continue**  
5. You’re sent to `/feed`

---

### Behavior notes
| Account type | Google sign-in |
|--------------|----------------|
| New Gmail | Citizen account → complete profile (city required) |
| Existing `gurpreet@demo.com` with password | Links Google to same account |
| Mayor / state / admin seeded emails | Blocked — use email + password |

Microsoft is still a placeholder; only Google is implemented.

Full troubleshooting is in **GOOGLE_OAUTH_SETUP.md**. If you want, I can add the same pattern for Microsoft/Azure AD next.

---

**User**

<system_notification>
The following task has finished. If you were already aware, ignore this notification and do not restate prior responses.

<task>
kind: shell
status: success
task_id: 470623
title: Build frontend to verify TypeScript
output_path: C:\Users\HP\.cursor\projects\d-project-CivicSync\terminals\470623.txt
</task>
</system_notification>
<user_query>Briefly inform the user about the task result and perform any follow-up actions (if needed). If there's no follow-ups needed, don't explicitly say that.</user_query>

---

**Cursor**

The frontend production build finished successfully (about 32 seconds). TypeScript and Vite compiled without errors; the only notes were optional chunk-size warnings, which do not block running the app.

Google OAuth and the post-Google profile step (city, neighborhood, name) are in place on both backend and frontend. To use Google sign-in locally, add your Google OAuth credentials to `backend/.env` as described in [GOOGLE_OAUTH_SETUP.md](d:\project\CivicSync\GOOGLE_OAUTH_SETUP.md), restart the backend, and confirm `http://localhost:5000/api/auth/google/status` returns `{"enabled":true}`.

---

**User**

Error 400: redirect_uri_mismatch

You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.

If you're the app developer, register the redirect URI in the Google Cloud Console.
Request details: redirect_uri=http://localhost:5000/api/auth/google/callback flowName=GeneralOAuthFlow
Related developer documentation

---

**Cursor**

Checking how the callback URL is configured — `redirect_uri_mismatch` means Google Console doesn't list the exact URI the app sends.


Your backend is sending the correct callback URL; Google Cloud Console doesn't have that exact URI registered. Adding a startup log that prints the redirect URI to register, then sharing the fix steps.


`redirect_uri_mismatch` means Google received a callback URL that is **not** on your OAuth client’s allow list. Your app is using this URI (from the error):

```
http://localhost:5000/api/auth/google/callback
```

That matches `GOOGLE_CALLBACK_URL` in `backend/.env`, so the fix is in **Google Cloud Console**, not in the CivicSync code.

### Fix in Google Cloud Console

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Open your **OAuth 2.0 Client ID** (type **Web application**).
3. Under **Authorized redirect URIs**, click **+ ADD URI** and paste **exactly** (no trailing slash):

   ```
   http://localhost:5000/api/auth/google/callback
   ```

4. Under **Authorized JavaScript origins** (separate section), add:

   ```
   http://localhost:8080
   ```

   Do **not** put the `/api/auth/google/callback` path here — that belongs only under **redirect URIs**.

5. Click **Save**. Changes can take a few minutes.

6. Restart the backend and try Google sign-in again.

### Common mistakes

| Mistake | Result |
|--------|--------|
| URI only under JavaScript origins | `redirect_uri_mismatch` |
| Trailing slash: `.../callback/` | Mismatch |
| Wrong port: `8080` instead of `5000` | Mismatch |
| `https://` instead of `http://` locally | Mismatch |
| Editing a different OAuth client than the one in `.env` | Mismatch |

### Confirm your env

In `backend/.env`:

```env
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

After restart, the API logs:

```
Google OAuth redirect URI (add this EXACTLY in Google Cloud Console):
  http://localhost:5000/api/auth/google/callback
```

Use that line as the value you register in Google.

### OAuth consent screen

If the app is in **Testing**, add your Gmail under **OAuth consent screen → Test users**, or Google may block sign-in even after the redirect URI is fixed.

More detail: [GOOGLE_OAUTH_SETUP.md](d:\project\CivicSync\GOOGLE_OAUTH_SETUP.md).

---

**User**

AFTER SUCCESFULL GOOGLE OAUTH 

---

**Cursor**

The `invalid_state` error is likely caused by the OAuth callback hitting port 5000 while the session cookie was set on port 8080. Tracing the flow and fixing it.


OAuth starts on port 8080 (Vite) but Google redirects to port 5000, so the `oauth_state` cookie isn't sent. Fixing the callback URL and adding in-memory state validation as a fallback.


`invalid_state` happened because Google sent you back to **port 5000**, while sign-in started on **port 8080** — the browser never sent the `oauth_state` cookie.

### What we changed
1. **`backend/.env`** — callback is now `http://localhost:8080/api/auth/google/callback`
2. **In-memory state backup** — if the cookie is missing, the `state` from Google still validates
3. **OAuth cookies** use `path: /` for the Vite proxy

### What you need to do

**1. Google Cloud Console**  
Add this redirect URI (keep or replace the `:5000` one):

```
http://localhost:8080/api/auth/google/callback
```

**2. Restart the backend** (so `.env` reloads)

**3. Try Google sign-in again** from `http://localhost:8080`

You should land on **Finish setting up your account** (pick city), then `/feed`.

---

If it still fails, check the backend log on startup — it should print the exact redirect URI to register. You can also remove the old `http://localhost:5000/api/auth/google/callback` entry from Google Console to avoid confusion.

---

**User**

Error 400: redirect_uri_mismatch

You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.

If you're the app developer, register the redirect URI in the Google Cloud Console.
Request details: access_type=online scope=openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile response_type=code state=7de1f5fc192a73fb89c022eb901fa730c69a8b5514f141fa redirect_uri=http://localhost:5000/api/auth/google/callback prompt=select_account flowName=GeneralOAuthFlow client_id=380158094190-3fturi0lrbd731iedeub9nkm9a9bblpr.apps.googleusercontent.com
Related developer documentation


---

**Cursor**

Google is still receiving port 5000 — checking config and making the callback URL default to the frontend port in development.


Forcing the callback URL to port 8080 in development — Google still receives port 5000, likely from a direct `localhost:5000` link or a stale process.


Google is still being told to use **`http://localhost:5000/api/auth/google/callback`**. Your `.env` is already on **8080**, so something is still starting OAuth with the old port (stale server or opening the API on `:5000` directly).

### Fix (do in order)

**1. Stop every backend process**  
In terminals running the API, press `Ctrl+C`. In Task Manager, end any stray `node` processes for this project.

**2. Restart backend**
```powershell
cd d:\project\CivicSync\backend
npm run dev
```
Confirm the log shows:
```text
Google OAuth redirect URI ...
  http://localhost:8080/api/auth/google/callback
```

**3. Google Cloud Console → Credentials → your OAuth client**  
Under **Authorized redirect URIs**, add **exactly** (you can keep both during testing):

```
http://localhost:8080/api/auth/google/callback
```

Remove or ignore the `:5000` URI unless you intentionally open OAuth on port 5000.

**4. Use only the frontend app**  
Open **`http://localhost:8080`**, then Sign in → **Google**.  
Do **not** open `http://localhost:5000/api/auth/google` in the browser.

**5. Verify before clicking Google**  
In the browser or terminal:
```text
http://localhost:8080/api/auth/google/status
```
You should see:
```json
{"enabled":true,"redirectUri":"http://localhost:8080/api/auth/google/callback"}
```

If `redirectUri` still shows **5000**, the wrong backend is still running.

---

### Code change (already applied)
- In **dev**, callback is forced to **8080** even if `.env` says 5000.
- Google sign-in always starts from **`window.location.origin`** (your Vite port).

After restart + registering **8080** in Google Console, try Google sign-in again from `http://localhost:8080`.

---

**User**


You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.

If you're the app developer, register the redirect URI in the Google Cloud Console.
Request details: access_type=online scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid response_type=code state=bc0106de60331a326db46eceee694d6a0c434b842ffe7112 redirect_uri=http://localhost:8080/api/auth/google/callback prompt=select_account flowName=GeneralOAuthFlow client_id=380158094190-3fturi0lrbd731iedeub9nkm9a9bblpr.apps.googleusercontent.Comma-separated

See why this happenning 
check all the connections ports and set all to ideal 001 002 anythin set whats ideal 

---

**Cursor**

The error shows `redirect_uri=8080` (correct) but the client ID looks corrupted (`...googleusercontent.Comma-separated`). Checking env and port configuration across the project.


Redirect URI is correct (`8080`); Google Console likely doesn't list it, or the OAuth client type is wrong. Standardizing ports and hardening env parsing.


Here is what is going on and how the ports should be set.

## Why you see `redirect_uri_mismatch` now

The app is sending the **right** redirect URI:

```text
http://localhost:8080/api/auth/google/callback
```

Google rejects it because that exact URL is **not registered** on your OAuth client in Google Cloud Console (or the client is the wrong type).

The `Comma-separated` bit in the error is **not** your Client ID. It usually comes from copying text near `CLIENT_URL` in docs. Your `.env` should end with:

```text
...googleusercontent.com
```

only — no commas or extra words on that line.

---

## Ideal local ports (001 / 002)

| ID | Role | Port | Use |
|----|------|------|-----|
| **001** | Frontend (Vite) | **8080** | Open the app: `http://localhost:8080` |
| **002** | Backend API | **5000** | Runs API; browser uses it via proxy only |
| 003 | MongoDB | 27017 | Database |

```
You → :8080 (UI)
     → :8080/api/... (Vite proxy)
     → :5000 (Express)
Google → :8080/api/auth/google/callback  ← must be in Google Console
```

Do **not** start Google sign-in at `http://localhost:5000/...`.

---

## Fix in Google Cloud Console

1. [Credentials](https://console.cloud.google.com/apis/credentials) → open the client matching `GOOGLE_CLIENT_ID` in `.env`.
2. Type must be **Web application** (not Desktop / Android).
3. **Authorized JavaScript origins:** `http://localhost:8080`
4. **Authorized redirect URIs:** `http://localhost:8080/api/auth/google/callback`  
   - No trailing slash  
   - `http` not `https` for local dev  
5. **Save**, wait a few minutes.
6. **OAuth consent screen** → add your Gmail as a **Test user** if the app is in Testing.

---

## Run both services (two terminals)

```powershell
# Terminal 1
cd d:\project\CivicSync\backend
npm run dev

# Terminal 2
cd d:\project\CivicSync\frontend
npm run dev
```

`npm run dev` from `D:\project\CivicSync` fails — there is no root `package.json`.

---

## Verify before Google sign-in

Open in the browser:

`http://localhost:8080/api/auth/google/status`

You should see `redirectUri` = `http://localhost:8080/api/auth/google/callback` and `registerInGoogleConsole` with the same URLs to paste into Google.

Then sign in from **`http://localhost:8080`** only.

Full reference: [PORTS_AND_OAUTH.md](d:\project\CivicSync\PORTS_AND_OAUTH.md)

---

**User**

Fix these 

@missing (1-22) 

---

**Cursor**

Working through the missing.md list: exploring the codebase and implementing fixes systematically.


Implementing volunteer seed data, removing public leaderboards, and polishing key UI surfaces.


Here’s what was fixed against your `missing` list:

### Volunteer hub data
- **`bulkSeed.ts`** now seeds **2 volunteer drives per city**, **10 pro-bono offers**, and **adopt-a-spot** rows for cities that didn’t have them.
- Resets also clear `VolunteerDrive` and `ProBonoOffer` on bulk re-seed.
- **Re-seed:** `cd backend` then `npm run seed` (or `--reset` if you use that flag).

### Leaderboard (gov only, inline “why”)
- **Removed** public `/leaderboard` (redirects home), citizen sidebar link, landing teaser, and footer link.
- **Mayor** `/gov/mayor/leaderboard` uses **`CivicLeaderboard`** with karma + issues / hours / solutions + **why ranked** text.
- **State** `/gov/state/leaderboard` shows city cards with **resolution %**, open issues, red alerts, and **why each city ranks**.
- `/gov/state/citizens` redirects to the city leaderboard.
- API: shared **`serializeCitizenLeaderboard`** + richer state city rows.

### UI polish
- **Profile:** gradient header, clearer XP bar, stat cards, locked/unlocked badges with lock icons, no dev path comment.
- **Post issue:** two-column desktop layout (form left, map right, sticky).
- **Volunteer hub:** counts, empty states, card hover.
- **Landing:** **Civic impact** section instead of public leaderboard.
- **Auth modals:** removed “Development mode” strip.
- **Certificate PDF:** stronger header band, stat boxes, spacing.

### What you should do locally
1. Restart backend + frontend.
2. Run seed so volunteer data appears.
3. Check volunteer hub as e.g. `gurpreet@demo.com` / `password123`.
4. Check mayor/state leaderboards with gov accounts from `SEED_CREDENTIALS.md`.

If you want more polish on a specific screen (e.g. `RoleLayout` nav only), say which page and we can tune it further.

---

**User**

now check why mayors not able to check issue just table is shwon 

---

**Cursor**

Investigating how mayors view issues and why detail access might not work.


Mayor task management only shows a table with no way to open full issue details. Adding view links and a mayor actions panel on the issue detail page.


---

**User**

reveiw missing and start implementation

---

**Cursor**

Reviewing `missing` and the codebase to draft an implementation plan.


Creating a phased plan prioritizing the backend crash, then Phase 0 from `missing`.


---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

Implementing the plan starting with the notification enum fix, then working through the remaining todos.


Implementing the remaining plan items in parallel.


Phase 0 from the plan is implemented. Summary:

### Critical fix (backend crash)
- Added `assignment` and `contractor_update` to the [`Notification`](backend/src/models/Notification.ts) enum so contractor assign no longer crashes the API.
- Fixed Express 5 `clearCookie` deprecation via [`refreshClearCookieOptions`](backend/src/config/authCookies.ts) / [`oauthClearCookieOptions`](backend/src/config/authCookies.ts).

### Mayor issue inspection
- [`MayorTasks`](frontend/src/pages/gov/MayorTasks.tsx): SLA/red-alert sort, expandable row preview (description, photo, suggested fix), status badges, skeleton loading.
- View links + [`MayorIssuePanel`](frontend/src/components/gov/MayorIssuePanel.tsx) on issue detail (already wired).
- `slaBreached` exposed in [`serializeIssue`](backend/src/utils/serializeIssue.ts).

### Volunteer hub
- Drives show **pledger names** (not raw IDs).
- Spots API returns `{ available, adopted }` with adopter name, dates, upkeep log.
- New `PATCH /api/volunteer/spots/:id/upkeep` for adopters.
- [`Volunteer.tsx`](frontend/src/pages/Volunteer.tsx): community-maintained list, upkeep logging on “your” spots, skeleton loading.

### UI polish
- [`RoleLayout`](frontend/src/components/layouts/RoleLayout.tsx): notification bell + unread badge, role badge, scroll shadow.
- Shared status colors in [`issueStatus.ts`](frontend/src/lib/issueStatus.ts) used on feed cards and mayor table.
- [`PostIssue`](frontend/src/pages/PostIssue.tsx): ~60/40 form/map on large screens.
- [`Profile`](frontend/src/pages/Profile.tsx): badge tabs + tooltips, certificate **preview** dialog + better download filename.
- Feed skeleton loaders.

### Certificate
- Preview before download; PDF QR already points to `/verify/:serial` via [`certificateService`](backend/src/services/certificateService.ts).

### Phases 1–7
- Left as future work (no code changes).

**What you should do**
1. **Restart the backend** (`npm run dev` in `backend`) so the notification fix is active.
2. If volunteer data is empty: `cd backend` → `npm run seed` (or your reset flow).
3. Test as mayor: Task Management → expand row or **View** → full issue + triage panel.
4. Test contractor assign — API should stay up.

Frontend build passed; backend `tsc` passes after the volunteer upkeep fix.

---

**User**

<system_notification>
The following task has finished. If you were already aware, ignore this notification and do not restate prior responses.

<task>
kind: shell
status: error
task_id: 524761
title: Recompile backend after volunteer fix
detail: exit_code=2
output_path: C:\Users\HP\.cursor\projects\d-project-CivicSync\terminals\524761.txt
</task>
</system_notification>
<user_query>Briefly inform the user about the task result and perform any follow-up actions (if needed). If there's no follow-ups needed, don't explicitly say that.</user_query>

---

**Cursor**

That failed build was from an earlier compile: TypeScript rejected how `upkeepLog` was updated in `volunteerController.ts` when logging spot upkeep.

That’s fixed now — `npm run build` in `backend` completes successfully. Restart the backend dev server (`npm run dev`) so you’re running the latest code.

---

**User**

prepare comprehensive plan for all phases and track progress 

---

**Cursor**

Reviewing the full roadmap and current implementation to produce a phased plan with accurate progress tracking.


Creating a persistent roadmap document with phased plans and progress tracking.


Created **[`ROADMAP.md`](d:\project\CivicSync\ROADMAP.md)** — a single place to track all phases from `missing`, with honest status and links to code.

### What’s in it

| Section | Purpose |
|--------|---------|
| **Overall progress table** | Rough % per phase (0–7) |
| **Phase 0** | Broken into 0.1–0.7 (volunteer, leaderboards, UI 0.3.1–0.12, certificates, gov UI, mayor issues, backend fixes) |
| **Phases 1–7** | Full task lists with ✅ / 🟡 / ⬜ |
| **Mermaid dependency chart** | Suggested build order |
| **Sprint checklist** | Copy-paste for GitHub issues / PRs |
| **Recently completed** | What landed in the last implementation pass |

### Snapshot (today)

| Phase | ~Progress | Highlights |
|-------|-----------|------------|
| **0** | ~55% | Volunteer hub, mayor issue view, gov pages, partial UI polish |
| **1** | ~15% | Contractor panel mostly done; OTP / dept head / new lifecycle not started |
| **2** | ~5% | Stub AI only |
| **5–7** | Low | Verify cert exists; offline drafts / squads / audit trail not started |

### How to track going forward

1. Open **`ROADMAP.md`** when starting or closing work.
2. Flip task rows from ⬜ → 🟡 → ✅ (and bump **Last updated**).
3. Keep detailed specs in **`missing`**; use **`ROADMAP.md`** only for delivery state.
4. Use sprint checkboxes at the bottom for active work.

**Suggested next sprint** (also listed in the doc): finish Phase 0 design tokens + forms, certificate variants, then Phase 1.1 OTP spike.

If you want this wired into GitHub Issues or a project board template next, say which tool you use (GitHub Projects, Linear, etc.).

---

**User**

start implementation and track progeress 

---

**Cursor**

Starting Phase 0 sprint items from the roadmap and updating progress as we go.


Implementation sprint is done and progress is tracked in **`ROADMAP.md`**.

## Sprint completed

| Item | What shipped |
|------|----------------|
| **0.3.1** Design tokens | Spacing/shadows, `page-shell`, 1280px container in `index.css` / `tailwind.config` |
| **0.3.6** Forms | Post issue drag-and-drop photo + inline field validation |
| **0.4.5** Certificates | Rank/hours-based PDF titles via `certificateAchievementTitle()` |
| **1.1** OTP (mock) | `otpService` + `/api/auth/otp/*` routes, `VerifyPhoneBanner` in `RoleLayout`, adopt-a-spot gate when `REQUIRE_PHONE_VERIFY=true` |

## Progress (from `ROADMAP.md`)

- **Phase 0:** ~55% → **~68%**
- **Phase 1:** ~15% → **~25%** (OTP mock started)
- Sprint checkboxes marked done; next items listed (stat trends, upvote animation, verified badge on cards, LLM triage spike)

## Config

Added to `backend/.env.example`:

```env
MOCK_OTP=true
# REQUIRE_PHONE_VERIFY=true
```

## Builds

Backend `tsc` and frontend `vite build` both exit **0**.

## How to try OTP locally

1. Restart backend with `MOCK_OTP=true` in `.env`.
2. Log in as a citizen → yellow **Verify phone** banner in the app shell.
3. Enter phone → **Send code** → use the dev code from the toast or server console (`[otp:mock] …`).
4. Optional: set `REQUIRE_PHONE_VERIFY=true` and confirm adopt-a-spot is blocked until verified.

## Suggested next sprint

1. Verified checkmark on profile/issue cards (1.2)
2. Mayor scorecard stat cards with trends (0.3.4)
3. Upvote micro-animation (0.3.10)
4. Certificate mayor signature block (0.4 remainder)

Full tables and checklists live in [`ROADMAP.md`](d:\project\CivicSync\ROADMAP.md). Say which next item you want prioritized.

---

**User**

proceed

---

**Cursor**

Continuing the next sprint: reviewing the roadmap and exploring the codebase for the planned items.


Implementing sprint 3 items: reporter verification on issues, scorecard summary, upvote animation, and certificate mayor signature.


Sprint 3 is done. Progress is updated in **`ROADMAP.md`** (Phase 0 ~74%, Phase 1 ~35%).

## Shipped

### 1.2 Verified citizen tier
- Issues API now includes `reporterName` and `reporterPhoneVerified` (batch user lookup).
- **`VerifiedCitizenBadge`** on profile name, issue cards, and issue detail.
- Seed sets `phoneVerified` for Gurpreet, city guardians, and every third demo citizen.

### 0.3.4 Mayor scorecard KPIs
- `/api/mayor/scorecard` returns `{ summary, departments }`.
- Top row: open issues, resolved (30d) with % trend, avg SLA with point trend, SLA breaches + red alerts.
- **`MayorTasks`** and **`IssueDetail`** updated for the new API shape.

### 0.3.10 Upvote animation
- `animate-upvote-bounce` on the issue detail upvote button when you upvote.

### 0.4.7 Certificate mayor signature
- PDF includes mayor name from DB (e.g. “Mayor Bhullar”) plus “Municipal Mayor · Government of Punjab”.

## Try it

1. Restart backend.
2. Re-seed if you want verified reporters on issues: `npm run seed` in `backend`.
3. Log in as `gurpreet@demo.com` / `password123` → profile shows verified badge.
4. Open feed/issue detail → “Reported by …” with checkmark where seeded.
5. Mayor → **Dept. Scorecard** → four KPI cards at top.
6. Download certificate → mayor signature line on PDF.

## Next (from roadmap)

- Navbar avatar dropdown (0.3.2)
- Page transitions (0.3.10)
- Issue-linked certificate body (0.4.6)
- LLM triage spike (2.1)

Backend and frontend builds both pass. Say which next item you want prioritized.

---

**User**

proceed for next step

