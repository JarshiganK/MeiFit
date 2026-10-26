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

## 2026-10-26: Phase 1 item 5 (combos, plates, drinks, outside food, flex budget, calibration)

- **Combos** are saved from a logged meal ("Save lunch as a combo", shown when a main meal has 2+ menu items). A combo stores menu item ids and portions, and is priced from the menu when it's logged, so a corrected menu value applies. Items whose food was deleted are skipped. One tap on a combo logs it as one meal in the chosen slot (`source: 'combo'`). Combos are listed in Settings → Menu with Delete (and Undo). Renaming isn't offered: delete and save again.
- **Generic plates** stay as the three plate menu items from item 3, with a "Can't tell what's on the plate?" hint above them.
- **Drinks +1** (owner change 3): a "Quick drinks" card with "+1 <most-logged drink>" and an "All drinks" button that opens a sheet of every drink (one tap each). The most-logged drink counts every drink ever logged; a tie goes to the most recent; with none logged it's the first drink on the menu. The card will also appear on Status with the quest board (item 11).
- **Something else** (outside food quick-add and custom entries): the outside-food items from the starter menu are on the menu grid. "Something else" logs a one-off entry with a name, estimated calories, protein and the protein flag. A one-off entry has `foodId` 0 (no menu item), so the backup check now accepts 0 for meal items. Turning on "Also add it to my menu" saves it as an outside-food item first. This is a looser check, so older backups still import; no schema version was needed.
- **Flex days:** a "Flex day" switch on the Food screen's totals card, saved in `days` with the date (keeping its planned-rest flag). The week (Monday–Sunday) allows as many as the profile's flex days per week; when they're used up, the switch is replaced by a short note. Hidden for under-18s (owner answer B). On a flex day the card shows the dinner budget (target minus everything not logged as dinner), a bar for dinner so far, and "≈N left for dinner". It never shows a negative budget. The quest rule (dinner logged and within budget + 50 kcal) is in `src/domain/flex.ts` for item 11.
- **Protein calibration** (owner change 2):
  - Days 1–14 from the setup date show "Day N of 14: protein is shown but not judged yet" and how many of the three main meals are logged.
  - From day 15, while no threshold is set, a "Set your protein quest" card proposes the average protein of days with all three main meals + 10 g, rounded to the nearest 5 g and kept between 1.2 g/kg (latest weigh-in, rounded up) and the protein target. With fewer than 5 such days it proposes 1.2 g/kg.
  - The user can adjust the number within that range before confirming. Confirming adds a `targetHistory` row from today with `reason: 'calibration'` (other targets carried over), so earlier days keep the calibration rule.
  - The proposal shows only when viewing today.
- **Copy:** the drinks card is "Quick drinks", so it isn't confused with the menu's and the log's "Drinks" sections (three regions had the same name).

## 2026-10-26: Phase 1 item 6 (two-tap sleep log)

- **Where:** a Sleep card on Status (plan §10): "Going to sleep" at night, "I'm awake" in the morning. While a sleep is open the card shows "Sleeping since 23:10" with "I'm awake" and Cancel.
- **The open sleep** is a single `openSleep` setting holding the bedtime (no schema change). "I'm awake" saves a `sleepLogs` row and clears the setting in one transaction. Undo on the "Good morning" toast deletes the log and reopens the sleep.
- **Counted on the wake-up date** (plan §5), with full bedtime and wake-up instants and whole minutes.
- **Forgotten wake tap (owner change 4):** if the open sleep is more than 16 hours old, "I'm awake" opens "When did you wake up?" with the bedtime and a suggested wake time (bedtime + sleep target), both editable.
- **Editing:** the last sleep has Edit (both times, Delete with Undo). "Add a sleep" enters a night by hand; its default is the most recent night that has already ended (23:00 to 07:00), so it's never in the future. The check refuses a wake time before the bedtime, sleeps over 24 hours and wake times in the future. Edits and hand entries are saved as `source: 'manual'`.
- **Several sleeps on one day:** the longest is the main sleep (`mainSleep`), as approved; the quest uses it in item 11.
- **The target line** is neutral when a night was short ("Your target is 7 h"), never a judgement.
- **e2e uses Playwright's clock** to cross midnight deterministically.

