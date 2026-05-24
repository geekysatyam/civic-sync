# CivicSync — Seeded Credentials & Feature Reference

> **Local / staging use only.** Do not use these in production.

---

## Seed commands

Run from `backend/`:

| Command | What it does |
|---------|-------------|
| `npm run seed` | Full reset → admin seed → bulk seed |
| `npm run seed:admin` | Mayors, state/platform admin, departments, stories, adopted spots |
| `npm run seed:user` | Citizens, contractors, dept heads, issues, articles, polls, drives, karma rewards, CSR projects, ghost audits, comments _(requires admin seed first)_ |
| `npm run seed -- --reset` | Wipe DB then re-run full seed |

**Universal password** (all seeded accounts): **`password123`**

---

## Seeded cities (9 — Punjab)

| City | Slug (for email / URL) |
|------|------------------------|
| Ludhiana | `ludhiana` |
| Amritsar | `amritsar` |
| Jalandhar | `jalandhar` |
| Patiala | `patiala` |
| Sahibzada Ajit Singh Nagar | `sahibzadaajitsinghnagar` |
| Bathinda | `bathinda` |
| Pathankot | `pathankot` |
| Hoshiarpur | `hoshiarpur` |
| Chandigarh | `chandigarh` |

---

## Government accounts

Created by: `adminSeed.ts`

| Role | Email | City | Access |
|------|-------|------|--------|
| **Mayor** (primary) | `mayor@ludhiana.gov` | Ludhiana | Full mayor dashboard |
| **Mayor** (other cities) | `mayor.<slug>@civicsync.demo` | per city | e.g. `mayor.amritsar@civicsync.demo` |
| **State Admin** | `state@punjab.gov` | Chandigarh | All-city heatmap, leaderboards, contractor status, article moderation, trends, emergency |
| **Platform Admin** | `admin@civicsync.gov` | Chandigarh | Article moderation |

**Mayor pages** (`/gov/mayor/*`):

| Page | URL | What it shows |
|------|-----|---------------|
| Task management | `/gov/mayor` | All city issues, status updates, dept assignment, broadcasts |
| City heatmap | `/gov/mayor/heatmap` | Geo heat map of open issues |
| Dept scorecard | `/gov/mayor/scorecard` | Per-dept KPIs, SLA%, 6-month trend chart |
| Predictive | `/gov/mayor/predictive` | AI-predicted maintenance alerts |
| SLA alerts | `/gov/mayor/sla` | Issues approaching or past SLA deadline |
| CSR & Audits | `/gov/mayor/csr` | Government-declined issues forwarded to corporate sponsors |
| Contractors | `/gov/mayor/contractors` | Create/list contractors, assign to issues |
| Dept. Heads | `/gov/mayor/dept-heads` | Create/list department head accounts |
| City leaderboard | `/gov/mayor/leaderboard` | Top karma citizens in the mayor's city |

**State Admin pages** (`/gov/state/*`):

| Page | URL | What it shows |
|------|-----|---------------|
| State heatmap | `/gov/state` | All-city issue density |
| City leaderboard | `/gov/state/leaderboard` | Resolution stats per city |
| Top citizens | `/gov/state/citizens` | Statewide citizen karma ranking |
| Contractor status | `/gov/state/contractors` | Work progress per contractor per city |
| Article moderation | `/gov/state/moderation` | Approve / reject articles from state |
| Trend analysis | `/gov/state/trends` | Multi-city resolution trends |
| Emergency override | `/gov/state/emergency` | Ping mayors, declare city emergencies |

---

## Bulk seeded accounts

Created by: `bulkSeed.ts`

### Citizens (~70)

| Pattern | Example | Notes |
|---------|---------|-------|
| Demo guardian | `gurpreet@demo.com` | Ludhiana, `city_guardian` rank, verified, all badges |
| Generated | `citizen.<slug>.<n>@civicsync.demo` | e.g. `citizen.ludhiana.2@civicsync.demo` |

Ranks spread across citizens per city: `civic_scout` → `block_captain` → `neighborhood_advocate` → `city_guardian`

### Contractors (18 — 2 per city)

| Pattern | Example | Category |
|---------|---------|----------|
| `contractor.<category>.<slug>@civicsync.demo` | `contractor.roads.ludhiana@civicsync.demo` | roads / water / sanitation / electricity (rotated per city) |
| `contractor.<category>.<slug>b@civicsync.demo` | `contractor.water.ludhianab@civicsync.demo` | second contractor per city |

Mayors can also create additional contractors at `/gov/mayor/contractors`.

### Department Heads (54 — 1 per city × category)

