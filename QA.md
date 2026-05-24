# CivicSync — QA & Verification Document

> **How to use this doc:** Work through each section top to bottom.
> Check off every item. If something fails, note it in the "Fail Notes"
> column. Do not skip sections — agents commonly forget cross-role
> interactions and edge cases buried in the middle sections.

---

## 0. Pre-Flight Checks (Do These First)

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 0.1 | App loads at `http://localhost:5173` with no console errors | | |
| 0.2 | MongoDB is connected (check backend logs on startup) | | |
| 0.3 | `.env` has all 6 required keys (MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLOUDINARY_*, RESEND_API_KEY) | | |
| 0.4 | Seed script ran successfully (`npm run seed`) — no errors | | |
| 0.5 | All 3 dummy accounts exist in DB (citizen / mayor / state_admin) | | |
| 0.6 | `mockDataBackup.ts` exists in frontend and is NOT imported anywhere | | |
| 0.7 | No hardcoded dummy arrays remain in any component file | | |
| 0.8 | App is responsive — test at 375px (mobile) and 1440px (desktop) | | |

---

## 1. Public Homepage (/)

> **Commonly forgotten:** Scroll animations only fire once (not on every scroll),
> story modals close on Escape key, CTA buttons route correctly without auth.

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 1.1 | Hero section renders CivicSync branding + tagline | | |
| 1.2 | "Report an Issue" CTA routes to `/login` or `/signup` | | |
| 1.3 | "See What's Being Fixed" CTA smooth-scrolls to Live City Pulse section | | |
| 1.4 | Hero background animation runs without freezing or layout shift | | |
| 1.5 | Live City Pulse shows 4–5 resolved issue cards | | |
| 1.6 | Before/After toggle on each pulse card works (photo switches) | | |
| 1.7 | City name, category badge, upvote count, resolution time visible on cards | | |
| 1.8 | "Join to report" CTA below pulse cards routes to signup | | |
| 1.9 | How It Works — all 3 steps render with icons | | |
| 1.10 | Impact Stats — animated counters trigger on scroll (not on page load) | | |
| 1.11 | Impact Stats — counters count UP to the correct values (1240, 5, 3800, 94%) | | |
| 1.12 | Impact Stats — counters do NOT restart if you scroll past and back | | |
| 1.13 | Success Stories — 3–4 cards render with headline, city tag, description | | |
| 1.14 | "Read More" opens a modal (not a new page) with full story content | | |
| 1.15 | Story modal closes on clicking X button | | |
| 1.16 | Story modal closes on pressing Escape key | | |
| 1.17 | Story modal closes on clicking backdrop outside modal | | |
| 1.18 | Leaderboard teaser shows top 5 citizens with rank badge + karma | | |
| 1.19 | "See Full Leaderboard" prompts a login modal (not a redirect) | | |
| 1.20 | For Government section renders 3 value prop cards + CTA | | |
| 1.21 | "Register Your Municipality" routes to `/login` with Mayor role pre-selected | | |
| 1.22 | Footer renders all 4 link columns + social icons + tagline | | |
| 1.23 | No authenticated data is required for any homepage section to render | | |

---

## 2. Authentication & Routing

> **Commonly forgotten:** Refresh token flow, role pre-selection on login,
> redirect after login goes to the correct dashboard per role.

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 2.1 | Login page shows role selector (Citizen / Mayor / State Admin) | | |
| 2.2 | Dummy accounts listed/pre-filled for quick demo login | | |
| 2.3 | Citizen login → redirects to `/feed` | | |
| 2.4 | Mayor login → redirects to `/gov/mayor` | | |
| 2.5 | State Admin login → redirects to `/gov/state` | | |
| 2.6 | Visiting `/gov/mayor` while logged in as Citizen → redirected away | | |
| 2.7 | Visiting `/gov/state` while logged in as Mayor → redirected away | | |
| 2.8 | Visiting `/feed` while not logged in → redirected to `/login` | | |
| 2.9 | JWT access token stored correctly (not in localStorage — use memory or httpOnly cookie) | | |
| 2.10 | Refresh token refreshes the session without forcing re-login | | |
| 2.11 | Logout clears token and redirects to homepage | | |
| 2.12 | Sidebar nav shows only role-appropriate links | | |
| 2.13 | Mobile bottom nav shows on screens < 768px for Citizen | | |

