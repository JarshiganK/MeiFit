# Checkpoint: Phase 1 item 8 (study focus timer)

## 1. What I built

The Study tab now opens on a focus timer. Pick the minutes (your block length by default) and an optional subject, then start. The countdown is worked out from the saved start time, so it stays right after iOS pauses or closes the app. Coming back after the end time completes the block at its scheduled end. Stopping early keeps the minutes for your weekly hours but earns no block.

Below the timer:

- **Today:** your blocks (out of 5) and each session, with delete and Undo.
- **Add study time:** for study done without the timer.
- **This week:** hours against your weekly goal.
- **Also start a Clock alarm:** runs your "Focus 50" shortcut, so an alarm rings when the block ends (plan §11, Shortcut C).

Files to read first:

- `src/domain/study.ts`: timer status, ending a block, blocks per day and weekly minutes.
- `src/db/study.ts`: the running timer (a setting), sessions and subjects.
- `src/features/study/FocusTimerCard.tsx`: the timer and its auto-complete.
- `src/features/study/StudyScreen.tsx`: today's blocks, the hand-entry form and the week.

## 2. Checks

- Unit and component tests: 478 passed in Asia/Colombo and in America/Los_Angeles.
- Domain coverage: 100% of lines (95.07% overall).
- End-to-end: 108 passed on WebKit and Chromium. This includes a timer that survives a reload and completes after the clock jumps past its end.
- Axe: zero serious or critical violations on Study, idle and running, in both themes.
- Initial JS: 117.1 KB gzipped (budget 200 KB).

Design review: the alarm link now lines up with the card's text.

Test change explained: `src/app/App.test.tsx` expected the old Study placeholder. Study now opens on the focus timer, so the test checks for that instead.

## 3. Try it on your iPhone

Use the `develop` branch deploy, added to the Home Screen.

1. Open Study. The minutes show your block length. Add a subject from the Subject list ("Add a subject…").
2. Tap "Start focus". Leave the app for a few minutes, then come back: the countdown has kept time.
3. Close the app fully and reopen it after the end time. It says "Block complete" and Today shows "1 of 5 blocks".
4. Start another block and tap Stop after a few minutes. The minutes are saved as "Stopped early". They count in "This week" but not as a block.
5. Tap "Add study time" and enter 100 minutes from earlier today. Today gains 2 blocks.
6. Optional: create the "Focus 50" shortcut (`docs/USER-TASKS.md`), then tap "Also start a Clock alarm". The Clock timer should start.

## 4. Commits

- `eee8c30` Add focus timer and study block rules
- `2ca5d14` Save focus timers, study sessions and subjects
- `fea76bc` Add the focus timer and study log to Study
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 1 item 8":

- Stopping within the first minute saves nothing.
- A hand entry without a start time ends now (today) or starts at midday (an earlier day).
- The timer's length can differ from your block length, and blocks still count in full block lengths.

New task in `docs/USER-TASKS.md`: create the "Focus 50" shortcut. It can only be tested on an iPhone.
