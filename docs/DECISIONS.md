# Decisions

Each entry gives the date, the decision, the reason and the alternatives considered. Plan section numbers refer to `MASTER_PLAN.md`.

## 2026-10-25: Owner answers to the planning questions

| #   | Decision                                                                                                                                                                                                                                                                       | Reason                                                                                                     | Alternatives                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A   | Streaks, shields, the weekly boss and exam mode (including the 1.5× study multiplier) are built and tested in Phase 2. Phase 1 XP has no exam multiplier.                                                                                                                      | Keeps exam mode in one place. XP is derived from logs, so past exam days get the bonus once Phase 2 lands. | Apply the multiplier in Phase 1 item 11 (rejected by owner).               |
| B   | Setup is for ages 13+. Under 13, setup stops politely. For ages 13–17: calorie targets stay at maintenance, the fat-loss goal is hidden, **calorie numbers and flex days are hidden**, only protein and plate-rule quests show, and the dinner quest is always "two proteins". | Safe defaults for teenagers (CLAUDE.md §8), extended by the owner.                                         | Show calories at maintenance (rejected by owner).                          |
| C   | Sex options: Male, Female, and **Other / prefer not to say**, which uses the midpoint constant (−78) and a 1,350 kcal floor.                                                                                                                                                   | Inclusive, and still gives the formula a value.                                                            | Two options only.                                                          |
| 1   | Palette reworked so each stat colour is at least 30° of hue from the error and XP colours (and from each other) in both themes. Error moved towards magenta. `tests/tokens.test.ts` checks this as well as AA contrast.                                                        | STR coral was too close to the error red and the XP amber.                                                 | —                                                                          |
| 2   | Protein calibration averages only days with all three main meals logged. With fewer than 5 such days, the proposal falls back to 1.2 g/kg.                                                                                                                                     | Partial days would drag the average down.                                                                  | Average every day with any meal (my original default).                     |
| 3   | The one-tap drink is the user's most-logged drink (not a fixed item). The drinks sheet has its own visible button; no long-press.                                                                                                                                              | The app is general, and long-press is hard to discover.                                                    | Nescafe as the default; long-press for the sheet.                          |
| 4   | Sleep: if the open sleep is more than 16 hours old when "I'm awake" is tapped, the app asks for the real wake time instead of using now. Both times stay editable.                                                                                                             | Avoids 20-hour "sleeps" when the wake tap was forgotten.                                                   | Flag only.                                                                 |
| 5   | Security headers live in `config/headers.ts`, are mirrored into `vite preview` (`preview.headers` plus a small middleware for path rules), and `tests/headers.test.ts` fails if `netlify.toml` and the config ever differ. e2e checks the headers on real responses.           | `vite preview` doesn't read `netlify.toml`, so e2e would otherwise never exercise the real CSP.            | Generate `netlify.toml` from the config at build time (more moving parts). |

## 2026-10-25: Plan defaults approved with the build plan

These fill gaps in `MASTER_PLAN.md`. They're applied when the matching Phase 1 item is built.

