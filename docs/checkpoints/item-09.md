# Checkpoint: Phase 1 item 9 (workout plan builder)

## 1. What I built

Train → "Build my plan" opens the plan builder. Tap the weekdays you train; the others become planned rest. Add exercises to each day from 15 starter exercises, or create your own (weight × reps, reps or seconds). Each exercise gets sets plus a rep range, seconds or a target weight, and can be moved up or down. Train then shows the week and today's planned exercises. Each day's planned-rest flag is saved with its date when the app opens, so later plan edits don't change past days.

Files to read first:

- `src/domain/workout.ts`: plan days, planned rest, target checks and which day rows to write.
- `src/db/workout.ts`: the plan, edited one change at a time, the starter exercises and `recordPlannedRest`.
- `src/features/train/PlanEditorScreen.tsx`: the builder, exercise picker and target form.
- `src/features/train/TrainScreen.tsx`: the week view and today's exercises.

## 2. Checks

- Unit and component tests: 503 passed in Asia/Colombo and in America/Los_Angeles.
- Domain coverage: 100% of lines (95.01% overall).
- End-to-end: 118 passed on WebKit and Chromium, including building a plan, a reload, and today's exercises on Train.
- Axe: zero serious or critical violations on the plan editor (with the picker and target sheets) and on Train with a plan, in both themes.
- Initial JS: 117.9 KB gzipped (budget 200 KB).

Bugs found and fixed:

- **Number stepper and Enter:** pressing Enter in a number stepper inside a form saved the old number, because the form submitted before the typed value was committed. This affected the existing steppers too. Enter now only commits the number.
- **Backups looking stale:** opening the app writes the day's planned-rest flag, which made every backup look out of date the next day. Those automatic rows no longer count as "changed since the last backup", though they're still backed up.

Design review: removed a duplicate Edit button from Train's header, and steadied the weekday labels in the week strip.

## 3. Try it on your iPhone

Use the `develop` branch deploy, added to the Home Screen.

1. Open Train and tap "Build my plan".
2. Tap Mon and Thu. The hint compares the number of days with your goal from setup.
3. Under Monday, tap "Add exercise", search "squat", and tap Squat. It shows "3 × 8–12 @ 20 kg".
4. Tap Squat, change the sets and weight, then Save.
5. Add Plank. Use the arrows to move it above Squat.
6. Tap "Add exercise" and create a new one, for example "Skipping" as Seconds.
7. Remove an exercise, then tap Undo.
8. Go back to Train. On a Monday it lists today's exercises; on other days it says "Planned rest".
9. Close the app and reopen it: the plan is unchanged.

## 4. Commits

- `34c2e8f` Add workout plan rules and planned-rest days
- `70f0312` Save workout plans and starter exercises
- `312e923` Add the plan builder and weekly view to Train
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 1 item 9":

- The starter exercises.
- Default targets for new exercises.
- Editing the plan today updates today's planned rest.
- Automatic day rows are left out of the backup-freshness check.

Added to `docs/QUESTIONS.md`: whether the plan should be forced to match the workouts-per-week goal from setup. I chose to show both numbers without forcing it.
