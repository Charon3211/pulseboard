# Hasan's Space — Gym & Workout OS

Offline-first personal bodybuilding and gym workout tracker built with Next.js static export.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and unlock with `coco1513` (or customize/remove the passcode in Settings).

## Production build

```bash
npm run build
```

The static site is emitted to `out/`.

## Key Features (100% Gym Workout Focused)

- **Dedicated Gym Journal & Logger**:
  - Log Weight (kg/lbs) and Reps for each set with thumb-friendly steppers.
  - Previous performance memory: displays previous session's weight and reps on each exercise so you can achieve progressive overload.
  - One-tap checkmark buttons to log sets.
  - Add or remove sets dynamically for any exercise.
  - Persistent form cues and machine notes for each exercise.
- **Built-in Rest Timer**:
  - Floating rest timer widget with countdown display, circular progress indicator, and sound chimes.
  - Automatically triggers when you finish a set.
  - Quick presets (30s, 45s, 60s, 90s, 120s, 180s) and +30s button.
- **Exercise Library & Split Customizer**:
  - Full V-Taper / Aesthetic weekly split included offline (Mon–Sun).
  - Filter exercises by target muscle group (Chest, Back, Legs, Shoulders, Arms, Core, Cardio).
  - Add custom exercises to any workout day.
- **Gym Performance Analytics**:
  - Total Volume load (tonnage lifted: `weight × reps`).
  - Muscle group volume distribution bars.
  - Personal Record (PR) tracker with estimated 1-Rep Max (1RM) calculations.
  - Weekly workout consistency graph.
  - Body composition trends (Weight & Waist) with interactive SVG charts.
- **Gamification**:
  - Pure gym XP: rewarded for completed workouts, sets, volume lifted, and workout streaks.
  - Lifter ranks: *Iron Novice* → *Apprentice Lifter* → *Consistent Athlete* → *Iron Warrior* → *Gym Beast* → *Titan Lifter* → *Iron Legend*.
  - Gym achievements (First Session, The Centurion, Ton Club, Iron Streak, Heavy Duty).
- **Settings & Preferences**:
  - Weight unit toggle: Kilograms (kg) vs Pounds (lbs).
  - Configurable default rest timer duration.
  - Offline Web Audio sound effects (synthesized beeps and chimes).
  - Passcode lock customization (enable, change, or remove).
  - Full local JSON export and import backups.
  - Standalone PWA manifest and offline service worker.