| Pattern | Example |
|---------|---------|
| `depthead.<category>.<slug>@civicsync.demo` | `depthead.roads.ludhiana@civicsync.demo` |

Categories: `roads`, `water`, `parks`, `electricity`, `sanitation`, `public_safety`

**Department Head pages** (`/dept-head/*`):

| Page | URL | What it shows |
|------|-----|---------------|
| My department | `/dept-head` | Issues filtered to own city + category; inline status updates |
| Stats | `/dept-head/stats` | Open / resolved / SLA breach counts |

---

## Seeded data summary

| Entity | Count | Notes |
|--------|-------|-------|
| Issues | ~108 | 2 per city × 6 categories; statuses vary (open, acknowledged, in_progress, resolved…); some assigned to contractors |
| Articles | ~36 | Mix of approved / pending / rejected; written by city guardians, mayors, state admin |
| Polls | 5 | First 5 cities, some active |
| Volunteer drives | 18 | 2 per city with item pledges |
| Pro-bono offers | 10 | One per city |
| Karma rewards | 21 | 2-3 per city, all 9 cities |
| CSR projects | ~18 | 2 per city, government-declined; visible on Mayor → CSR & Audits |
| Ghost audits | ~27 | 3 per city, pending; assigned to each city's `city_guardian` |
| Comments on issues | ~36 | Every 3rd issue gets a public comment |
| Pledges on issues | 9 | Open issues across cities |
| Story articles | 4 | Ludhiana (×2), Amritsar, Patiala; editorial stories on Index page |
| Notifications | 15 | First 15 citizens; types: fix_confirmed, rank_up, broadcast, volunteer_reminder |

---

## Public pages (no login required)

| Page | URL | Notes |
|------|-----|-------|
| Landing / Impact | `/` | Live DB stats, story articles |
| Login | `/login` | |
| Register | `/register` | |
| Issue detail | `/issue/:id` | Read-only without auth |
| Certificate verify | `/verify/:serial` | QR from certificate links here |
| **City stats** | `/city/:slug/stats` | e.g. `/city/ludhiana/stats` — live resolution stats, category chart, dept SLA table |

---

## Citizen feature reference

| Feature | How to access | Notes |
|---------|--------------|-------|
| Post issue | `/post` | GPS auto-fill, photo upload, AI summary triggers |
| Upvote | Issue detail | +karma; citizen role only |
| Comments | Issue detail | All logged-in users |
| Pledge (sweat / tools) | Issue detail | Citizens only |
| Community resolve | Issue detail | Original reporter + `neighborhood_advocate`+ rank to verify |
| Ghost audits | `/ghost-audits` | Shows pending audits assigned to this user |
| Volunteer drives | `/volunteer` | Pledge items, generate QR |
| Polls | `/polls` | Vote on active city polls |
| Karma rewards | `/karma` | Redeem karma points for local business perks |
| Profile & certificate | `/profile` | XP bar, badges, download PDF certificate, **export issues JSON** |
| Share issue | Issue detail → Share button | Uses native Web Share API; falls back to clipboard |

---

## Useful quick-start logins

| What you want to test | Email | Password |
|-----------------------|-------|----------|
| Citizen (city guardian) | `gurpreet@demo.com` | `password123` |
| Regular citizen (Amritsar) | `citizen.amritsar.1@civicsync.demo` | `password123` |
| Mayor (Ludhiana) | `mayor@ludhiana.gov` | `password123` |
| Mayor (Chandigarh) | `mayor.chandigarh@civicsync.demo` | `password123` |
| State Admin | `state@punjab.gov` | `password123` |
| Platform Admin | `admin@civicsync.gov` | `password123` |
| Contractor (roads, Ludhiana) | `contractor.roads.ludhiana@civicsync.demo` | `password123` |
| Dept Head (water, Amritsar) | `depthead.water.amritsar@civicsync.demo` | `password123` |
| Dept Head (roads, Chandigarh) | `depthead.roads.chandigarh@civicsync.demo` | `password123` |

---

## Notes

- Ghost audit actions (pass / reopen) are performed from `/ghost-audits`; the Mayor's ghost log is at `/gov/mayor/csr` (CSR + ghost log tab)
- To test the CSR flow: login as mayor → go to `/gov/mayor/csr` — seeded projects have `governmentDeclinedAt` set so they appear immediately
- Karma rewards appear at `/karma` for citizens who have karma points (all seeded citizens do)
- The translate button in Mayor Issue Panel requires `GEMINI_API_KEY` in `backend/.env`; without it, returns original text
- Articles pending moderation: log in as `admin@civicsync.gov` → `/gov/admin/moderation`
