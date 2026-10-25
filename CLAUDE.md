# CLAUDE.md

Instructions for Claude Code when building **Daily Quest**. Read this file and `MASTER_PLAN.md` in full before doing any work.

## 1. Source of truth

- `MASTER_PLAN.md` defines **what** the app does: product behaviour, rules, numbers and screens. Cite its section numbers in plans and reports.
- This file defines **how** to build it: engineering, tests, UI quality and git.
- If the two conflict, this file wins on engineering choices and `MASTER_PLAN.md` wins on product behaviour.
- Never edit `MASTER_PLAN.md`. If something in it is wrong, unclear or missing:
  1. Pick the most sensible option.
  2. Record it in `docs/DECISIONS.md`.
  3. Mention it in your next checkpoint report.
- Quality bar: an app ready for public release. It is polished, accessible, fast, works offline, is tested, and has no personal data hard-coded.

## 2. How to work

1. Start every session by reading:
   - `MASTER_PLAN.md` and this file.
   - `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/QUESTIONS.md` and `docs/USER-TASKS.md`.
2. **You're working unattended.** Build every remaining feature in the order of `MASTER_PLAN.md` section 13:
   1. The rest of Phase 1, up to item 11.
   2. Phase 2: all the Must items first, then the Nice items.
   3. Phase 3.
   - Ignore the week estimates.
   - Ignore the gate that asks for a week of daily use before Phase 2. I've chosen to skip it.
3. Build one feature at a time, in this sequence:
   1. Write a short plan: files, data changes and tests.
   2. Write tests for the domain logic first.
   3. Implement.
   4. Run `npm run check` and fix every failure.
   5. Commit and push (section 9).
   6. Save the checkpoint report to `docs/checkpoints/<item>.md` (section 11), then start the next feature straight away.
4. At the end of each phase, also write `docs/checkpoints/phase-<n>.md` (section 11), then carry straight on to the next phase.
5. **Never stop to ask me.** When something needs my decision:
   1. Pick the safest option that's easy to undo.
   2. Log it in `docs/DECISIONS.md` (date, decision, reason and alternatives).
   3. Add it to `docs/QUESTIONS.md` so I can review it later.
   4. Continue.
6. **When a step needs my accounts or my phone,** do everything you can without me, then continue. This covers GitHub, Netlify, API keys, building an iPhone Shortcut, and checks that only work on an iPhone.
   - Build the app side and test it with mocks.
   - Write exactly what I need to do in `docs/USER-TASKS.md`, as numbered steps.
7. **Stop the run only in three cases:**
   1. `npm run check` still fails after genuine attempts to fix it.
   2. You're not on the `develop` branch.
   3. Every feature is done.
   - Never skip, weaken or delete a test to get past a failure, and never commit failing code.
8. Keep `docs/PROGRESS.md` current. List every feature from `MASTER_PLAN.md` section 6 with its status (todo, in progress, done, deferred or blocked) and its main files. Give a reason for anything deferred or blocked.
9. Never claim something works without running it.
   - Some behaviour can only be checked on an iPhone, such as Shortcuts or Add to Home Screen.
   - For that, say so plainly and put numbered test steps in the checkpoint report.

## 3. Commands

Create these npm scripts and keep them working on Windows. Use cross-env wherever an environment variable is needed.

| Script | What it does |
| --- | --- |
| `dev` | Vite dev server |
| `build` | Production build |
| `preview` | Serve the production build |
| `lint` | ESLint and Prettier check |
| `typecheck` | `tsc --noEmit` |
| `test` | Vitest unit and component tests with coverage, run in two time zones |
| `test:e2e` | Playwright against the preview build |
| `check` | lint → typecheck → test → build → test:e2e. Must pass before every checkpoint |

## 4. Stack

Use `MASTER_PLAN.md` section 8 with these decisions:

- **Language:** TypeScript in strict mode. This overrides the plan's "JavaScript first".
- **App:** latest stable React, Vite and React Router.
- **Styling:** Tailwind CSS v4, installed as the Vite plugin, with design tokens defined in CSS via `@theme`.
- **Data:** Dexie with dexie-react-hooks.
- **Offline:** vite-plugin-pwa.
- **Charts and dates:** Chart.js through react-chartjs-2, and Day.js.
- **Tests:** Vitest, @vitest/coverage-v8, React Testing Library, fake-indexeddb, Playwright and @axe-core/playwright.
- **Allowed extras:** lucide-react for icons, and @fontsource packages for self-hosted fonts so the app works offline.
  - Any other dependency needs a line in `docs/DECISIONS.md`: why it's needed, its size and its maintenance status.
  - No full UI kits, no CSS-in-JS runtimes, and no analytics or tracking.
- **Node:** current LTS version. Add `.nvmrc` and `engines` in package.json.
- **Scaffolding:** scaffold in the repo root and keep the existing .md files.
- **Hosting:** Netlify. I connect Netlify myself. You add:
  - `public/_redirects` containing `/* /index.html 200`.
  - `netlify.toml` with the build command, publish directory and the headers in section 8.