---

## 3. Citizen — Feed (/feed)

> **Commonly forgotten:** Translation label on translated posts,
> "Under Review" badge on flagged posts, feed only shows issues
> from citizen's own neighborhood/city.

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 3.1 | Feed shows only issues from logged-in citizen's city/neighborhood | | |
| 3.2 | Filter tabs work: All / Roads / Water / Parks / Electricity / Hazards | | |
| 3.3 | Each card shows: photo, AI summary, upvote count, status badge, timer | | |
| 3.4 | "Auto-translated from Punjabi/Hindi" label appears on translated posts | | |
| 3.5 | "Under Review" badge appears on abuse-flagged posts | | |
| 3.6 | Accountability timer is visible on Acknowledged/In-Progress issues | | |
| 3.7 | Before/After toggle appears on Resolved issues | | |
| 3.8 | Floating "+" post button is visible and routes to `/post` | | |
| 3.9 | Clicking an issue card routes to `/issue/:id` | | |
| 3.10 | Feed does not show duplicate bundled issues (duplicates are hidden) | | |
| 3.11 | Red Alert issues show pulsing red border on their card | | |

---

## 4. Citizen — Post Issue (/post)

> **Commonly forgotten:** Mandatory solution field actually blocks submission,
> abuse filter runs on submit and shows result label,
> Red Alert toggle visually changes the form state.

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 4.1 | Photo upload works (accepts image files) | | |
| 4.2 | Leaflet map shows GPS pin preview after photo/location is set | | |
| 4.3 | Category picker has all 6 options | | |
| 4.4 | Problem description field is present | | |
| 4.5 | Suggested Solution field is present and MANDATORY | | |
| 4.6 | Form cannot be submitted without filling in the solution field | | |
| 4.7 | Error message shown if solution field is empty on submit attempt | | |
| 4.8 | Red Alert toggle is present and visually changes form (e.g., red border) | | |
| 4.9 | On submit: abuse filter runs and shows "Content reviewed — no violations found" | | |
| 4.10 | If abuse is detected: post is held with "Under Review" status | | |
| 4.11 | AI auto-summary is generated and saved with the issue | | |
| 4.12 | AI cost estimate is generated and saved with the issue | | |
| 4.13 | Duplicate detection runs — if duplicate found, issue is bundled silently | | |
| 4.14 | Translation label is attached if Punjabi/Gurmukhi or Hindi/Devanagari detected | | |
| 4.15 | Red Alert issue bypasses 48hr queue and appears immediately on Mayor task panel | | |
| 4.16 | Red Alert issue appears in State Emergency Override Feed | | |
| 4.17 | City Guardian's posts bypass 48hr queue automatically (test with Guardian account) | | |
| 4.18 | New issue appears in feed after successful submission | | |

---

## 5. Citizen — Issue Detail (/issue/:id)

> **Commonly forgotten:** Flag-as-fake-fix visibility is rank-gated,
> community resolution button only shows for original poster,
> broadcast feed shows timestamped government messages.

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 5.1 | Full photo renders | | |
| 5.2 | Map pin shows correct location | | |
| 5.3 | AI 3-line summary displayed | | |
| 5.4 | "Auto-translated from Punjabi/Hindi" label shows if applicable | | |
| 5.5 | AI cost & resource estimate displayed ("2 workers, 4 hrs, 10m of pipe") | | |
| 5.6 | Upvote button works and count updates | | |
| 5.7 | Accountability clock is visible and counting down on Acknowledged issues | | |
| 5.8 | Government broadcast feed shows Mayor's messages with timestamps | | |
| 5.9 | Sweat & Tools pledge section visible (items needed + pledge buttons) | | |
| 5.10 | Before/After viewer shows on Resolved issues (swipe or toggle) | | |
| 5.11 | "Flag as fake fix" button is HIDDEN for Civic Scout and Block Captain | | |
| 5.12 | "Flag as fake fix" button is VISIBLE for Neighborhood Advocate and City Guardian | | |
| 5.13 | "Mark as Community Fixed" button is ONLY visible to original poster | | |
| 5.14 | Community resolution flow: citizen uploads photo → verification request created | | |
| 5.15 | Comments section renders and new comment can be submitted | | |

