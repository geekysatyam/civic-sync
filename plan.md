# CivicSync — Backend Implementation (MongoDB + Node/Express)

## Project Context
CivicSync is a civic tech platform with 3 roles (Citizen, Mayor, State Admin),
AI-simulated triage, gamification, real-time maps, and accountability tracking.
The frontend is already built in React/TypeScript. Your job is to:
1. Build the complete MongoDB schema + Express REST API backend
2. Wire up free third-party APIs
3. Migrate all frontend mock data into real seeded MongoDB collections
4. Connect the frontend to the real backend by replacing all dummy data
   imports and mock service calls with real API calls

---

## Tech Stack
- Runtime: Node.js with Express
- Database: MongoDB with Mongoose ODM
- Auth: JWT (access token) + refresh token stored in httpOnly cookie
- File uploads: Cloudinary (free tier) for issue photos and after-fix photos
- Maps/Geocoding: OpenStreetMap Nominatim API (completely free, no key needed)
  — use for reverse geocoding GPS coords to neighborhood/city name
- Email notifications: Resend (free tier — 3,000 emails/month)
  — use for rank-up alerts, SLA breach warnings to Mayor, audit pings
- AI Simulation: Keep all AI logic server-side in a dedicated service file
  (duplicate detector, auto-summary, cost estimator, abuse filter,
  translation labels, predictive maintenance) — no external AI API needed,
  all deterministic logic moved from frontend to backend service
- Environment: dotenv for all secrets

---

## Free APIs to Integrate

| Purpose | API | Free Tier |
|---|---|---|
| Photo storage | Cloudinary | 25GB free |
| Geocoding | OpenStreetMap Nominatim | Unlimited free |
| Email alerts | Resend | 3,000/month free |
| QR generation | qrcode npm package | Free, no API key |
| PDF certificates | pdfkit npm package | Free, no API key |

---

## Folder Structure

```
backend/
├── src/
│   ├── models/          # All Mongoose schemas
│   ├── routes/          # Express route files per domain
│   ├── controllers/     # Business logic per domain
│   ├── middleware/       # Auth guard, role guard, upload, error handler
│   ├── services/        # AI simulation, email, cloudinary, geocoding
│   ├── seed/            # Full seed script from existing mock data
│   └── index.ts         # Express app entry point
├── .env
└── package.json
```

---

## MongoDB Schemas (Mongoose)

### User
```
_id, name, email, passwordHash, role (enum: citizen | mayor | state_admin),
city, neighborhood, rank (enum: civic_scout | block_captain |
neighborhood_advocate | city_guardian), xp, karmaPoints,
specialtyBadges: [{ badgeId, earnedAt }],
superVoteUsedAt, // for monthly cooldown tracking
isTrustedReporter, // City Guardian flag
volunteerHours, solutionsImplemented, issuesPosted,
serviceHoursLog: [{ eventId, hours, date }],
adoptedSpots: [spotId],
createdAt, updatedAt
```

### Issue
```
_id, title, description, suggestedSolution, category
(enum: roads|water|parks|electricity|hazards|sanitation),
city, neighborhood, coordinates: { lat, lng },
photos: [{ url, type: enum(before|after), uploadedBy, uploadedAt }],
reportedBy (ref: User), upvotes: [userId],
status (enum: pending|under_review|acknowledged|in_progress|
community_resolved|resolved|recurred),
isRedAlert, redAlertAcknowledgedAt,
aiSummary, aiCostEstimate, aiResourceEstimate,
isTranslated, originalLanguage, translatedText,
isAbuseFlagged, abuseReviewStatus,
isDuplicate, duplicateOf (ref: Issue),
acknowledgeddAt, resolvedAt, department (ref: Department),
slaDeadline, slaBreached,
broadcasts: [{ message, sentAt, sentBy }],
communityResolution: {
  photo, submittedBy, submittedAt,
  verifiedBy, verifiedAt, status
},
ghostAudit: {
  scheduledAt, assignedTo (ref: User),
  response (enum: still_good|recurred), respondedAt
},
createdAt, updatedAt
```

### Department
```
_id, name, city, category, avgResolutionDays,
slaCompliance, openIssues, resolvedIssues
```

### Poll (Nukkad)
```
_id, question, options: [{ text, votes: [userId] }],
createdBy (ref: User), city, neighborhood,
coordinates: { lat, lng }, radiusMeters,
expiresAt, isActive, createdAt
```