| Topic                          | Decision                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Protein "never below 1.6 g/kg" | It's the lowest value a manual edit may set (the default is 1.8 g/kg).                                                                                                                            |
| "Well above a healthy weight"  | BMI ≥ 30: protein uses the goal weight, or the weight at BMI 25 if no goal weight is set.                                                                                                         |
| Rounding                       | Store exact whole numbers; show calories rounded to 10 with "≈". The §15 case stores 2,021 / 1,626 / 124 g and shows "≈2,020 (1,970–2,070)".                                                      |
| Maintain without goal weight   | Use the weight from setup or the latest recalculation.                                                                                                                                            |
| Rerun setup                    | Adds a new `targetHistory` row from today; logs are kept.                                                                                                                                         |
| Counted foods                  | A third unit, `count` (1–10 stepper), alongside `cups` and `size`.                                                                                                                                |
| Protein items                  | One logged line counts as one protein item regardless of portion. A generic plate counts as 1.                                                                                                    |
| Flex budget                    | Target minus every non-dinner item logged that day. The quest passes when dinner is logged and stays within budget + 50 kcal.                                                                     |
| Default meal slot              | Breakfast 04:00–10:59, lunch 11:00–15:59, snack 16:00–18:29, dinner 18:30–23:59, snack 00:00–03:59. Always changeable.                                                                            |
| Calibration window             | 14 calendar days from the setup date (`profile.setupDate`).                                                                                                                                       |
| Workout plan days              | Map to weekdays; other weekdays are planned rest. The Train screen can run a different plan day today, which makes it a training day. A rest day with no session earns 10 XP.                     |
| Planned-rest backfill          | On open, missing `days` rows from the last saved day to today are written from the current plan.                                                                                                  |
| Several sleeps per day         | The longest is the main sleep and counts for the quest.                                                                                                                                           |
| Study blocks                   | A completed session counts ⌊minutes ÷ block length⌋ blocks, up to 5 a day. A timer stopped early counts toward hours only. Returning after the end time completes the block at its scheduled end. |
| Weigh-ins                      | One per day; the latest replaces the earlier one. The setup weight is the first `bodyLogs` entry.                                                                                                 |
| Weekly quests in Phase 1       | 3+ weigh-ins and backup export. Backup exports are logged in a new `exportLogs` table. Weekly XP is credited to the Sunday of the finished week.                                                  |
| Schema                         | Dexie version 1 declares every table in plan §9 plus `exportLogs` and `profile.setupDate`.                                                                                                        |
| Backups                        | The Gemini API key is never included in a backup.                                                                                                                                                 |
| Delete all data                | Wipes IndexedDB and returns to setup. The service worker's app cache stays.                                                                                                                       |
| Units                          | Metric only in Phase 1. Imperial input is in `LATER.md`.                                                                                                                                          |
| Install check                  | Recommends Add to Home Screen, with "Continue in browser" (needed for desktop and e2e).                                                                                                           |
| Phase 2/3 items on Status      | The Import button, rank, stats and streak are hidden until built. Space is reserved so nothing shifts later.                                                                                      |
| Baseline fitness check         | Setup stores only the due date; the check itself is Phase 2.                                                                                                                                      |

## 2026-10-25: Phase 0 engineering

- **Node.js 24.22.1 (current Active LTS), installed with winget.** Node wasn't on the machine. `.nvmrc` is `24`, `engines` is `>=24.11.0 <25`, and Netlify builds with `NODE_VERSION = "24"`. Alternative: Node 26, which isn't LTS yet.
- **TypeScript 6.0.3, not 7.x.** typescript-eslint 8.72 supports TypeScript below 6.1 only. Revisit when typescript-eslint supports 7.
- **ESLint 10 with `eslint-plugin-jsx-a11y-x` 0.2.0.** The original `eslint-plugin-jsx-a11y` (last published 2024-10) doesn't support ESLint 10, and ESLint 9 is out of support. The `-x` fork is maintained by the es-tooling group (last release 2026-05), MIT, 267 KB unpacked, dev only.
- **Exact dependency versions** (`--save-exact`), so builds are reproducible on the Vivobook and Netlify.
- **Extra dependencies** (beyond CLAUDE.md §4):
  - `smol-toml` 1.9.1 (dev only, 140 KB unpacked, released 2026-10): parses `netlify.toml` in the headers test. Maintained, no dependencies.
  - `@vite-pwa/assets-generator` 2.0.0 (dev only, 75 KB plus `sharp`, released 2026-09): generates the PNG icons, maskable icon, apple-touch-icon and favicon from `public/icon.svg` (`npm run icons`). Same maintainers as vite-plugin-pwa. The generated files are committed, so builds don't need it.
  - `workbox-window` 7.4.1 (runtime, 2.2 KB gzipped): required by vite-plugin-pwa's register module for the update prompt.
  - `eruda` 3.4.3 (runtime, lazy chunk, 151 KB gzipped): the debug console from plan §8. It's never in the initial bundle and isn't precached. Its last release was 2025-06; it's stable and has no alternative of similar size.
