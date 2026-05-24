# CivicSync — Image Assets Guide

Production-readiness checklist for all image slots used across the app.

---

## Where images are currently served from

| Source | Path | Notes |
|--------|------|-------|
| Static frontend | `frontend/public/` | Served at `/` |
| Backend uploads | Cloudinary (configured via `CLOUDINARY_*` env vars) | Issue photos, avatars |
| Placeholders | `/placeholder.svg` | Fallback everywhere |

---

## Required image assets (place in `/frontend/public/`)

### Branding

| File | Dimensions | Usage | Notes |
|------|-----------|-------|-------|
| `logo.svg` | 40×40 | Navbar brand icon; replaces the `<Flag>` icon | Use a flag or civic logo |
| `logo-full.svg` | 160×40 | Login / landing page full wordmark | Horizontal lockup |
| `favicon.ico` | 32×32 + 16×16 | Browser tab icon | Multi-size `.ico` or `favicon.svg` |
| `og-image.png` | 1200×630 | Open Graph meta tag share preview | Used in `<meta property="og:image">` |
| `apple-touch-icon.png` | 180×180 | iOS homescreen icon | Required for PWA / iOS Safari |
| `pwa-192.png` | 192×192 | PWA manifest icon | Add to `manifest.webmanifest` |
| `pwa-512.png` | 512×512 | PWA manifest icon (maskable) | Add to `manifest.webmanifest` |

### Verified / Trust Badges

| File | Dimensions | Usage | Notes |
|------|-----------|-------|-------|
| `verified-badge.svg` | 20×20 | Shown on verified-phone citizens (`☑` in feed) | Blue checkmark recommended |
| `city-guardian-badge.svg` | 32×32 | City Guardian rank badge on Profile | Gold shield/star |
| `neighborhood-advocate-badge.svg` | 32×32 | Neighbourhood Advocate rank badge | Silver badge |
| `block-captain-badge.svg` | 32×32 | Block Captain rank badge | Bronze badge |
| `civic-scout-badge.svg` | 32×32 | Civic Scout rank badge (entry level) | Plain badge |

### Issue / Feed UI

| File | Dimensions | Usage | Notes |
|------|-----------|-------|-------|
| `issue-placeholder.jpg` | 800×600 | Default when no photo uploaded | Generic city street photo |
| `map-pin-roads.svg` | 24×24 | Category map pin — Roads | Red |
| `map-pin-water.svg` | 24×24 | Category map pin — Water | Blue |
| `map-pin-electricity.svg` | 24×24 | Category map pin — Electricity | Yellow |
| `map-pin-sanitation.svg` | 24×24 | Category map pin — Sanitation | Green |
| `map-pin-parks.svg` | 24×24 | Category map pin — Parks | Teal |
| `map-pin-public-safety.svg` | 24×24 | Category map pin — Public Safety | Orange |

### Volunteer Hub

| File | Dimensions | Usage | Notes |
|------|-----------|-------|-------|
| `volunteer-hero.jpg` | 1200×400 | Optional banner at top of Volunteer Hub | Community cleanup photo |
| `qr-scan-instructions.png` | 400×300 | Shown next to Student QR section explaining how to scan | Screenshot or diagram |

### Landing / Index Page

| File | Dimensions | Usage | Notes |
|------|-----------|-------|-------|
| `hero-city.jpg` | 1440×600 | Landing page hero background | Aerial Punjab city photo |
| `story-ludhiana.jpg` | 800×450 | Story card — Ludhiana pothole story | Replaces `/placeholder.svg` in `StoryArticle` |
| `story-amritsar.jpg` | 800×450 | Story card — Amritsar drain story | |
| `story-patiala.jpg` | 800×450 | Story card — Patiala student drives | |
| `story-gurpreet.jpg` | 800×450 | Story card — Meet Gurpreet | Portrait or city scene |

### Karma / Rewards

| File | Dimensions | Usage | Notes |
|------|-----------|-------|-------|
| `karma-reward-placeholder.jpg` | 400×300 | Default reward image when no photo set | Local business / café photo |

### Certificates

| File | Dimensions | Usage | Notes |
|------|-----------|-------|-------|
| `certificate-logo.png` | 200×80 | Watermark on generated PDF certificates | Official CivicSync seal |
| `certificate-bg.jpg` | 1240×874 | A4 certificate background texture | Subtle pattern / parchment |

### Government / Mayor

| File | Dimensions | Usage | Notes |
|------|-----------|-------|-------|
| `mayor-avatar-placeholder.jpg` | 200×200 | Default mayor profile photo | Professional headshot silhouette |
| `govt-seal.svg` | 80×80 | Shown on official broadcasts & SLA alerts | Punjab government seal style |

---

## How to replace placeholder.svg throughout the app

1. Place your images in `frontend/public/` at the paths listed above.
2. Search for `/placeholder.svg` in the codebase:
   ```
   grep -r "placeholder.svg" frontend/src/
   ```
3. In `StoryArticle` seed (`adminSeed.ts`), update `coverImageUrl` fields to point to the real images, e.g. `'/story-ludhiana.jpg'`.
4. For issue photos: images are uploaded via Cloudinary when a citizen posts an issue (`/api/upload`). Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `backend/.env`.

---

## Environment variables for media

```env
# backend/.env

# Cloudinary (issue photo uploads + avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: max file size for uploads (default 10mb set in index.ts)
```

---

## PWA manifest update

After adding `pwa-192.png` and `pwa-512.png`, update `frontend/public/manifest.webmanifest`:

```json
{
  "name": "CivicSync",
  "short_name": "CivicSync",
  "theme_color": "#0070f3",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/pwa-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/pwa-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## Quick checklist for production launch

- [ ] Replace all `/placeholder.svg` with real images
- [ ] Upload logo assets, configure `favicon.ico`
- [ ] Add OG image for social sharing
- [ ] Configure Cloudinary env vars (issue photo uploads)
- [ ] Add PWA icons and update manifest
- [ ] Add verified-badge.svg (shown on feed cards for verified citizens)
- [ ] Add rank badge SVGs (shown on Profile page)
- [ ] Add certificate logo/background for PDF export