## 5. Architecture rules

**Folders**

- `src/domain/`: pure TypeScript with no React or Dexie.
  - Covers dates, targets, portions, quests, XP, levels, ranks, stats, streaks and shields, exam mode, weekly boss, fitness check comparisons and the import-format parser.
  - Every function is deterministic: it receives "now" and the time zone as inputs and never reads the clock itself.
- `src/db/`: Dexie schema and versions, repositories, and backup export and import.
- `src/features/<area>/`: one folder each for setup, status, food, train, study, progress, fitness-check and settings.
- `src/ui/`: the design system, with tokens and primitives such as Button, Card, Sheet, Tabs, Stepper, ProgressBar, Toast, NumberStepper and EmptyState.
- `src/copy/en.ts`: every user-facing string, so the app can be translated later.

**Rules**

- **Derived values are never stored.** XP, level, rank, stats, streak, shields, quest results and achievements are calculated by `src/domain` from the logs (plan section 9).
- **Day rules are stored with dates.** Flex days, planned rest, exam periods and target history are saved with the date they apply to.
- **All dates go through `src/domain/date.ts`.** It uses Day.js in local time, with midnight-to-midnight days and Monday–Sunday weeks (plan section 5).
  - Add an ESLint rule that bans `toISOString` everywhere except `date.ts`.
- **Units:** store metric units internally.
- **Dexie versions:**
  - Never change an existing version. Add a new version with an upgrade function.
  - Backups include `schemaVersion`.
  - Import validates the file and upgrades older versions. It rejects a bad file without touching existing data.
- **Network:** no network calls at runtime except the optional Gemini feature (Phase 3). No CDNs, remote fonts or trackers.
- **Timers** save their start timestamp and calculate elapsed time from it (plan section 12).
- **Lazy loading:** load Chart.js and Eruda only when needed.

## 6. Testing rules

**Unit tests** cover every rule in plan sections 2, 3, 4, 5 and 7. Include these edge cases:

- 23:59 vs 00:00, and sleep that crosses midnight.
- Monday–Sunday weeks.
- The 14-day protein calibration.
- Shields earned at 7 and 14 days, and the cap of 2.
- Exam periods and the 1.5× multiplier.
- The weekly boss for each goal type.
- Flex budget and the calorie floor.
- Under-18 handling (section 8 of this file).

**Known answers that must pass:**

- Level 10 needs 2,025 XP in total; level 70 needs 67,275.
- The plan's section 15 test case gives BMR 1,626, a target of about 2,020 kcal, a floor of 1,626 and protein of 124 g.

**Time zones:** run the unit suite in Asia/Colombo and in America/Los_Angeles. Include a sanity test that fails if the time zone wasn't actually applied.

**Coverage:** at least 90% of lines for `src/domain` and 70% overall. The test script fails below that.

**Database tests** use fake-indexeddb and cover:

- Every migration.
- A backup round trip: export, wipe, import, then check the data is identical.
- A corrupted backup, which must be rejected with existing data untouched.

**Component tests** use React Testing Library for forms and key interactions.

**End-to-end tests** use Playwright against the preview build.

- Two projects, both with `timezoneId` set to Asia/Colombo:
  - WebKit with the iPhone 15 Pro Max device profile, or the nearest iPhone in Playwright's list.
  - Chromium mobile.
- Cover these flows:
  - First-launch setup.
  - Logging a meal.
  - Quests completing and XP rising.
  - Reloading offline after the service worker installs.
  - Data surviving a reload.
  - Backup export and import.
- Run axe on every screen, with zero serious or critical violations.

**Never skip, delete or weaken a test to make it pass.** If a test is wrong, explain why in the checkpoint report before changing it.

## 7. UI and UX standard

Aim for an original, polished mobile game HUD that's calm enough to use every day in under 2 minutes. Copy nothing from Solo Leveling or any other game or brand.

**Layout**

- Mobile-first for iPhone 15 Pro Max (430 × 932), responsive from 360 to 1024 px, with no horizontal scroll.
- Usable with one thumb, with the main actions in the lower half of the screen.
- Touch targets are at least 44 × 44 px.
- Respect safe areas with `viewport-fit=cover` and `env(safe-area-inset-*)`.

**Visual design**

- Define design tokens once: colour, type scale, spacing on a 4/8 px grid, radii, shadows and motion. Components use no raw hex values or magic numbers.
- Dark theme by default plus a light theme. Follow the system setting, with an override in Settings. Meet WCAG 2.2 AA contrast.
- Give STR, VIT and INT one distinct hue each, used the same way in bars, chips and charts.
  - Colour is never the only signal. Always pair it with an icon or a label.
- Use at most two self-hosted typefaces: a display face for levels and big numbers, and a highly readable UI face.
  - Use tabular numerals for counters.
  - Inputs are 16 px or larger.
- Create an original app icon, maskable icon, apple-touch-icon, theme colour and splash colours.

**Interaction**