## 2026-10-26: Phase 1 item 7 (weight log and weekly average chart)

- **Where:** a Weight card on Progress (plan §10). Today's weight is one field and Save. A later weigh-in the same day replaces the earlier one (approved default), with Undo. Earlier weigh-ins (the last 7) can be edited or deleted from the list.
- **Values:** 25–300 kg, stored to 0.1 kg. A comma works as the decimal point.
- **Weekly averages** are Monday–Sunday (plan §5). The card shows this week's average with its number of weigh-ins, and the change from the previous week that has weigh-ins, in kg and %. The calorie adjustment suggestions that use these averages arrive with the weekly report (Phase 2).
- **Chart:** Chart.js through react-chartjs-2, in its own lazy chunk (57 KB gzipped), so initial JS only grew by 0.7 KB. It shows the last 12 weeks: each weigh-in as a dot, and each week's average as a line point placed at the middle of that week's weigh-ins (so the current week never reaches into the future). Only the Chart.js parts used are registered. Colours come from the theme tokens at render time and follow the theme.
- **Accessibility:** the canvas is hidden from screen readers. The figure has a written summary ("Weekly averages over 5 weeks, from 70.5 kg to 69.2 kg") and a visually hidden table of weekly averages.
- **Offline:** the chart chunk is precached like every other chunk; e2e reloads Progress offline and checks the chart draws.
- **Test changes, explained:** `src/app/App.test.tsx` expected Progress's Phase 0 placeholder ("Progress shows up over time"). Progress now opens on the Weight card, so the test checks for that heading. Component tests stub the chart, because jsdom has no canvas; e2e draws the real one.

## 2026-10-26: Phase 1 item 8 (study focus timer)

- **The running timer is one `focusTimer` setting** (start time, planned minutes, optional subject). The countdown is always worked out from the start time (plan §12), refreshed every second and when the app returns to the foreground.
- **Ending a block:** at or after the end time the session is saved as complete at its planned length, even if the app was closed for hours (approved default). The session and clearing the timer happen in one transaction.
- **Stop** before the end saves the whole minutes studied as a partial session (hours only, no block). A stop within the first minute saves nothing. **Cancel** discards the timer.
- **Block length** comes from the profile (default 50 min). The timer's minutes can be changed per session (5–180 in steps of 5). Blocks are counted as ⌊minutes ÷ block length⌋ for completed timers and hand entries, capped at 5 a day (approved default).
- **Day rule:** a session counts on the day it starts (plan §5), so a block started at 23:40 belongs to that day.
- **Subjects:** a subject picker with "Add a subject…" (no duplicates, ignoring case). Hours per subject is a Phase 2 Nice item.
- **"Add study time"** enters a session by hand (date, optional start time, minutes 1–600, optional subject). Without a start time it ends now (today) or starts at midday (an earlier day), never before the day began, so the date can be rebuilt from the timestamp.
- **This week** shows all study minutes (partial ones included) against the weekly goal, Monday–Sunday.
- **Shortcut C:** "Also start a Clock alarm" opens `shortcuts://run-shortcut?name=Focus%20<minutes>`. iOS can't ring an alarm for a closed web app, so this is the only way to get one. The steps to create the shortcut are in `docs/USER-TASKS.md`. It can only be tested on an iPhone.
- **Test change, explained:** `src/app/App.test.tsx` expected the Study placeholder ("Focus blocks start here"); Study now opens on the focus timer.

## 2026-10-26: Phase 1 item 9 (workout plan builder)

