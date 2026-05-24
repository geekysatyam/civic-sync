# CivicSync — Public Assets Reference

Replace any file below with your own artwork. The app reads these paths directly.
Keep the same filename and size unless noted.

---

## LOGO

| File              | Size        | Format | Used in                                              |
|-------------------|-------------|--------|------------------------------------------------------|
| /public/logo.svg  | 36×36 px    | SVG    | Navbar (app + landing), Footer, Certificate page     |
| /public/logo.png  | 512×512 px  | PNG    | Optional — change LOGO_SRC in CivicSyncLogo.tsx      |

> Component: `src/components/shared/CivicSyncLogo.tsx`
> To switch to PNG: open that file and change `LOGO_SRC = '/logo.svg'` → `'/logo.png'`

---

## PWA / APP ICONS

| File                          | Size        | Format | Used in                                    |
|-------------------------------|-------------|--------|--------------------------------------------|
| /public/favicon.ico           | 32×32 px    | ICO    | Browser tab icon                           |
| /public/pwa-192.png           | 192×192 px  | PNG    | PWA home screen icon (Android)             |
| /public/pwa-512.png           | 512×512 px  | PNG    | PWA splash / OG image (Twitter/Facebook)   |
| /public/pwa-512-maskable.png  | 512×512 px  | PNG    | PWA maskable icon (safe zone = inner 80%)  |
| /public/apple-touch-icon.png  | 180×180 px  | PNG    | iOS "Add to Home Screen" icon              |

> PWA manifest is in `vite.config.ts` → `VitePWA({ manifest: { icons: [...] } })`

---

## BADGE ICONS  (optional image-based badges)

Place PNG or SVG files here: `/public/badges/<badgeId>.png`

| Filename                    | Badge ID            | Displayed on              |
|-----------------------------|---------------------|---------------------------|
| pothole_patrol.png          | pothole_patrol      | Profile, Leaderboard      |
| community_builder.png       | community_builder   | Profile                   |
| first_responder.png         | first_responder     | Profile                   |
| water_guardian.png          | water_guardian      | Profile                   |
| green_thumb.png             | green_thumb         | Profile                   |
| safety_sentinel.png         | safety_sentinel     | Profile                   |

> Currently the app uses Lucide icons as fallback. To switch to image badges,
> update `src/lib/civicLabels.ts` badgeIcon() to return `/badges/<id>.png`.

---

## AVATAR PLACEHOLDER

| File                   | Size       | Format | Used in                          |
|------------------------|------------|--------|----------------------------------|
| /public/placeholder.svg| any        | SVG    | AvatarFallback when no photo set |

---

## SUMMARY — what to replace first

1. `/public/logo.svg`              ← your brand logo (most visible)
2. `/public/favicon.ico`           ← browser tab
3. `/public/pwa-192.png`           ← Android home screen
4. `/public/pwa-512.png`           ← splash + social share image
5. `/public/pwa-512-maskable.png`  ← maskable PWA icon
6. `/public/apple-touch-icon.png`  ← iOS home screen
7. `/public/badges/*.png`          ← optional custom badge artwork
