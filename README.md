# Daily Quest

A calm, offline "life RPG" for your phone. Daily quests for food, training, sleep and study earn XP and levels. It's an installable web app (PWA): no account, no server, and all data stays on the device. Nothing about the user is built in; targets come from a short first-launch setup.

`MASTER_PLAN.md` describes the product, and `CLAUDE.md` the engineering rules. Progress is tracked in `docs/PROGRESS.md`, decisions in `docs/DECISIONS.md`, and each feature's checkpoint report is in `docs/checkpoints/`.

## What it does

- **Setup:** a two-minute first launch that calculates calorie and protein targets (with a calorie floor and safe rules for under-18s), books a baseline fitness check and can load a Sri Lankan hostel starter menu.
- **Status:** level, rank, STR/VIT/INT stats, streak and shields, today's seven quests, this week's quests and boss, the two-tap sleep log, a mood check-in, quick drinks, the flex-day switch and the Import button.
- **Food:** two-tap logging (rice in cups, sizes, counts), combos, quick drinks, "something else", ≈ totals, a protein bar, the flex-dinner budget and the 14-day protein calibration. Optional photo recognition with the user's own Gemini key.
- **Train:** a plan builder (normal and exam plans), one-tap set logging pre-filled from last time, a rest timer, personal records, step-up suggestions and missed-workout rescheduling.
- **Study:** a focus timer that keeps time from its start, study blocks, hand entries, hours per subject, and the exam calendar with exam mode.
- **Progress:** the weekly report and boss, weight with a weekly-average chart, waist, fitness checks, personal records, steps and achievements.
- **Settings:** profile, menu editor, Shortcut help (reminders, Meal Snap, Health Sync), backups, Gemini, fitness check interval, theme, privacy, delete all data, debug console and version.

## Requirements

- Node.js 24 (Active LTS). `.nvmrc` pins it.
- Playwright browsers for end-to-end tests: `npx playwright install chromium webkit`

## Scripts

| Script              | What it does                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `npm run dev`       | Vite dev server (includes the `/dev/ui` design gallery)                                     |
| `npm run build`     | Production build, then checks initial JS is ≤ 200 KB gzipped                                |
| `npm run preview`   | Serves `dist/` on port 4173 with the production security headers                            |
| `npm run lint`      | ESLint and Prettier check (`npm run format` fixes formatting)                               |
| `npm run typecheck` | `tsc --noEmit` for the app and the tooling                                                  |
| `npm test`          | Vitest unit and component tests with coverage, in Asia/Colombo and then America/Los_Angeles |
| `npm run test:e2e`  | Playwright against the preview build (run `npm run build` first), with axe                  |
| `npm run check`     | lint → typecheck → test → build → test:e2e. Must pass before every checkpoint               |
| `npm run screens`   | Light and dark screenshots of every screen at 430 × 932 into `test-results/screens/`        |
| `npm run icons`     | Regenerates PNG icons and favicon from `public/icon.svg`                                    |

## Architecture

```
src/
  domain/     Pure TypeScript rules (dates, targets, quests, XP…). No React, no Dexie,
              never reads the clock: "now" and the time zone are inputs.
  db/         Dexie schema and versions, repositories, backup export and import.
  features/   One folder per area: setup, status, food, train, study, progress,
              fitness, import, settings.
  ui/         Design system: tokens (theme.css) and primitives (Button, Card, Sheet…).
  app/        Shell, routing, theme, update prompt, debug console.
  copy/en.ts  Every user-facing string.
config/       Security headers shared by netlify.toml checks and vite preview.
e2e/          Playwright tests.
tests/        Node-side tests (tokens, headers, time zone, lint rules).
```

Key rules:

- **Derived values are never stored.** XP, levels, streaks and quest results are recalculated from the logs.
- **Rules that change a day are stored with their dates:** targets, flex days, planned rest and exam periods.
- **All dates go through `src/domain/date.ts`** (local midnight-to-midnight days, Monday–Sunday weeks). ESLint bans `toISOString` everywhere else.
- **No network calls at runtime** except the optional, user-enabled Gemini feature. Fonts are self-hosted.
- **Design tokens only.** Tailwind's default palette is cleared, and ESLint bans raw hex colours and pixel values in components.

## Deploy (Netlify)

1. Push the repo to a private GitHub repository.
2. In Netlify, add a new site from that repository. `netlify.toml` already sets the build command (`npm run build`), the publish directory (`dist`), Node 24 and the security headers.
3. **Choose the final site name now and never change it.** iOS keeps app data per web address, so a new name opens an empty app.
4. In Site configuration → Build & deploy → Branches and deploy contexts, turn on branch deploys for all branches. Each branch gets its own free preview link.
5. On the iPhone, open the site in Safari, then tap Share → Add to Home Screen.

`public/_redirects` sends every path to `index.html`, so reloading a page like `/food` works.