- Common logging actions take 2 taps or fewer.
- Use bottom sheets for pickers.
- Prefer undo toasts over "are you sure?" dialogs. The exception is deleting all data.
- Design every empty, first-use, error and offline state, so no screen is ever blank.
- Setup includes up to 3 short screens explaining the game.

**Motion**

- Motion has a purpose: XP gain, a quest completing, a level-up.
- Animate only transform and opacity.
- UI motion takes 300 ms or less. The level-up moment takes 1.5 s or less and can be skipped.
- Turn motion off under `prefers-reduced-motion`.

**Copy**

- Short, plain and encouraging.
- Never shame eating, weight or missed days.
- Always show calories as ≈ estimates.

**Accessibility**

- Semantic HTML, labelled inputs and visible focus.
- Names for icon buttons, and a text summary for every chart.
- Layouts still work at 200% text size.

**Performance**

- Initial JS is at most 200 KB gzipped.
- No layout shift.
- The Status screen appears in under 1 second from cache.

**Design checks**

- Add a dev-only `/dev/ui` route that shows the tokens and primitives in both themes.
- After Phase 0, and after each new screen, review the design:
  1. Take Playwright screenshots in light and dark at 430 × 932, saved to `test-results/screens/`.
  2. Look at them yourself and fix obvious issues.
  3. List what you changed.

## 8. Publish readiness

These requirements add to the plan:

- **Nothing personal is hard-coded.** All profile data comes from setup.
- **Under-18 users get no calorie deficit.**
  - Targets stay at maintenance and the fat-loss goal is hidden.
  - Setup shows a note to talk to a doctor or parent.
- **Health note.** Setup and Settings both say that numbers are estimates, not medical advice, and to see a doctor for medical conditions.
- **Calorie floor.** The floor in plan section 2 is always enforced.
- **Settings → Privacy** explains:
  - What's stored: everything stays on this device.
  - What's sent: only food photos to Gemini, and only if the user turns it on with their own API key.
  - How to export or delete everything.
  - Mirror this page in `PRIVACY.md`.
- **Settings → Delete all data**, with a typed confirmation.
- **Gemini** is off by default and uses the user's own key.
- **netlify.toml headers:**
  - A Content-Security-Policy that allows only the app's own origin, plus the Gemini API in `connect-src`.
  - `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, and a `Permissions-Policy` that allows the camera only for the app itself.
  - The service worker and manifest are served with `Cache-Control: no-cache`.
- **README.md:** what the app is, the scripts, an architecture overview and how to deploy.
- **LICENSE:** leave a TODO in `docs/PROGRESS.md`. I'll choose the license.

## 9. Git rules (strict)

- **Work only on `develop`.** If another branch is checked out, stop the run and tell me.
- **Commit and push each feature.** After `npm run check` passes:
  - Make 2–5 commits, one per logical piece.
  - Each message starts with a verb and is under 60 characters (plan section 14).
  - Then run `git push origin develop`.
- **If a push fails** (network or credentials), keep committing locally, add the problem to `docs/USER-TASKS.md`, and push again after the next feature.
- **Never touch `main`.** No checkout, merge or push to `main`.
  - I merge `develop` into `main` myself after testing on my iPhone.
  - Every push to `main` is a production deploy that costs Netlify credits.
- **Never rewrite history.** No force-push, rebase, reset, amend, stash, tag, or deleting branches.
  - Read-only commands (status, diff, log, show) are fine.
- **No AI attribution.** Never add AI author, co-author or attribution text to code, commits or docs.
- **No secrets in git.** Never put API keys or secrets in code, tests, fixtures or committed files.
  - `.gitignore` covers `.env*`, `coverage`, `playwright-report` and `test-results`.

## 10. Definition of done (each feature)

- Behaviour matches the plan sections it implements.
- `npm run check` passes with no errors and no new warnings.
- New logic has unit tests. New screens have an end-to-end test path and pass axe.
- It works offline in the preview build.
- Empty, error and reduced-motion states are handled.
- `docs/PROGRESS.md` and `docs/DECISIONS.md` are updated.
- It's committed and pushed to `develop` (section 9).

## 11. Checkpoint report

Save each feature's report to `docs/checkpoints/<item>.md`, then keep going:

1. **What I built:** 2–4 plain sentences, plus the 3–5 files to read first to understand it, with a one-line reason for each.
2. **Checks:** tests passed, domain coverage, bundle size and the axe result.
3. **Try it on your iPhone:** numbered steps using the `develop` branch deploy.
4. **Commits:** each commit you made, with its short hash and message.
5. **Decisions, questions and tasks for me:** anything you logged.

At the end of each phase, write `docs/checkpoints/phase-<n>.md`:

1. A one-line summary of each feature, linking its report.
2. The checks on the phase's final commit.
3. One iPhone test script for the whole phase, in the order I'd naturally use the app.
4. Every open question and user task from the phase.

When every feature is done, stop and post the final summary in the chat. It covers:

- What's built, deferred and blocked.
- The final checks.
- Where the phase reports are.
- Everything in `docs/QUESTIONS.md` and `docs/USER-TASKS.md`.
