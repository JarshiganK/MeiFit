# Checkpoint: item 3 fix (setup resumes after a relaunch)

## 1. What I built

Setup now saves its answers after each step, so if iOS closes the app part-way, opening it again lands on the same step with every answer kept. The draft lives on this phone only: it's never in a backup, an import ends it, and finishing setup clears it.

Files to read first:

- `src/features/setup/SetupFlow.tsx`: saves the draft on every step change and resumes from it.
- `src/features/setup/draft.ts`: the saved shape and `parseSavedSetup`, which ignores anything that doesn't look right.
- `src/db/backup.ts`: `setupDraft` is a device-only setting, left out of exports and fingerprints and dropped on import.
- `src/db/profile.ts`: `saveSetup` clears the draft in the same transaction.

## 2. Checks

- Unit and component tests: 322 passed in Asia/Colombo and in America/Los_Angeles.
- Domain coverage: 100% of lines.
- End-to-end: 68 passed on WebKit and Chromium, including a new test that reloads mid-setup.
- Axe: zero serious or critical violations.
- Initial JS: 113.0 KB gzipped (budget 200 KB).
- Playwright now retries a test once locally (see `docs/DECISIONS.md`): WebKit on Windows occasionally stalled IndexedDB in several workers at once.

## 3. Try it on your iPhone

Use the `develop` branch deploy, added to the Home Screen.

1. Delete all data (Settings → Delete all data), or use a fresh branch link.
2. Skip the intro, fill in "About you", pick a goal, and stop on "Your routine".
3. Swipe the app away in the app switcher, then open it again from the Home Screen.
4. You should be on "Your routine" (step 4 of 7). Tap Back twice: your goal and answers are still there.
5. Finish setup. Close and reopen the app: it opens on Status, not setup.

## 4. Commits

- `7bd20cd` Resume first-launch setup after a relaunch
- `da777b0` Retry an end-to-end test once after a stall
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

- The draft is saved when the step changes, not on every keystroke.
- "Change answers" from Settings isn't saved as a draft (it's short and prefilled).
- Playwright retries once locally as well as on CI.
- New files: `docs/QUESTIONS.md` and `docs/USER-TASKS.md` collect questions and owner tasks during unattended runs.