---

## 6. Citizen — Profile (/profile)

> **Commonly forgotten:** Super-Vote button has a cooldown timer,
> City Guardian shows "Trusted Reporter" badge,
> all 6 specialty badges must appear (locked or unlocked).

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 6.1 | Avatar, name, neighborhood shown | | |
| 6.2 | Correct rank badge displayed | | |
| 6.3 | XP progress bar fills toward next rank | | |
| 6.4 | All 6 specialty badges in grid: Pothole Patrol, Green Guardian, Water Warrior, First Responder, Peacemaker, Community Builder | | |
| 6.5 | Locked badges visually distinct from unlocked badges | | |
| 6.6 | Karma Points counter shown | | |
| 6.7 | "Redeem Perks" button routes to `/karma` | | |
| 6.8 | Stats shown: Issues Posted, Solutions Implemented, Volunteer Hours | | |
| 6.9 | Before/After gallery shows resolved issues reported by this citizen | | |
| 6.10 | Service certificate download button works (generates PDF) | | |
| 6.11 | Block Captain account shows Super-Vote button with monthly cooldown timer | | |
| 6.12 | City Guardian account shows "Trusted Reporter" badge on profile | | |
| 6.13 | Neighborhood Advocate account shows "Community Verifier" label | | |

---

## 7. Gamification — Rank Privilege Enforcement

> **This entire section is commonly skipped by agents.**
> Each rank privilege must be functionally enforced, not just displayed.

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 7.1 | Civic Scout CANNOT flag fake fix photos | | |
| 7.2 | Civic Scout CANNOT approve community resolutions | | |
| 7.3 | Block Captain Super-Vote button pushes issue to top of feed | | |
| 7.4 | Block Captain Super-Vote can only be used ONCE per month | | |
| 7.5 | Block Captain Super-Vote cooldown timer resets on 1st of month | | |
| 7.6 | Neighborhood Advocate CAN flag fake fix photos | | |
| 7.7 | Neighborhood Advocate CAN approve/reject community resolution requests | | |
| 7.8 | City Guardian posts bypass 48hr queue automatically | | |
| 7.9 | City Guardian receives Ghost Inspector audit pings | | |
| 7.10 | City Guardian CAN flag fake fix photos | | |
| 7.11 | Peacemaker badge unlocks when user's solutions are consistently top-voted | | |
| 7.12 | Community Builder badge unlocks when Pro-Bono Local completes a free fix | | |
| 7.13 | XP is awarded after issue is marked resolved (to original poster) | | |
| 7.14 | Karma points awarded after community resolution is approved | | |
| 7.15 | Monthly leaderboard updates correctly | | |

---

## 8. Volunteer Hub (/volunteer)

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 8.1 | Active Sweat & Tools drives listed with item checklists | | |
| 8.2 | Each drive shows items needed vs items pledged | | |
| 8.3 | "Pledge Time" and "Pledge Tools" buttons work | | |
| 8.4 | When all items are fulfilled, AI schedules a cleanup date | | |
| 8.5 | All pledgers receive a confirmation notification on scheduling | | |
| 8.6 | Adopt-a-Spot Leaflet map renders with available spots | | |
| 8.7 | Claiming an Adopt-a-Spot saves to user profile | | |
| 8.8 | Pro-Bono Local section shows tradespeople listings | | |
| 8.9 | Student QR scanner UI is present | | |
| 8.10 | Scanning/entering a QR code logs hours to student's profile | | |
| 8.11 | Service certificate PDF can be downloaded from profile | | |