### VolunteerDrive
```
_id, issueId (ref: Issue), title, city, neighborhood,
scheduledDate, items: [{ name, quantityNeeded, pledges: [userId] }],
volunteers: [{ userId, pledgedAt }],
status (enum: open|scheduled|completed),
isProBono, tradesPerson (ref: User), createdAt
```

### AdoptedSpot
```
_id, name, coordinates: { lat, lng }, city, neighborhood,
adoptedBy (ref: User | RWA name string),
committedSince, lastCleanedAt, recognitionBadgeAwarded
```

### KarmaReward
```
_id, title, businessName, city, discountPercent,
karmaCost, description, isActive
```

### CSRProject
```
_id, issueId (ref: Issue), title, city, upvoteCount,
governmentDeclinedAt, status (enum: pending|forwarded|sponsored|funded),
sponsoredBy (ref: Business name string), forwardedAt, createdAt
```

### GhostAudit
```
_id, issueId (ref: Issue), scheduledAt,
assignedTo (ref: User), status (enum: pending|passed|recurred),
respondedAt, createdAt
```

### Notification
```
_id, userId (ref: User), type
(enum: fix_confirmed|sla_breach|broadcast|volunteer_reminder|
rank_up|audit_ping|community_resolution|super_vote_reset),
title, message, isRead, metadata: {}, createdAt
```

### StoryArticle
```
_id, headline, city, coverImageUrl, shortDescription,
fullContent, citizenQuotes: [{ name, quote }],
outcomeStats: { issuesFixed, volunteersInvolved, daysToResolve },
publishedAt, createdAt
```

---

## REST API Routes

### Auth — /api/auth
```
POST /register        — create citizen account
POST /login           — returns JWT + sets refresh cookie
POST /logout          — clears cookie
POST /refresh         — issues new access token
GET  /me              — returns current user profile
```

### Issues — /api/issues
```
GET    /              — paginated, filtered by city/neighborhood/
                        category/status (citizen feed)
POST   /              — create issue (auth, citizen only)
                        triggers: AI triage, duplicate check,
                        abuse filter, geocoding, Cloudinary upload
GET    /:id           — full issue detail
PATCH  /:id/upvote    — toggle upvote (auth)
PATCH  /:id/acknowledge     — Mayor only, starts accountability clock
PATCH  /:id/status          — Mayor only, update status
POST   /:id/photo           — Mayor only, upload after photo
                              (Cloudinary), marks resolved
POST   /:id/broadcast       — Mayor only, send broadcast to upvoters
                              triggers Resend email to all upvoters
POST   /:id/community-resolve — Citizen only (original poster),
                              upload photo + request verification
PATCH  /:id/verify-resolve  — Advocate/Guardian only, approve or reject
POST   /:id/flag-fake       — Advocate/Guardian only
POST   /:id/ghost-response  — City Guardian only, audit response
```

### Users — /api/users
```
GET  /profile              — own profile with rank, badges, karma
PATCH /profile             — update name, neighborhood
GET  /leaderboard          — top citizens by city/month
GET  /:id/certificates     — generate PDF service certificate (pdfkit)
```

### Polls — /api/polls
```
GET    /              — active polls by location
POST   /              — create poll (auth citizen)
POST   /:id/vote      — cast vote
GET    /archived      — expired polls with results
```

### Volunteer — /api/volunteer
```
GET    /drives             — active drives by city
POST   /drives             — create drive (linked to issue)
POST   /drives/:id/pledge  — pledge time or item
POST   /qr/generate        — generate QR code (qrcode package)
POST   /qr/scan            — log service hours from QR scan
GET    /spots              — adoptable spots by city
POST   /spots/:id/adopt    — adopt a spot (auth citizen)
```

### Karma — /api/karma
```
GET  /rewards         — list active rewards by city
POST /redeem/:id      — redeem reward (checks karma balance)
```

### Mayor — /api/mayor
```
GET  /tasks           — all city issues with filters
GET  /heatmap         — issue density by neighborhood
GET  /scorecard       — department performance metrics
GET  /predictive      — AI predictive maintenance alerts
GET  /sla-alerts      — breached SLA issues
POST /reverse-pitch   — create ward poll
GET  /csr             — declined high-upvote projects
POST /csr/:id/forward — forward to business dashboard
GET  /ghost-log       — Ghost Inspector audit log
```

### State — /api/state
```
GET  /heatmap         — city-level issue density across Punjab
GET  /leaderboard     — city comparison by resolution + satisfaction
GET  /trends          — AI macro insight cards
GET  /emergency-feed  — all active Red Alerts from all cities
POST /ping-mayor/:city — escalate to city mayor
```