- **CSP allows inline styles and `data:` fonts.** `style-src 'self' 'unsafe-inline'` and `font-src 'self' data:` are needed only by Eruda, which injects its UI styles and an icon font. Scripts stay strict (`script-src 'self'`, no `unsafe-eval`). Eruda's start-up `eval` calls are blocked by the CSP and it falls back without them. e2e proves it still opens and shows console output; the only feature lost is typing JavaScript into its console. Alternatives: a strict style policy with an unusable debug console, or allow `unsafe-eval` (rejected: scripts matter far more than styles).
- **Eruda's build warning about direct `eval` is filtered** for that one file in `vite.config.ts`, so the build stays warning-free. It's the behaviour described above.
- **Eruda isn't precached.** It's cached at runtime (CacheFirst) the first time the toggle is used. The precache dropped from 1,034 KB to 555 KB.
- **Only Latin and Latin-extended font subsets are precached.** The UI copy is English; other subsets load only if needed.
- **Theme in localStorage, applied by `public/theme-init.js`** before the first paint. It's a file rather than an inline script, so the CSP doesn't need `unsafe-inline` for scripts. The theme follows the system, defaults to dark, and has an override in Settings.
- **Debug toggle in localStorage for Phase 0.** It moves to the Dexie `settings` table in Phase 1 item 1, as the plan's data model says.
- **BrowserRouter with `public/_redirects`** (CLAUDE.md §4) rather than HashRouter.
- **Tailwind's default colours, fonts, text sizes, radii and shadows are cleared** in `@theme`, so components can only use the app's tokens. ESLint also bans raw hex values and arbitrary pixel values in `src/`.
- **Light-theme XP amber darkened from `#956800` to `#8c6200`.** The token test showed 4.49:1 on the light background, just under AA.
- **Selected segments and tabs** use the raised colour on a background-coloured track. In dark mode the first version looked sunken.
- **The axe e2e tests emulate reduced motion and wait for running animations.** A toast fading in was occasionally scanned while translucent, which gave a false contrast failure on WebKit. Colours and layout are identical with reduced motion, so the scan still covers the real UI. This was a new test, so no existing test was weakened.
- **Design screenshots** (`npm run screens`) run against the dev server, because `/dev/ui` is dev-only. They aren't part of `npm run check`.
- **Initial JS budget check** (`scripts/check-bundle.mjs`) runs after every build and fails above 200 KB gzipped.

## 2026-10-25: Phase 1 item 1 (database and dates)

- **Instants are stored as epoch milliseconds; dates as local `YYYY-MM-DD` strings.** Epoch ms are time-zone-free, so a log's date can always be rebuilt (plan §5). Alternative: ISO strings, which invite `toISOString` mistakes.
- **Dates are parsed with plain `dayjs(date)`.** Day.js reads date-only strings as local midnight, unlike `new Date('YYYY-MM-DD')`, which reads them as UTC. No Day.js plugins are needed: weekdays and ages are computed directly.
- **Age on 29 February birthdays** ticks over on 1 March in non-leap years.
- **Ids are auto-incrementing numbers.** Backup import replaces the whole database, so ids never need to merge across devices. Alternative: UUIDs (larger, unnecessary).
- **`profile` is a single row with id `'me'`.** Current weight lives in `bodyLogs` (plan §9 has no weight field on the profile).
- **Unique date indexes** on `bodyLogs`, `moodLogs` and `stepsLogs` enforce one entry per day (approved default; plan §11 says imports replace). `sleepLogs` allows several per wake date (naps); the longest counts.
- **Meal items snapshot** name, kcal, protein and the counts-as-protein flag, so menu edits never change past days (plan §3).
- **`targetHistory.reason`** adds `calibration` for the day-15 protein threshold, beside setup, fitness check and manual.
- **Version 1 is frozen by a test** (`src/db/schema.test.ts` keeps a literal copy), so an edit to a released version fails CI instead of risking real data.
- **The debug flag moved to the Dexie `settings` table**, as planned. A Phase 0 flag in localStorage is migrated once at start-up and then removed. The Phase 0 unit test for "toggles when storage is blocked" was replaced: that path no longer exists, and the new test covers blocked storage during the migration.
- **`.gitattributes` forces LF line endings.** Git on this machine converts to CRLF on checkout, which would fail `prettier --check`.
- **The lint-rule test warms ESLint up once in `beforeAll`** (180 s limit). The first config load took over a minute with coverage running in parallel and hit the 5 s per-test limit. The assertions are unchanged.
- **Initial JS is now 136.6 KB gzipped** (was 105.3 KB) because Dexie loads at start-up. That's expected: the Status screen reads from it.