---

## 9. Nukkad Polls (/polls)

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 9.1 | Active polls show with 24hr countdown timer | | |
| 9.2 | Live vote percentages update when a vote is cast | | |
| 9.3 | A citizen cannot vote twice on the same poll | | |
| 9.4 | "Create a Poll" form is present | | |
| 9.5 | Poll is auto-geofenced to 500m radius on creation | | |
| 9.6 | Expired polls move to archived section with final results | | |
| 9.7 | Expired polls no longer accept votes | | |

---

## 10. Karma Redemption (/karma)

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 10.1 | Partner businesses listed with discount offers | | |
| 10.2 | Karma point cost shown per reward | | |
| 10.3 | Redeem button opens confirmation modal | | |
| 10.4 | Redemption deducts correct karma points from user balance | | |
| 10.5 | Cannot redeem if insufficient karma points (error shown) | | |

---

## 11. Notifications (/notifications)

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 11.1 | Fix confirmed notification shows with Before/After photos | | |
| 11.2 | SLA breach alert notification appears | | |
| 11.3 | Government broadcast update notification appears | | |
| 11.4 | Volunteer drive reminder notification appears | | |
| 11.5 | Ghost Inspector audit ping notification appears (City Guardian only) | | |
| 11.6 | Rank-up notification triggers confetti animation | | |
| 11.7 | Community resolution verification request appears for Advocates/Guardians | | |
| 11.8 | Super-Vote cooldown reset notification appears for Block Captains on 1st | | |
| 11.9 | Notifications can be marked as read individually | | |
| 11.10 | "Mark all as read" button works | | |

---

## 12. Mayor Dashboard (/gov/mayor)

> **Commonly forgotten:** Broadcast sender actually creates notifications
> for all upvoters, photo upload is mandatory to mark resolved,
> Predictive Maintenance is distinct from Trend Analysis.

### Tab 1 — Task Management
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 12.1 | All city issues listed in table | | |
| 12.2 | Status dropdown updates issue status in DB | | |
| 12.3 | Department assignment works | | |
| 12.4 | "Upload After Photo" button requires a photo before resolving | | |
| 12.5 | Issue status changes to Resolved ONLY after photo is uploaded | | |
| 12.6 | Broadcast sender dropdown shows all templates | | |
| 12.7 | Sending broadcast creates notifications for ALL upvoters of that issue | | |
| 12.8 | Broadcast message appears in issue detail broadcast feed | | |
| 12.9 | Bulk assign to department works | | |
| 12.10 | Red Alert issues show pulsing red row in task table | | |
| 12.11 | "Acknowledge" button starts the accountability clock | | |

### Tab 2 — City Heatmap
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 12.12 | Leaflet map renders for Mayor's specific city | | |
| 12.13 | Color intensity overlay shows complaint density | | |
| 12.14 | Clicking a neighborhood filters to that area's issues | | |

### Tab 3 — Department Scorecard
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 12.15 | Recharts bar chart renders all 6 departments | | |
| 12.16 | Avg resolution time shown per department | | |
| 12.17 | SLA compliance % shown per department | | |

### Tab 4 — Predictive Maintenance
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 12.18 | Seasonal AI alert cards render (city-specific, not state-level) | | |
| 12.19 | Cards are filterable by neighborhood and category | | |
| 12.20 | "Schedule Preventive Task" button works per card | | |
| 12.21 | Predictive alerts are DIFFERENT from state Trend Analysis cards | | |

### Tab 5 — SLA Alerts
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 12.22 | Breached SLA issues listed in red | | |
| 12.23 | Days overdue and assigned department shown | | |
| 12.24 | "Escalate" button increases issue priority | | |