### Notifications — /api/notifications
```
GET   /               — all notifications for current user
PATCH /:id/read       — mark as read
PATCH /read-all       — mark all as read
```

---

## Background Jobs / Scheduled Tasks
Use node-cron for all scheduled jobs:

```
Every hour:
  - Check all acknowledged issues for SLA breach
  - If breached: update slaBreached flag, create notification
    for Mayor, send Resend email alert

Every day at midnight:
  - Check resolved issues older than 6 months
  - Assign Ghost Inspector audit to nearest City Guardian
  - Create audit_ping notification for that Guardian

Every month on 1st:
  - Reset all Block Captain superVoteUsedAt
  - Create super_vote_reset notification for all Block Captains

Every 2 hours:
  - Check Red Alert issues unacknowledged for 2+ hours
  - Flag as UNACKNOWLEDGED, surface in state emergency feed,
    create escalation notification
```

---

## AI Simulation Service (Server-Side)
Move all frontend AI logic to backend/src/services/aiService.ts:

```
generateSummary(issue): string
  — returns deterministic 3-line summary based on
    category + description keywords

estimateCost(issue): { workers, hours, materials }
  — returns estimate based on category lookup table

detectDuplicate(issue, existingIssues): Issue | null
  — checks coordinates within 50m radius + same category

checkAbuse(text): { isAbusive, reason }
  — keyword-based filter list (expandable)

getTranslationLabel(text): { isTranslated, originalLang }
  — simple script detection (Gurmukhi/Devanagari Unicode ranges)

getPredictiveAlerts(city): Alert[]
  — returns seasonal alerts based on month + historical
    dummy patterns per city/category
```

---

## Cloudinary Integration
```
POST /api/upload/image
  — accepts multipart/form-data
  — uploads to Cloudinary
  — returns { url, publicId }
  — used by: issue creation (before photo),
    Mayor after-photo upload,
    community resolution photo
```

---

## Seed Script
backend/src/seed/index.ts:
```
- Migrate ALL existing frontend mock data into MongoDB:
    * 5 cities, 6 departments
    * 50+ issues across all statuses and categories
    * Multiple users at each rank with badges
    * Active polls, volunteer drives, CSR projects
    * Ghost Inspector audits in various stages
    * SLA breaches, Red Alert emergencies
    * Story articles, leaderboard data
    * Karma rewards from local businesses
    * Predictive maintenance scenarios
- Run with: npm run seed
- Includes a reset flag: npm run seed --reset
  (drops all collections before reseeding)
```

---

## Frontend Connection (Final Step)
After all backend routes are confirmed working:

1. Create frontend/src/lib/api.ts
   — Axios instance with baseURL from .env,
     JWT interceptor, refresh token retry logic

2. Replace every mock data import and dummy service call
   in the frontend with real API calls to the backend:
   — /feed → GET /api/issues
   — /post → POST /api/issues
   — /issue/:id → GET /api/issues/:id
   — /profile → GET /api/users/profile
   — /volunteer → GET /api/volunteer/drives + spots
   — /polls → GET /api/polls
   — /karma → GET /api/karma/rewards
   — /notifications → GET /api/notifications
   — /gov/mayor/* → GET /api/mayor/*
   — /gov/state/* → GET /api/state/*

3. Keep mock data as a backup file:
   frontend/src/data/mockDataBackup.ts
   — Do NOT delete it, just stop importing it in components

4. Add loading states and error boundaries to every
   page that fetches from the API

5. Test every role flow end-to-end:
   Citizen → post issue → upvote → community resolve
   Mayor → acknowledge → broadcast → upload after photo
   State Admin → view emergency feed → ping mayor

---

## Environment Variables (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/civicsync
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
CLIENT_URL=http://localhost:5173
```

---

## Implementation Order for Cursor
1. Folder structure + package.json + tsconfig + .env setup
2. All Mongoose models
3. Middleware: auth guard, role guard, error handler,
   Cloudinary upload middleware
4. AI simulation service (migrate from frontend)
5. All route + controller files
6. node-cron background jobs
7. Seed script — migrate all mock data to MongoDB
8. Test all routes with dummy seed data
9. Create frontend api.ts Axios instance
10. Replace all frontend mock imports with real API calls
11. Add loading + error states to all pages
12. End-to-end test all 3 role flows
```

---

This gives Cursor everything it needs — schemas, routes, controllers, services, free APIs, cron jobs, seed migration, and the final frontend connection step. The mock data backup instruction ensures nothing is lost during the switchover.