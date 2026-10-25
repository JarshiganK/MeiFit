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

## 2026-10-25: Phase 1 item 2 (backup, storage, privacy, delete all)

- **Owner correction: no git writes.** CLAUDE.md §9 applies again. Commits, pushes and branches are the owner's; checkpoints list suggested commits only.
- **Backup format:** `{ app: "daily-quest", schemaVersion, exportedAt (epoch ms), exportedOn (local date), tables }`, with every table from schema version 1. File name: `daily-quest-backup-YYYY-MM-DD.json`.
- **Import order:** parse JSON, check the app name, reject newer versions, upgrade older ones step by step (`BACKUP_UPGRADES`), validate every row of every table, and only then write. The write is one Dexie transaction that clears every table and adds the backup's rows, so any failure (for example a duplicate weigh-in date the database refuses) rolls back and leaves the existing data untouched. Unknown tables are rejected; extra fields on a row are allowed.
- **Import replaces everything; it never merges.** Merging two phones' logs would need conflict rules the plan doesn't define.
- **Import is reviewed and then undoable.** A sheet shows the backup's date, profile name and counts, and the confirm button says what happens ("Replace my data"). After the import, a 10-second Undo toast restores a snapshot taken just before it (CLAUDE.md §7 prefers undo over "are you sure?").
- **The export is logged before the file is made,** so the backup contains its own export entry and the weekly "Export a backup" quest survives a restore. If the share sheet is cancelled or saving fails, the entry is removed again. The e2e test found this: the first version logged after making the file.
- **Saving uses the share sheet when it can share files** (iOS: Save to Files works from the Home Screen app) and otherwise a normal download. The e2e tests turn off `navigator.canShare` because automated browsers can't drive the share sheet.
- **The Gemini key stays on the device:** it's left out of every export, and an import keeps the key already on the phone.
- **Delete all data** asks the user to type DELETE (case-insensitive, trimmed). It empties every table in one transaction, resets the theme to System, returns to Status and shows a toast. It offers "Export a backup first". The service worker's app cache stays, so the app still opens offline.
- **Persistent storage:** Settings shows whether storage is protected, how much is used, and a "Protect my data" button. A refusal is explained kindly. Setup (item 3) will also ask, as plan §2 says.
- **Backup reminder:** "No backup yet" or "Last backup: N days ago", with a gentle nudge when there's no backup or the last one is over 7 days old.
- **Privacy page and `PRIVACY.md` are kept identical by a test** that parses the Markdown into sections, paragraphs and bullets and compares them with the in-app copy. The Gemini paragraph says the feature is coming in a later version, which is accurate for Phase 1.
- **Every screen is lazy-loaded** with `React.lazy` (owner request), behind a Suspense fallback that holds the header's height so nothing shifts. The debug-console boot is a dynamic import too, so Dexie isn't in the initial bundle. Initial JS dropped from 136.6 KB to 106.6 KB gzipped. All chunks are precached, so tabs still open offline.
- **App tests now wait for lazy screens** (`findBy…` for the first lookup after a render or navigation). The assertions are unchanged.
- **A `TextField` primitive** joins the design system (label, hint, error, 16 px input). Setup will reuse it.
- **Testing Library's async timeout is 3 s** (was 1 s). Under a full parallel coverage run, the first fake-IndexedDB read in a worker sometimes took over a second and a `findBy` timed out, although the screen had rendered. The assertions are unchanged.

## 2026-10-25: Item 2 fix (back up before replace or delete)

