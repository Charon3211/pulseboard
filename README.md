# Hasan's Space

Offline-first personal health and fitness dashboard built with Next.js static export.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and unlock with `coco1513`.

## Production build

```bash
npm run build
```

The static site is emitted to `out/`.

## GitHub Pages

1. Push the repository to GitHub, using `main` as the deployment branch.
2. In repository **Settings → Pages**, choose **GitHub Actions** as the source.
3. Push to `main`; `.github/workflows/deploy.yml` builds and deploys the `out/` directory.

The app uses no backend. Normalized user records are stored in `localStorage`, authentication session state is stored in `sessionStorage`, and the application shell is cached by `public/sw.js`. The client-side lock is a local convenience gate, not server-grade security. Weekly review notifications work while the app is open; background push requires a push service.

## Included program

The supplied V-Taper / small-looking-waist weekly split is bundled into the application and available offline. Workout set logging, daily habits, sleep hours, protein targets, water, profile settings, compressed profile photos, gamification levels, achievements, streaks, last-workout history, dated weight/waist measurements, and JSON backup/restore persist locally.

## Mobile installation

On iPhone Safari, open the deployed site, tap **Share**, then choose **Add to Home Screen**. The app uses a standalone PWA manifest, safe-area layout, icon metadata, and a service worker so the application shell remains available offline. Weather is optional: allow location from the Weather Window card when online; the last successful result is cached locally.

## Data backup and restore

Use **Profile → Export JSON** to download a complete local backup. Use **Profile → Import JSON** to restore it; the app validates and migrates the file before replacing local data, and failed imports leave existing data untouched. Legacy sleep-minute data is migrated to sleep hours, and missing fields receive safe defaults.
