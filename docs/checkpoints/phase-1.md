# Phase 1 report: first version

## 1. Features

1. **Database and local dates:** Dexie schema version 1 with every table, and local-date helpers in which nothing reads the clock. Reported in the chat checkpoint for item 1.
2. **Backup, storage, Privacy, Delete all data:** JSON backups with an all-or-nothing import and Undo, persistent storage, a Privacy page mirrored in `PRIVACY.md`, and "Back up first" before replacing or deleting. Reported in the chat checkpoints for item 2 and its fix.
3. **First-launch setup and targets:** a three-screen intro and the seven steps of plan §2, the §15 targets, the under-18 and under-13 rules, and Profile in Settings. Reported in the chat checkpoint for item 3; the resume fix is in [item-03-fix.md](item-03-fix.md).
4. **Starter menu, tap logging, daily totals:** two-tap logging (cups, sizes, counts), ≈ totals, a protein bar, a log you can edit, and the menu editor. See [item-04.md](item-04.md).
5. **Combos, plates, drinks, outside food, flex budget, calibration:** see [item-05.md](item-05.md).
6. **Two-tap sleep log:** counted on the wake-up date, with a 16-hour guard for a forgotten wake tap. See [item-06.md](item-06.md).
7. **Weight log and weekly average chart:** a lazy Chart.js chart with a text summary. See [item-07.md](item-07.md).
8. **Study focus timer:** keeps time from its start timestamp, up to 5 blocks a day, Shortcut C button. See [item-08.md](item-08.md).
9. **Workout plan builder:** weekday training days, starter exercises, and planned rest saved with each date. See [item-09.md](item-09.md).
10. **Session logging with pre-fill:** one-tap ticks pre-filled from the last session; training on a rest day. See [item-10.md](item-10.md).
11. **Quest board, XP and levels:** seven daily and two weekly quests, XP worked out from the logs, and the level-up moment. See [item-11.md](item-11.md).

## 2. Checks on the phase's final commit

- `npm run check`: exit 0.
- **Unit and component tests:** 561 passed in Asia/Colombo and America/Los_Angeles, plus the time-zone sanity test.
- **Coverage:** 100% of lines in `src/domain`, 94.9% overall.
- **End-to-end:** 130 passed on WebKit (iPhone 15 Pro Max) and Chromium (Pixel 7). The six required flows are all covered: first-launch setup, logging a meal, quests completing and XP rising, reloading offline after the service worker installs, data surviving a reload, and backup export and import.
- **Axe:** zero serious or critical violations on every screen, sheet and dialog tested, in both themes.
- **Initial JS:** 117.8 KB gzipped (budget 200 KB). The chart, the Eruda console and every screen load lazily.

## 3. iPhone test script for the whole phase

Use the `develop` branch deploy. Do it in this order on a fresh link:

1. Open the link in Safari. Setup opens on the intro. On the install step, follow "Add to Home Screen", then open the app from the new icon.
2. Fill in "About you". Swipe the app away mid-setup and reopen it: you're back on the same step.
3. Finish setup with the starter menu and maybe an exam date. Check the targets on the review screen, then tap "Start my quests". Status shows Level 1 and seven quests.
4. **Food:** log breakfast (an egg at Breakfast), lunch (rice in cups plus two curries), a +1 drink, and a "Something else". Save lunch as a combo. Turn on Flex day and watch the dinner budget.
5. **Status:** the food quests tick as you log, and XP rises.
6. **Train:** build a plan (pick today's weekday, add exercises). Tick 80% of the sets: the Workout quest ticks on Status (+50).
7. **Study:** start a short focus block (5 minutes). Leave the app and come back after it ends: "Block complete", and the Study quest ticks.
8. **Progress:** enter today's weight. The chart appears after a few days of weigh-ins.
9. **At bedtime:** tap "Going to sleep" on Status. In the morning, tap "I'm awake": the sleep quest ticks on the new day.
10. **Settings:** export a backup (Save to Files). The weekly backup quest shows "Backed up this week".
11. **Offline:** turn on airplane mode, then close and reopen the app. Every tab works, and data is unchanged.
12. **Undo:** delete a meal on Food, then undo it. Quest results follow.
13. **Restore:** Settings → Delete all data → type DELETE. Setup's install step → Import backup, then pick the file. Everything is back.

## 4. Open questions and tasks for you

Questions (`docs/QUESTIONS.md`):

- Should a combo use today's menu values or the values when it was saved? (I chose today's.)
- Do "Something else" entries count as protein items when switched on? (Yes.)
- Should the plan's training days be forced to match "workouts per week"? (No, both numbers are shown.)

Tasks (`docs/USER-TASKS.md`):

- Create the optional "Focus 50" shortcut for the Clock alarm.

Still open from earlier phases:

- Choose a licence (`docs/PROGRESS.md`).
- Confirm the app opens offline from the Home Screen on the iPhone.