### Tab 6 — Reverse Pitch / CSR / Ghost Inspector
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 12.25 | Reverse Pitch poll creator form works (select ward, write proposal) | | |
| 12.26 | Created ward poll is visible to citizens in that ward | | |
| 12.27 | CSR Matchmaker shows high-upvote government-declined projects | | |
| 12.28 | "Forward Pitch to Business" button updates sponsorship status | | |
| 12.29 | Ghost Inspector audit log shows resolved issues past 6 months | | |
| 12.30 | Audit status shows: Pending / Passed / Recurred | | |
| 12.31 | RECURRED issues auto-reopen in the main issue feed | | |

---

## 13. State Dashboard (/gov/state)

> **Commonly forgotten:** Emergency feed shows ALL cities not just one,
> "Ping Mayor" must send an actual notification to Mayor account,
> City Leaderboard uses BOTH resolution time AND satisfaction score.

### Panel 1 — State Heatmap
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 13.1 | Punjab macro map renders with all 5 cities | | |
| 13.2 | City hotspot density shown as color intensity | | |
| 13.3 | Clicking a city drills into that city's issue data | | |

### Panel 2 — City Leaderboard
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 13.4 | Recharts bar chart shows all 5 cities | | |
| 13.5 | Ranking uses BOTH avg resolution time AND citizen satisfaction score | | |
| 13.6 | Color coded: green (best) to red (worst) | | |