- **Owner request:** the import review sheet and the Delete all data page show when the last backup was made. When there's no backup or data has changed since, "Back up first" is the primary button (it runs the normal export) and Replace or Delete becomes the secondary action.
- **"Changed since the last backup"** is a fingerprint (a fast 53-bit cyrb53 hash) of everything a backup holds except the export log and device-only settings. Each export saves the fingerprint in its `exportLogs` row. It isn't indexed, so no schema version was needed, and the validator accepts it as optional. Same data gives the same fingerprint, so a restored phone counts as backed up. Alternatives: per-row "updated at" stamps on every table (a schema change, and deletes are hard to track), or a crypto hash (async and unnecessary here).
- **Export entries made before this change have no fingerprint** and count as "changed", which errs towards backing up.
- **A phone with no data needs no backup** (settings alone don't count), so restoring onto a new phone makes Replace the primary action.
- **While the status loads, the screens assume a backup is needed** (the safe default).
- **`prepareExport` replaces `recordExport` and `lastExport`.** It logs the export (with fingerprint) and builds the file in one transaction.
- **`Button` renders `data-variant`,** so tests can assert which action is primary.
- **The Phase 1 item 2 test "offers an export first"** was replaced by tests for both states. Its button label ("Export a backup first") was renamed by this change to "Back up first" / "Back up again".

## 2026-10-25: Phase 1 item 3 (first-launch setup and targets)

- **Targets** (`src/domain/targets.ts`):
  - BMR, maintenance and the calorie target are computed unrounded and stored as whole numbers. The plan §15 case stores 2,021 and shows "≈2,020 (1,970–2,070)".
  - The floor is the higher of BMR and 1,500 (male), 1,200 (female) or 1,350 (other, owner answer C).
  - The target is clamped to the floor, and the review says so when that happens.
- **Protein:** 1.8 g/kg of body weight. When BMI is 30 or more, the goal weight is used instead, or the weight at BMI 25 if there's no goal weight. Manual edits can't go below 1.6 g/kg (rounded up).
- **Under 18** (owner answer B):
  - Calories stay at maintenance for every goal, and "Lose fat" isn't offered.
  - Flex days are hidden and saved as 0.
  - The review shows protein and the plate rule but no calorie numbers. Setup explains why and suggests talking to a doctor or parent.
  - Kcal is still stored, at maintenance, for internal use. The dinner quest rule ("always two proteins") lands with item 11.
- **Under 13:** "About you" won't continue and explains that the app is for ages 13 and up.
- **Setup flow:** three intro screens, then the seven steps of plan §2.
  - The install step recommends adding to the Home Screen. "Continue in the browser" is a secondary button, because installing is the recommended path.
  - Continuing asks the browser for persistent storage.
  - "Restore a backup" on the install step covers moving to a new phone (same review and safety steps as Settings).
- **Starter menu:** loaded only if the menu is empty, so it's never added twice. The generic rice and curry plate is three items (small, normal, large), because plan §18 gives each size its own calories and protein. Each counts as one protein item.
- **Baseline fitness check:** defaults to the next Saturday (1–7 days ahead) and can be booked from today to 7 days ahead. It's stored as the `baselineCheckDue` setting; the check itself is Phase 2.
- **No profile means setup.** The profile gate is lazy-loaded with the database, so Dexie stays out of the initial bundle. Delete all data now lands on setup, as approved.
- **Changing answers** (Settings → Profile → Change answers) reruns the about, goal and routine steps plus the review, prefilled. It keeps the first setup date (the protein calibration counts from it) and any calibrated protein threshold. It adds a target row starting today, or replaces today's row, so earlier days keep their targets. It records a weigh-in only if the weight was changed, and it keeps the booked baseline date.
- **Answers are kept in memory during setup.** Superseded by the item 3 fix below.
- **Validation:** pressing Next with errors moves focus to the first problem field.
- **`ImportBackup` was extracted from `DataCard`,** so setup and Settings share one import flow.
- **New UI primitive `ChoiceCards`** (large radio cards with a hint) and **`formatNumber`** (fixed English number format, e.g. "2,020").
- **e2e tests now seed a profile** straight into IndexedDB (`seedProfile`), because every screen sits behind setup. The setup e2e test walks the real flow with axe on every step, in both themes. It has a 2-minute limit because ten axe scans exceed 30 s on WebKit; its assertions aren't affected.
- **Test changes, explained:**
  - The Delete all data tests now expect to land on setup rather than Status (approved default, now real).
  - The "Replace on an empty phone" test moved from Settings to setup's install step, because a phone with no data can't reach Settings.
  - One expected value in my new BMR tests was my own arithmetic slip (1,626.25 × 1.2 = 1,951.5, which rounds to 1,952), corrected before the code changed.
- **Initial JS is 113.0 KB gzipped** (was 106.7 KB). The setup copy lives in the shared `en.ts`, and the shell imports primitives through `src/ui/index.ts`. Still about 87 KB under budget. If headroom gets tight, splitting `en.ts` per feature is the first lever.

## 2026-10-25: Item 3 fix (setup resumes after a relaunch)

- **Owner request:** setup answers are saved as a draft after each step and resume after a relaunch. The draft stays out of backups and is cleared when setup finishes.
- **Where:** one `setupDraft` row in the `settings` table (step, answers, menu choice, exams, baseline date and any target edits). No schema change, since `settings` is a key–value table. Alternative: `localStorage` (rejected: the rest of the app's state lives in IndexedDB, and Delete all data already clears it).
- **When:** written every time the step changes (Next, Back or Skip intro), so a relaunch opens the step the user was on. Typing within a step isn't saved until they move on, which keeps writes to one per step.
- **Out of backups:** `setupDraft` is a device-only setting, like the Gemini key: never exported and not part of the "changed since the last backup" fingerprint. Unlike the key, an import doesn't keep it, because a restored phone has finished setup. A backup file that somehow carries one has it dropped.
- **Cleared** in the same transaction that saves the finished setup.
- **A draft that doesn't parse** (for example from a future app version) is ignored and setup starts from the intro. A saved baseline-check date that has fallen out of the 7-day window resets to the default.
- **"Change answers"** (Settings → Profile) isn't saved as a draft: it's four short steps prefilled from the profile, and closing it keeps the saved profile.
- **Playwright retries once locally too** (it already did on CI). During full `npm run check` runs, WebKit on this Windows machine occasionally stalled IndexedDB in several workers at the same moment (even `/setup` never rendered), while the same specs passed 66 of 66 in a 3× repeat run. A real failure still fails twice and stops the run; flaky retries show in the report as "flaky". Alternatives: fewer workers (slower, and didn't address simultaneous stalls), or longer timeouts (a stall isn't slowness).

## 2026-10-26: Phase 1 item 4 (starter menu, tap logging, daily totals)

- **One `meals` row per log action.** A tap adds one row with one item; Undo deletes exactly that row. The Food screen groups rows by slot, so "Lunch has 2 protein items" counts across every lunch row that day. Alternative: one row per slot per day with items appended (harder Undo and edits).
- **Two taps:** tap a menu tile, then a portion button in the sheet. Rice offers ½–3 cups, sized items Small / Normal / Large (0.75 / 1 / 1.5×), counted items × 1–10. Each portion button shows its ≈ calories (except counts, to fit 10 buttons).
- **The meal slot** is preselected from the time of day (approved table) and can be changed before tapping. Drinks always go in the drinks slot. A logged line can be moved to another meal later.
- **Logging on earlier days:** the day switcher goes back to the setup date. A past-day log is stamped at a typical time for the slot (breakfast 08:00, lunch 13:00, snack 16:30, dinner 19:30, drinks 10:30), so its date never drifts.
- **Snapshots:** each item keeps name, calories, protein and the protein flag. Changing a logged portion re-prices from that snapshot, never from the current menu.
- **Rounding:** calories are stored as whole numbers, protein to 0.1 g. Totals show calories rounded to 10 with "≈" and protein in whole grams.
- **Under-18s** see protein and the plate rule only: no calorie numbers on the Food screen, the portion sheet or the menu editor. A menu item they add is saved with 0 kcal (calories never show for them, and the protein sanity check is skipped at 0 kcal).
- **Menu editor** (Settings → Menu): add, edit, and "Remove from menu" (archive, with Undo and Put back). Items are never deleted, so past logs and backups stay consistent. Validation: name required, unique (ignoring case), at most 40 characters; 0–3,000 kcal; 0–200 g protein; protein × 4 can't exceed the calories.
- **`useToday`** keeps "today" current at midnight and when the app returns from the background.
- **New primitive `SelectField`** (native select, so iOS shows its own picker).
- **`Sheet` ignores the close event of its own `close()`.** Browsers queue that event; if the sheet was reopened before it arrived, it used to close the new sheet. A unit test holds the event back to prove it.
- **Design review:** the Logged card moved above the menu (plan §10 lists meals by slot first), so today's meals show without scrolling past the whole menu.
- **Accessibility:** logged lines and menu-editor rows use their visible text as the accessible name, with a visually hidden "Change" / "Edit" in front (axe's label-in-name rule).