- **One normal plan** (`workoutPlans`, `kind: 'normal'`), created the first time the editor opens. The exam-mode plan (`kind: 'exam'`) uses the same editor in Phase 2.
- **Training days are weekdays** (approved default): tap Mon–Sun to make a day a training day; the others are planned rest. The editor shows how many days are planned against the workouts-per-week goal from setup, without forcing them to match.
- **Exercise targets:** sets (1–10), plus a rep range (1–100) for reps and weight × reps, seconds (5–600, steps of 5) for holds, and a target weight (0–500 kg, steps of 0.5) for weight × reps. New exercises start at 3 × 8–12 (@ 20 kg) or 3 × 30 s. The fewest reps can't exceed the most.
- **Starter exercises:** 15 common ones (bodyweight first, then gym lifts) are loaded the first time a plan is built, only if there are no exercises yet. "New exercise" adds any other with its type (weight × reps, reps or seconds). Names are unique, ignoring case.
- **Edits save as you go** (one change at a time in a transaction), so nothing is lost if iOS closes the app. Removing an exercise, or turning off a day that has exercises, shows Undo. Exercises can be moved up and down within a day.
- **Planned rest is saved with the date** (plan §9, approved default): when the app opens, every day since the last saved day, up to today, gets its planned-rest flag from the current plan. Existing days are never changed, except that today's flag follows plan edits made today (today isn't over yet). A flex day set on a date without a row takes its planned-rest flag from the plan too.
- **Train** shows the week (training and rest days, today marked) and today's planned exercises; with no plan, a designed empty state links to the builder. Logging sets comes in item 10.
- **Bug found and fixed:** pressing Enter in a number stepper inside a form submitted the form with the old value before the typed one was committed. Enter now only commits the number (new unit test).
- **Accessibility:** the weekday toggles use their visible text ("Mon") as their name (axe's label-in-name rule).
- **Backup freshness ignores the automatic planned-rest rows.** Opening the app writes the day's planned-rest flag, which made every backup look out of date the next day (two Settings tests caught it). The "changed since the last backup" fingerprint now leaves out day rows that only carry that automatic flag. They are still in every backup; flex days still count as a change.

## 2026-10-26: Phase 1 item 10 (workout session logging with pre-fill)

- **One tap per set:** each planned set has a ✔ button that saves it with the values shown. Tapping the values opens a sheet to change reps, weight or seconds, then "Save and tick". Ticking a done set unticks it. Both offer Undo.
- **Pre-fill** (plan §6): set n copies set n of the most recent earlier session with that exercise (or that session's last set when it had fewer). With no earlier session it uses the plan's target, taking the bottom of the rep range (approved default: an achievable start; progression suggestions are Phase 2).
- **Sessions:** a set ticked within 3 hours of the previous one joins that session, keeping its date and start time. So a workout started at 23:50 stays on that day after midnight (plan §5). Each set saves `loggedAt`, an unindexed new field (no schema change; the backup check accepts it as optional).
- **Planned sets are saved with the day** (`days.plannedSets`, unindexed). Plan edits later don't change how a past day is judged, like planned rest (plan §9). Item 11's workout quest counts ticked sets up to each exercise's planned number against it; extra sets ("Add a set") are logged but don't inflate the share.
- **Training on another plan day** (approved default): "Train anyway" on a rest day, or "Do a different workout", picks a plan day. Today becomes a training day with that day's planned sets (`days.planWeekday`, unindexed). "Back to today's plan" undoes it.
- **Rest timer and PR detection** are Phase 2 Must items.
- **Test change, explained:** `e2e/train.spec.ts` (item 9) looked for the text "Squat" in today's card. The session rows now add a hidden "Change set N of Squat" label, so it matched four times. It now looks for the exercise heading.

## 2026-10-26: Phase 1 item 11 (quest board, XP and levels)

- **Nothing is stored** (plan §9): quest results and total XP are worked out on Status from the logs since the setup date (`src/domain/quests.ts`), so days logged before the board existed get credit, and a corrected log corrects the XP.
- **Daily quests** follow plan §7 with the approved defaults:
  - **Protein items:** one logged line counts as one protein item.
  - **Dinner:** "two proteins", or on a flex day "dinner logged and within budget + 50 kcal". For under-18s it's always two proteins (owner answer B).
  - **Daily protein:** "log all three main meals" for the first 14 days, and until a protein threshold has been set.
  - **Workout:** 80% of the planned sets saved with the day (item 10). A planned rest day earns 10. With no plan, the workout quest shows as locked ("Build a plan on Train to unlock it") and isn't counted in today's available XP.
  - **Study and sleep:** study gives 30 XP per block, up to 5; sleep uses the day's main sleep.
- **No exam multiplier, stats, ranks or streaks yet** (owner answer A; Phase 2). Each quest shows its stat (STR, VIT or INT) with an icon, ready for Phase 2 stats. The stat colour is never the only signal.
- **Weekly quests** (approved default): 3+ weigh-ins (20 XP) and a backup export (15 XP). They count once the Monday–Sunday week is over, credited to its Sunday; Status shows this week's progress.
- **Levels:** n → n + 1 costs 100 + 25 × n; tests check 2,025 XP for level 10 and 67,275 for level 70.
- **Level-up moment:** a short celebration (1.5 s animation, off under reduced motion) in a dialog that any tap skips. The highest level already celebrated is remembered per phone in `localStorage` (`dq.seenLevel`), a UI convenience rather than game data; the first visit just records it.
- **Quest completion motion:** a done quest's check mark pops (300 ms, transform only).
- **Status layout** (plan §10): level card, today's quests, weekly quests, sleep, Quick drinks (+1) and the flex-day switch (hidden for under-18s). The Import button and fitness-check banner come with Phases 2–3.
- **Bug found in design review:** the theme clears Tailwind's default text sizes, so `text-5xl`/`text-6xl` rendered as body text (the level number and the study countdown were tiny). They now use the `text-display` token, and `tests/token-classes.test.ts` fails on any text size the theme doesn't define.

## 2026-10-26: Phase 2 Must 1 (fitness checks and waist log)

- **Due dates** (plan §4): the first check is the baseline date booked at setup; each later one is the Saturday of the week that falls one interval (default 4 weeks, 3–6 in Settings) after the last check. The window is 3 days either side. A missed window moves the check a week at a time, with no penalty ("Moved to this weekend").
- **Status banner** while the window is open and no check has been done in it; Progress lists past checks and the next due date. The check can always be started from `/fitness-check`.
- **Flow:** intro, body, strength, endurance, recovery, review (full screen, like setup). Each test can be left empty. The draft is saved after every step (`fitnessDraft`, device-only like the setup draft), because the check takes about 20 minutes and iOS may close the app.
  - **Body:** the weekly average weight is automatic from weigh-ins (never typed). Waist is entered at the navel (40–200 cm), and the progress photo is a reminder only.
  - **Strength:** pick up to 3 weight × reps exercises (remembered in `fitnessLifts`). The estimated 1RM is the best set of the last 28 days, weight × (1 + reps ÷ 30), to the nearest 0.5 kg.
- **Review:**
  - each result beside the last check, with an icon and a word (Up, Down, Same, New): never colour alone;
  - the last 4 weeks' averages (`src/domain/review.ts`), which the weekly report reuses;
  - recalculated targets from the current weekly average, plus the plan §2 adjustment rule. Fat loss only: −175 kcal if the average hasn't dropped over 2 weeks; +175 if losing more than 1% a week after the first 2 weeks. 175 is the middle of 150–200, and the result is never below the floor;
  - the protein quest nudged halfway toward the target (rounded to 5 g, at least +5 g, never past the target).
  - Each change is a separate switch, off by default ("you confirm every change"). Confirmed changes start a `targetHistory` row on the check date (`reason: 'fitness-check'`).
  - If the goal weight or waist is reached, a switch offers "Switch my goal to maintain".
  - Under-18s see protein only.
- **Rewards:** 50 VIT plus 10 STR per improved endurance test (up to 30), worked out from the saved checks and credited on the check date. No XP is stored.
- **Waist log:** a waist field on Progress (and the check's waist goes into the day's body log). The weekly quest "Measure your waist" (15 XP) appears when one is due: a measurement earns XP if the last credited one is 13 or more days earlier, which keeps it to every 2 weeks with a day of slack. It's credited on the day measured.
- **Test changes, explained:**
  - The Weight card now has a second Save (waist). So `src/features/progress/weight.test.tsx`, `e2e/weight.spec.ts` and the screenshot script now use the weight form's Save.
  - The weekly-quest test in `src/domain/quests.test.ts` now also expects the due waist quest.
  - `src/db/history.test.ts` counts the 15 XP from its waist row.
- Exam mode will shrink the check to weight and waist; that lands with exam mode.

## 2026-10-26: Phase 2 Must 2 (streaks and shields)

- **Rule** (plan §7): a day counts when at least 5 daily quests are done. The study quest counts once, however many blocks.
- **Locked quests:** a quest that's locked (no workout plan yet) simply can't be done; the bar stays at 5, not "5 of the available ones". Alternative: lower the bar while a quest is locked (rejected: it would make streaks easier without a plan).
- **Shields:** each run of 7 counted days earns a shield, up to 2. A missed day with a shield in hand uses it: the streak survives, but the shielded day doesn't add to it. The run toward the next shield continues after a shielded day and resets when the streak breaks.
- **Today** only adds to the streak once it counts; it can't break the streak before midnight (plan §5).
- **Worked out from the logs** every time (`src/domain/streak.ts`), walking from the setup date. Nothing is stored, so correcting a past log can repair or break a past streak, as the plan intends.
- **Status card:** flame icon with "N-day streak", "Today: x of 5 quests to keep it going", two shield icons with "n of 2 shields", the best streak when it's longer than the current one, and which day a shield last covered.

## 2026-10-26: Phase 2 Must 3 (stats and ranks)

- **Stat XP:** each daily quest's XP goes to its stat (STR, VIT or INT). A fitness check adds its 50 VIT and its STR bonus. Weekly quests and the waist quest are plain XP: they add to the level but no stat. `xpBreakdown` in `src/domain/quests.ts` is the single sum used for both.
- **Stat levels** use the same curve as the overall level, on XP scaled so a typical week moves each stat about the same (plan §7). Typical weeks are set in `TYPICAL_WEEK_XP` (STR 190: 3 workouts and 4 rest days; VIT 420; INT 420: about 2 blocks a day). VIT is the reference, so STR counts about 2.2× and INT 1×. These constants are the place to tune after 2 weeks of real data (in `docs/QUESTIONS.md`).
- **Ranks** by overall level, as in plan §7: E 1–9, D 10–19, C 20–34, B 35–49, A 50–69, S 70+. The card shows the rank and where the next one starts.
- **Display:** the level card shows "Rank E", the next rank, total XP, and three stat columns. Each column has its icon, label, "Lv n" and a bar in the stat's colour; the bar's accessible name is "Strength Lv 1" (never colour alone).

## 2026-10-26: Phase 2 Must 4 (exam calendar, exam mode, exam workout plan)

- **Calendar:** Study has an "Exams and deadlines" card listing upcoming events (exam or deadline, date, optional subject), with add and delete (Undo). Setup's exam dates feed it too.
- **Automatic periods** (plan §7): each exam gives a period from 14 days before it to the day after it; overlapping or touching periods merge. They are saved in `examPeriods` (`source: 'auto'`) and kept in step with the calendar whenever an event changes and when the app opens. Periods that have already ended are never rewritten (past days keep their rules); upcoming ones follow the calendar (deleting an exam removes its future period). Unchanged periods aren't rewritten, so opening the app doesn't make the data look changed for backups.
- **Manual exam mode:** "Exam mode now" adds a period from today with an open end (`9999-12-31`). Switching it off removes it if it started today, or ends it yesterday, so today is back to normal.
- **Effects** (plan §7):
  - Study XP ×1.5: 45 per block, 225 a day, so a full day is 345.
  - The exam workout plan replaces the normal one, if it has training days. Its days and planned sets are saved with each date like the normal plan's (item 9). With no exam plan, the normal plan stays in use.
  - Diet and sleep quests are unchanged.
  - The waist quest is hidden, and a waist measured in exam mode earns no quest XP.
  - The fitness check shrinks to intro, body (weight and waist) and review.
  - The weekly boss's workout target (2 in exam mode) lands with the weekly boss.
- **Exam plan editing:** the plan editor has a Normal / Exam mode switch (`/train/plan?kind=exam`) with its own intro ("2–3 short sessions a week"). Train says when the exam plan is in use.
- **Status** shows "Exam mode until …: study XP ×1.5" and labels the quest "Study blocks (×1.5)".
- **Test change, explained:** the shared fixture's exam period (20 Nov – 5 Dec) didn't match its own exam (20 Nov, which gives 6 – 21 Nov). Opening the app now syncs periods with the calendar, so the inconsistent fixture made two "everything is backed up" tests see changed data. The fixture now has the period its exam implies.
- **Mood quest** hiding in exam mode lands with the mood check-in (Phase 2 Nice).

## 2026-10-26: Phase 2 Must 5 (rest timer and PR detection)

- **Rest timer:** every tick starts it (default 90 s; 30–300 s in steps of 15, set in the plan editor). It's a `restTimer` setting holding the start time and length, so the countdown is right after iOS pauses the app (plan §12). It's device-only, so it never makes a backup look out of date.
  - A sticky bar on Train shows "Rest 01:30" with "+15 s" and Skip, then "Rest's over. Next set!" with Dismiss.
  - iOS can't sound an alert from a paused web app, so the bar is visual only.
- **Personal records** (plan §7): a day's best set for an exercise is a record when it beats every earlier day for that exercise. Lifts are judged by estimated 1RM, reps-only moves by reps, holds by seconds. An exercise's first day never counts (nothing to beat). Each exercise earns at most one record a day, so several better sets in one session still earn +25 STR once.
  - Records are worked out from the logs (`src/domain/records.ts`) and counted in STR XP from the setup date. Sets from before setup still count as earlier bests.
- **On ticking** a record set, the toast says "New personal record! +25 STR". Progress has a "Personal records" card with the best for each exercise and the number of records so far.
- **Card subtitles** may be left empty (`Card` prop type change, no visual change).

## 2026-10-26: Phase 2 Must 6 (weekly report and boss)

- **Weekly boss** (plan §7), judged for each finished Monday–Sunday week since setup:
  - **Weight on track:** needs 3+ weigh-ins that week.
    - Losing: the week's average is below the reference. The reference is the latest weekly average from 2 or more weeks earlier, or the starting weight (the first weigh-in) in the first 2 weeks or when there's no such week.
    - Maintaining: within ±1% of the goal weight, or of the starting weight without one.
    - Building: above the reference by no more than 0.5%.
  - **Workouts:** training days whose workout quest was done, against workouts per week from setup. If any day of the week is in exam mode, the target is 2 (or fewer, if the goal is lower), which errs on the side of study.
  - **Study:** all study minutes against the weekly goal.
  - **Reward:** 100 XP (plain XP, credited once the week ends) and a title. Titles are original names, earned in order, cycling after 8.
- **Weekly report** on Progress, for any finished week (‹ ›), newest first:
  - weight average, weigh-ins and change;
  - workouts done against planned, study hours against the goal;
  - sleep, protein and (adults only) calorie averages;
  - days with 5+ quests;
  - the boss with each part marked (icon plus a hidden "Met" or "Not yet");
  - the titles earned so far.
- **Calorie check** (plan §2): on the newest report only, for adults losing fat. It uses the same rule as the fitness check: −175 kcal if the average hasn't dropped over 2 weeks, +175 if losing more than 1% a week after the first 2 weeks. "Apply from today" adds a `manual` target row (never below the floor). The button hides once a change was applied that day, so it can't be stacked.
- **Status** shows "This week's boss" under the weekly quests (progress so far), and on Mondays a "Last week's boss" banner linking to the report.
- **XP total:** `src/domain/xp.ts` adds boss XP to the quest breakdown. Status uses it; the quest module stays free of the boss rules.

## 2026-10-26: Phase 2 Must 7 (Shortcuts reminders)

- **Reminders are iOS Personal Automations** (plan §11): a Home Screen web app can't schedule its own notifications offline, and push would need a server, which the plan rules out. So the app's part is Settings → Shortcut help: the six reminders from plan §11 (time and text), the five setup steps, and the Focus alarm shortcut. The "Gym time" row names the training days from your plan.
- Notifications from Shortcuts open Shortcuts, not the app; the page says so.
- **Setting up the automations can only be done on the iPhone:** listed as task 2 in `docs/USER-TASKS.md`.
- **Test time limit, explained:** `e2e/train.spec.ts`'s axe test runs four scans and took about 29 s on WebKit even when passing, so it hit the 30 s limit once under load. It now has 90 s, like the setup test; its assertions are unchanged.

## 2026-10-26: Phase 2 Nice 1 (mood check-in)

- **Card on Status:** "How are you today?" with Energy 1–5 and Mood 1–5, one tap each. Each tap saves straight away; the part not yet picked starts at 3. One `moodLogs` row a day (unique date), and changing a value updates it.
- **XP** (plan §7): +5 plain XP once a day for a check-in, worked out from the logs. In exam mode the card is hidden and no mood XP is given ("Waist and mood quests are hidden").
- Mood isn't shown as a trend yet. The data is kept and backed up, ready for a later chart.

## 2026-10-26: Phase 2 Nice 2 (hours per subject)

- Study's "This week" card lists the week's hours per subject, most first, with sessions without a subject grouped as "No subject". It shows only when at least one session has a subject. Timer and hand-entered sessions both count, partial ones included, matching the weekly total above it.

## 2026-10-26: Phase 2 Nice 3 (achievements)

- **The five ideas from plan §7, with those names:** Iron Week (a 7-day streak, judged on the best streak), Protein Hunter (30 days at or above the protein threshold; calibration days don't count), Scholar (100 study blocks), PR Breaker (10 personal records) and Checkpoint (3 fitness checks).
- **Worked out from the logs** like XP. Correcting a log can lock one again.
- **No extra XP:** the plan gives none for achievements.
- **Display:** Progress shows each one with its description and a progress bar ("12 of 30"), or an award icon and "Unlocked". Visuals are original (lucide icons and the app's tokens).

## 2026-10-26: Phase 2 Nice 4 (progression suggestions)

- **Rule:** when the last session with an exercise reached the top of its target on every planned set, Train suggests the next step before today's sets start:
  - weight × reps (at least the target weight): +2.5 kg;
  - reps only: the rep range +2;
  - holds: +5 s.
- **"Update plan"** changes that exercise's target in the plan the day belongs to; nothing changes without the tap. The suggestion hides once today's sets begin, so the plan doesn't change mid-session.
- **Pre-fill change:** pre-fill now uses the higher of last time's weight or hold and the plan's target, so a raised target shows up in the next session's pre-filled sets. Reps still come from last time. This refines item 10's rule; no existing test changed.

## 2026-10-26: Phase 2 Nice 5 (missed-session reschedule)

- **Rule:** a training day earlier this week (Monday to yesterday) counts as missed when its saved rules say training (planned sets > 0) and no set was done that day, unless a later day this week already ran that plan day. The plan in use on each day (normal or exam) gives the rule for days without a saved row.
- **Prompt:** on a rest day with nothing logged yet, Train shows "You missed Thursday's workout. Do it today?" for the most recent missed day. "Do Thursday's workout" switches today to that plan day, the same as "Train anyway" (item 10), so it's saved with the date and judged by that day's sets.
- It never moves past days and never nags on training days. Missing a workout has no penalty beyond the quest itself.