### Panel 3 — Trend Analysis
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 13.7 | AI macro insight cards render | | |
| 13.8 | Cards are filterable by category, city, and time period | | |
| 13.9 | Cards are STATE-LEVEL insights (not city-specific — that's Predictive Maintenance) | | |

### Panel 4 — Emergency Override Feed
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 13.10 | Red Alert issues from ALL 5 cities appear in feed | | |
| 13.11 | City, issue type, time elapsed, Mayor response status shown | | |
| 13.12 | Issues unacknowledged for 2+ hours show flashing UNACKNOWLEDGED tag | | |
| 13.13 | "Ping Mayor" button sends notification to the responsible Mayor account | | |
| 13.14 | Ping Mayor notification is visible in Mayor's notifications | | |

---

## 14. Cross-Cutting System Tests

> **These are the most commonly broken flows. Test each one end-to-end.**

### 14A. Full Red Alert Flow
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 14A.1 | Citizen toggles Red Alert and submits issue | | |
| 14A.2 | Issue bypasses 48hr queue — visible immediately on Mayor task table | | |
| 14A.3 | Pulsing red border on issue card in citizen feed | | |
| 14A.4 | Pulsing red row on Mayor task management table | | |
| 14A.5 | Nearest City Guardian receives notification | | |
| 14A.6 | Issue appears in State Emergency Override Feed | | |
| 14A.7 | After 2 hours unacknowledged: UNACKNOWLEDGED tag flashes on State dashboard | | |
| 14A.8 | State admin pings Mayor → Mayor receives notification | | |

### 14B. Full Accountability Clock Flow
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 14B.1 | Clock does NOT start until Mayor clicks Acknowledge | | |
| 14B.2 | Clock is visible on citizen's issue detail page after acknowledgment | | |
| 14B.3 | Clock turns orange at 75% of SLA time used | | |
| 14B.4 | Clock turns red when SLA is breached | | |
| 14B.5 | SLA breach flashes on Mayor's SLA Alerts tab | | |
| 14B.6 | Breach notification sent to Mayor | | |

### 14C. Full Community Resolution Flow
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 14C.1 | Original poster sees "Mark as Community Fixed" button | | |
| 14C.2 | Non-poster does NOT see "Mark as Community Fixed" button | | |
| 14C.3 | Citizen uploads photo and submits community resolution | | |
| 14C.4 | Verification request notification sent to nearest Advocate/Guardian | | |
| 14C.5 | Verifier sees approve/reject card in notifications | | |
| 14C.6 | On approval: issue status → "Community Resolved" (distinct badge) | | |
| 14C.7 | On approval: original poster earns XP and karma points | | |
| 14C.8 | On rejection: issue remains in previous status | | |

### 14D. Full Ghost Inspector Flow
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 14D.1 | Issue resolved → 6 months later audit is scheduled (test with mock date) | | |
| 14D.2 | Audit card sent to nearby City Guardian | | |
| 14D.3 | Guardian sees audit ping in notifications | | |
| 14D.4 | Guardian responds "Still Good" → audit marked Passed | | |
| 14D.5 | Guardian responds "Broke Again" → issue auto-reopens with RECURRED tag | | |
| 14D.6 | RECURRED issue visible on Mayor Ghost Inspector log | | |

### 14E. AI Triage Flow
| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 14E.1 | Two issues posted at same location + same category → bundled | | |
| 14E.2 | Duplicate issue is hidden from feed | | |
| 14E.3 | Upvotes from duplicate are merged into original | | |
| 14E.4 | AI summary appears on issue within seconds of posting | | |
| 14E.5 | Cost estimate appears on issue within seconds of posting | | |
| 14E.6 | Punjabi/Gurmukhi text → translation label attached | | |
| 14E.7 | Hindi/Devanagari text → translation label attached | | |
| 14E.8 | Government dashboard views show English version | | |
| 14E.9 | Citizen feed shows original language | | |
| 14E.10 | Abusive post → held as "Under Review", not live | | |
| 14E.11 | Predictive maintenance alerts are month-aware (correct season) | | |

---

## 15. Backend API Sanity Tests

> Run these with Postman, Thunder Client, or curl.

| # | Endpoint | Method | Expected Result |
|---|----------|--------|----------------|
| 15.1 | `/api/auth/login` | POST | Returns JWT + sets refresh cookie |
| 15.2 | `/api/auth/me` | GET (with token) | Returns current user object |
| 15.3 | `/api/auth/me` | GET (no token) | Returns 401 |
| 15.4 | `/api/issues` | GET | Returns paginated issues array |
| 15.5 | `/api/issues` | POST (citizen token) | Creates issue, returns new issue object |
| 15.6 | `/api/issues` | POST (no token) | Returns 401 |
| 15.7 | `/api/issues/:id/upvote` | PATCH | Toggles upvote, returns updated count |
| 15.8 | `/api/issues/:id/acknowledge` | PATCH (mayor token) | Starts clock, returns updated issue |
| 15.9 | `/api/issues/:id/acknowledge` | PATCH (citizen token) | Returns 403 |
| 15.10 | `/api/issues/:id/broadcast` | POST (mayor token) | Creates notifications for all upvoters |
| 15.11 | `/api/mayor/tasks` | GET (mayor token) | Returns city-filtered issues |
| 15.12 | `/api/mayor/tasks` | GET (citizen token) | Returns 403 |
| 15.13 | `/api/state/emergency-feed` | GET (state token) | Returns all Red Alert issues |
| 15.14 | `/api/state/emergency-feed` | GET (mayor token) | Returns 403 |
| 15.15 | `/api/volunteer/qr/generate` | POST | Returns QR code data/image |
| 15.16 | `/api/users/profile` | GET (citizen token) | Returns profile with rank, badges, karma |
| 15.17 | `/api/karma/redeem/:id` | POST (insufficient karma) | Returns 400 with error message |
| 15.18 | `/api/notifications` | GET | Returns only current user's notifications |
| 15.19 | `/api/upload/image` | POST (multipart) | Returns Cloudinary URL |
| 15.20 | `/api/polls/:id/vote` | POST (vote twice) | Returns 400 — already voted |

---

## 16. Things Agents Commonly Forget — Final Checklist

> Go through every item here even if you think it's done.

| # | Item | Pass/Fail | Notes |
|---|------|-----------|-------|
| 16.1 | Peacemaker badge exists in DB schema AND in frontend badge grid | | |
| 16.2 | Community Builder badge is awarded to Pro-Bono Locals, not citizens | | |
| 16.3 | "Under Review" posts are NOT visible in the public feed | | |
| 16.4 | City Guardian privilege (queue bypass) is enforced server-side, not just UI | | |
| 16.5 | Block Captain Super-Vote enforced server-side with timestamp check | | |
| 16.6 | Before/After viewer exists on BOTH issue detail AND homepage pulse cards | | |
| 16.7 | Story modal has Escape key close handler | | |
| 16.8 | Login prompt modal (for leaderboard CTA) does not redirect — it's a modal | | |
| 16.9 | "Register Your Municipality" pre-selects Mayor role on login page | | |
| 16.10 | Translation label is shown on gov dashboards — NOT on citizen feed | | |
| 16.11 | Ghost Inspector only pings City Guardians — not all users | | |
| 16.12 | Community resolution is DISTINCT from government resolution (different badge color) | | |
| 16.13 | CSR Matchmaker does NOT handle money — only forwards the pitch | | |
| 16.14 | Nukkad polls expire after 24hrs and move to archived — cannot accept new votes | | |
| 16.15 | Adopt-a-Spot commitment is monthly — tracked on profile | | |
| 16.16 | node-cron jobs are running (SLA check, Ghost Inspector scheduler, Super-Vote reset) | | |
| 16.17 | Resend email fires on SLA breach and rank-up events | | |
| 16.18 | Cloudinary upload used for issue photos AND after-fix photos | | |
| 16.19 | PDF service certificate generates correctly with student name and hours | | |
| 16.20 | QR code generation works and scan logs to the correct student profile | | |
| 16.21 | `mockDataBackup.ts` exists and is NOT imported anywhere in the app | | |
| 16.22 | Loading states shown on every page that fetches from API | | |
| 16.23 | Error boundaries catch API failures gracefully (no white screen of death) | | |
| 16.24 | App works on mobile (375px) — no horizontal overflow, nav accessible | | |
| 16.25 | All 6 cron jobs are registered and fire at correct intervals | | |

---

## 17. Seed Data Verification

| # | Check | Pass/Fail | Notes |
|---|-------|-----------|-------|
| 17.1 | 5 cities exist: Ludhiana, Amritsar, Jalandhar, Patiala, Chandigarh | | |
| 17.2 | 6 departments exist per city | | |
| 17.3 | 50+ issues exist across all statuses and categories | | |
| 17.4 | At least one issue per status: Pending, Acknowledged, In Progress, Resolved, Community Resolved, Recurred | | |
| 17.5 | At least one Red Alert issue exists per city | | |
| 17.6 | At least one SLA-breached issue exists | | |
| 17.7 | Citizens exist at all 4 ranks | | |
| 17.8 | At least one Ghost Inspector audit in each status (Pending/Passed/Recurred) | | |
| 17.9 | Active Nukkad polls exist | | |
| 17.10 | Active Sweat & Tools drives exist | | |
| 17.11 | CSR projects exist with various sponsorship statuses | | |
| 17.12 | Story articles exist for homepage | | |
| 17.13 | Karma rewards (local business perks) exist | | |
| 17.14 | `npm run seed --reset` clears and reseeds cleanly | | |

---

*Document version: 1.0 — CivicSync QA*
*Cross-reference against: civicsync.txt (original requirements),
Implementation Plan, Backend Cursor Prompt*


now do the follwoing 
in bulk seed 
seed atleast 50 - 100 users 
following cities 
Ludhiana
Amritsar
Jalandhar
Patiala
Sahibzada Ajit Singh Nagar
Bathinda
Pathankot
Hoshiarpur
Chandigarh 
all mayors 

all arrticles and everything some posted some under mod
feeds 
contractors 
And i said you to state admin can also approve article 
i want contractor status page in states 
city level user leaderboard in mayor 
and also some to state 

create this level of bulk and frontend thing 

