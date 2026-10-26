# Progress

Build order follows `MASTER_PLAN.md` §13: Phase 0, Phase 1 items 1–11, Phase 2 (Must, then Nice), then Phase 3. Builds run unattended on `develop` (CLAUDE.md §2). Checkpoint reports are in `docs/checkpoints/`.

## Phase 0: foundations (done, 2026-10-25)

| Item                                                                                              | Status       | Main files                                                     |
| ------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| Vite + React + TypeScript (strict) project, npm scripts, `.nvmrc`, `engines`                      | done         | `package.json`, `tsconfig*.json`, `vite.config.ts`             |
| Lint (ESLint, Prettier), date and design-token lint rules                                         | done         | `eslint.config.js`, `tests/lint-rules.test.ts`                 |
| Unit tests in two time zones with coverage gates; time-zone sanity test                           | done         | `vitest.config.ts`, `tests/timezone.test.ts`                   |
| Playwright (WebKit iPhone 15 Pro Max, Chromium Pixel 7, Asia/Colombo) and axe                     | done         | `playwright.config.ts`, `e2e/`                                 |
| Design tokens (Lamplight HUD), both themes, contrast and hue tests                                | done         | `src/ui/theme.css`, `tests/tokens.test.ts`                     |
| UI primitives and the dev-only `/dev/ui` gallery                                                  | done         | `src/ui/`, `src/dev/UiGallery.tsx`                             |
| App shell: five tabs, Settings gear, designed empty states, offline banner, error and 404 screens | done         | `src/app/`, `src/features/*/`                                  |
| PWA: manifest, icons, maskable icon, apple-touch-icon, offline precache                           | done         | `vite.config.ts`, `public/icon.svg`, `pwa-assets.config.ts`    |
| Version number and "Update available — Reload" prompt                                             | done         | `src/app/UpdatePrompt.tsx`, `src/app/version.ts`               |
| Eruda debug toggle (lazy)                                                                         | done         | `src/app/debug.ts`, `src/features/settings/SettingsScreen.tsx` |
| Netlify: `_redirects`, `netlify.toml` headers mirrored in `vite preview`                          | done         | `netlify.toml`, `config/headers.ts`, `tests/headers.test.ts`   |
| Initial-JS budget check                                                                           | done         | `scripts/check-bundle.mjs`                                     |
| GitHub repo and Netlify site (owner's accounts)                                                   | todo (owner) | see README "Deploy"                                            |
| Gate: app opens offline from the iPhone Home Screen                                               | todo (owner) | checkpoint steps                                               |

## Features (plan §6)

| Module        | Feature                                                               | Phase  | Status                                                                                                                                                                      | Main files                                                                                                                            |
| ------------- | --------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Setup         | First-launch setup, target calculation, Profile in Settings           | 1      | done                                                                                                                                                                        | `src/domain/targets.ts`, `src/domain/setup.ts`, `src/features/setup/`, `src/db/profile.ts`, `src/features/settings/ProfileScreen.tsx` |
| Game core     | Daily quest board, XP and levels                                      | 1      | done                                                                                                                                                                        | `src/domain/quests.ts`, `src/domain/levels.ts`, `src/features/status/`                                                                |
| Game core     | STR / VIT / INT stats, E–S ranks                                      | 2 Must | done                                                                                                                                                                        | `src/domain/stats.ts`, `src/features/status/LevelCard.tsx`                                                                            |
| Game core     | Streaks with streak shields, exam mode, weekly boss                   | 2 Must | done                                                                                                                                                                        | `src/domain/streak.ts`, `src/domain/exams.ts`, `src/domain/weekly.ts`                                                                 |
| Game core     | Achievements                                                          | 2 Nice | done                                                                                                                                                                        | `src/domain/achievements.ts`, `src/features/progress/AchievementsCard.tsx`                                                            |
| Diet          | Starter menu and menu editor                                          | 1      | done                                                                                                                                                                        | `src/db/seed/starterMenu.ts`, `src/features/settings/MenuEditorScreen.tsx`, `src/db/food.ts`                                          |
| Diet          | Tap logging: rice in cups, other items small / normal / large         | 1      | done                                                                                                                                                                        | `src/domain/food.ts`, `src/features/food/`                                                                                            |
| Diet          | Combos, generic plates, drinks +1, outside food quick-add             | 1      | done                                                                                                                                                                        | `src/db/food.ts`, `src/features/food/DrinkButtons.tsx`, `src/features/food/CustomEntry.tsx`                                           |
| Diet          | Daily totals, protein bar, flex-dinner budget, protein calibration    | 1      | done                                                                                                                                                                        | `src/domain/flex.ts`, `src/domain/calibration.ts`, `src/features/food/TotalsCard.tsx`, `src/features/food/ProteinProposal.tsx`        |
| Diet          | Photo meal recognition (Shortcuts or Gemini)                          | 3      | done (Meal Snap shortcut and a Gemini key are owner tasks 3 and 5)                                                                                                          | `src/features/import/`, `src/features/food/PhotoMeal.tsx`, `src/domain/gemini.ts`                                                     |
| Workout       | Plan builder                                                          | 1      | done                                                                                                                                                                        | `src/domain/workout.ts`, `src/db/workout.ts`, `src/features/train/PlanEditorScreen.tsx`                                               |
| Workout       | Session logging, pre-fill from last session                           | 1      | done                                                                                                                                                                        | `src/domain/session.ts`, `src/db/sessions.ts`, `src/features/train/SessionCard.tsx`                                                   |
| Workout       | Rest timer, PR detection, exam-mode workout plan                      | 2 Must | done                                                                                                                                                                        | `src/domain/records.ts`, `src/features/train/RestTimerBar.tsx`, `src/features/progress/RecordsCard.tsx`                               |
| Workout       | Progression suggestions, missed-session reschedule                    | 2 Nice | done                                                                                                                                                                        | `src/domain/session.ts` (`progressionFor`, `missedSessions`), `src/features/train/SessionCard.tsx`                                    |
| Fitness check | 4-weekly check, baseline, history and comparison, target review       | 2 Must | done                                                                                                                                                                        | `src/domain/fitness.ts`, `src/features/fitness/`, `src/db/fitness.ts`                                                                 |
| Sleep         | Two-tap sleep and wake log                                            | 1      | done                                                                                                                                                                        | `src/domain/sleep.ts`, `src/db/sleep.ts`, `src/features/status/SleepCard.tsx`                                                         |
| Sleep         | Import from Apple Health through a Shortcut                           | 3      | done (the shortcut itself is owner task 4)                                                                                                                                  | `src/domain/importFormat.ts`, `src/features/import/ImportScreen.tsx`                                                                  |
| Body          | Weight log with weekly average chart                                  | 1      | done                                                                                                                                                                        | `src/domain/body.ts`, `src/db/body.ts`, `src/features/progress/WeightCard.tsx`, `src/features/progress/WeightChart.tsx`               |
| Body          | Waist log every 2 weeks, calorie adjustment suggestions               | 2 Must | done (suggestions at fitness checks; the weekly report adds them weekly)                                                                                                    | `src/features/progress/WaistForm.tsx`, `src/domain/fitness.ts`                                                                        |
| Study         | Focus timer                                                           | 1      | done                                                                                                                                                                        | `src/domain/study.ts`, `src/db/study.ts`, `src/features/study/`                                                                       |
| Study         | Exam and deadline calendar, auto exam mode                            | 2 Must | done                                                                                                                                                                        | `src/domain/exams.ts`, `src/db/exams.ts`, `src/features/study/ExamsCard.tsx`                                                          |
| Study         | Hours per subject                                                     | 2 Nice | done                                                                                                                                                                        | `src/domain/study.ts` (`minutesBySubject`), `src/features/study/StudyScreen.tsx`                                                      |
| Wellbeing     | One-tap energy and mood check-in                                      | 2 Nice | done                                                                                                                                                                        | `src/features/status/MoodCard.tsx`, `src/db/mood.ts`                                                                                  |
| Reports       | Weekly report                                                         | 2 Must | done                                                                                                                                                                        | `src/domain/weekly.ts`, `src/features/progress/WeeklyReportCard.tsx`                                                                  |
| System        | Offline installable PWA, persistent storage, backup export and import | 1      | done (persistent storage is also requested in setup, item 3)                                                                                                                | `vite.config.ts`, `src/db/backup.ts`, `src/db/storage.ts`, `src/features/settings/DataCard.tsx`                                       |
| System        | Settings, debug console toggle, version number and update prompt      | 1      | done: debug, version, update prompt, theme, health note, backup, storage, Privacy, Delete all data, Profile and menu editor (Gemini and Shortcut help come with Phases 2–3) | `src/features/settings/`, `src/app/`                                                                                                  |
| System        | Reminders through Shortcuts automations                               | 2 Must | done (the automations themselves are an owner task: `docs/USER-TASKS.md`)                                                                                                   | `src/features/settings/ShortcutHelpScreen.tsx`                                                                                        |
| System        | Steps import through a Shortcut                                       | 3      | done (the shortcut itself is owner task 4)                                                                                                                                  | `src/db/imports.ts`, `src/features/progress/StepsCard.tsx`                                                                            |

## Phase 1 build order

1. Database setup (Dexie v1) and local-date helpers: **done** (`src/domain/date.ts`, `src/db/`)
2. Backup export and import, persistent storage, Privacy page, delete all data: **done** (`src/db/backup.ts`, `src/features/settings/`); every screen is now lazy-loaded
3. First-launch setup and target calculation: **done** (`src/domain/targets.ts`, `src/features/setup/`); setup resumes after a relaunch
4. Starter menu, food tap logging and daily totals: **done** (`src/domain/food.ts`, `src/db/food.ts`, `src/features/food/`, `src/features/settings/MenuEditorScreen.tsx`)
5. Combos, generic plates, drinks, outside food, flex budget, protein calibration: **done** (`src/domain/flex.ts`, `src/domain/calibration.ts`, `src/features/food/`)
6. Two-tap sleep log: **done** (`src/domain/sleep.ts`, `src/db/sleep.ts`, `src/features/status/SleepCard.tsx`)
7. Weight log and weekly average chart: **done** (`src/domain/body.ts`, `src/features/progress/`)
8. Study focus timer: **done** (`src/domain/study.ts`, `src/features/study/`)
9. Workout plan builder: **done** (`src/domain/workout.ts`, `src/db/workout.ts`, `src/features/train/`)
10. Workout session logging with pre-fill: **done** (`src/domain/session.ts`, `src/db/sessions.ts`, `src/features/train/SessionCard.tsx`)
11. Quest board, XP and levels: **done** (`src/domain/quests.ts`, `src/domain/levels.ts`, `src/features/status/`)

## Phase 2 build order (Must, then Nice)

1. Fitness checks and waist log: **done** (`src/domain/fitness.ts`, `src/features/fitness/`)
2. Streaks and shields: **done** (`src/domain/streak.ts`, `src/features/status/StreakCard.tsx`)
3. Stats and ranks: **done** (`src/domain/stats.ts`)
4. Exam calendar, exam mode and exam workout plan: **done** (`src/domain/exams.ts`, `src/db/exams.ts`)
5. Rest timer and PR detection: **done** (`src/domain/records.ts`)
6. Weekly report and boss: **done** (`src/domain/weekly.ts`, `src/domain/xp.ts`)
7. Shortcuts reminders: **done** (`src/features/settings/ShortcutHelpScreen.tsx`)
8. Nice: achievements, progression suggestions, missed-session reschedule, hours per subject, mood check-in: **done**

## Phase 3 build order

1. Import screen and the `DQ1` parser: **done** (`src/domain/importFormat.ts`, `src/features/import/ImportScreen.tsx`)
2. Meal Snap and Health Sync shortcuts (help pages; the shortcuts are owner tasks): **done** (`src/features/settings/ShortcutHelpScreen.tsx`)
3. Gemini backup (photo meal recognition with the user's own key): **done** (`src/domain/gemini.ts`, `src/features/food/PhotoMeal.tsx`, `src/features/settings/GeminiCard.tsx`)
4. Visual theme polish: **done** (`e2e/layout.spec.ts`, design reviews in each checkpoint)
5. Optional Teachable Machine model: **deferred** (see below)

## Deferred

- **Teachable Machine model (Phase 3, optional).** Deferred: it needs a model trained on photos of this canteen's food, which don't exist yet, and TensorFlow.js would add about 1 MB to the app. Meal Snap (Private Cloud Compute) and the Gemini backup already recognise meals from photos. Revisit once a few hundred labelled plate photos exist; the review screen would take its answers like the other two.

## Open TODOs

- **LICENSE:** the owner will choose the licence. No LICENSE file until then.
- `PRIVACY.md` mirrors Settings → Privacy word for word (`tests/privacy.test.ts`).
