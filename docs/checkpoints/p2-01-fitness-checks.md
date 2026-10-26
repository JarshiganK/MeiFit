# Checkpoint: Phase 2 Must 1 (fitness checks and waist log)

## 1. What I built

Every 4 weeks (3–6, set in Settings) a banner on Status opens the fitness check.

- **The flow:** body (weekly average weight plus waist), strength (estimated 1-rep max for up to 3 lifts), endurance (push-ups, plank, squats), resting heart rate, then a review.
- **The review:** each result next to your last check, the last 4 weeks' averages, and recalculated targets with the plan's adjustment rule. You switch on only the changes you want, and it offers "maintain" when you reach your goal.
- **Resuming:** the check resumes if iOS closes the app.
- **Rewards:** 50 VIT, plus STR for improved tests.
- **Waist:** Progress has a waist field, and a "Measure your waist" weekly quest (15 XP) every 2 weeks.

Files to read first:

- `src/domain/fitness.ts`: due dates and windows, 1RM, rewards, the protein nudge, the calorie rule and the waist cadence.
- `src/domain/review.ts`: the 4-week averages (also used by the weekly report).
- `src/features/fitness/FitnessCheckFlow.tsx`: the flow and its review.
- `src/db/fitness.ts`: saving the check, waist, targets and goal in one transaction.

## 2. Checks

- Unit and component tests: 589 passed (before the two extra domain tests added afterwards) in Asia/Colombo and America/Los_Angeles.
- Domain coverage: 100% of lines.
- End-to-end: 134 passed, including the full check from the Status banner.
- Axe: zero serious or critical violations on every step of the check and on the banner, in both themes.
- Initial JS: 119.4 KB gzipped (budget 200 KB).

Test changes are explained in `docs/DECISIONS.md`. The Weight card now has two Save buttons, so the weight tests target the weight form's.

## 3. Try it on your iPhone

Use the `develop` branch deploy, added to the Home Screen.

1. **Banner:** around your baseline date (setup booked it within 7 days), Status shows "Fitness check due". Tap "Start the check".
2. **Body:** check the weekly average weight. Enter your waist and read the photo reminder.
3. **Strength:** pick up to 3 lifts and see their estimated 1-rep max.
4. **Endurance:** do push-ups, the plank and 60 s of squats, and enter each (any can be left empty).
5. **Resume:** close the app mid-check and reopen /fitness-check from the banner. It picks up at the same step.
6. **Review:** check the results and the 4-week averages. Switch on "Use the new targets" if you agree, then Save. Progress lists the check, and your XP rises by 50.
7. **Next check:** improve a test then, and the review shows "Up" and extra STR.
8. **Waist:** on Progress, log a waist. The weekly quest "Measure your waist" ticks.
9. **Interval:** in Settings → Fitness checks, change the interval to 6 weeks. The next due date moves.

## 4. Commits

- `e35bebf` Add fitness check, waist and review rules
- `71934b7` Save fitness checks, waist and their targets
- `f06a2d2` Add the fitness check flow, banner and waist log
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Must 1":

- Each target change is a separate switch, off by default.
- Calorie adjustments of ±175 kcal.
- Halfway protein nudges.
- The waist quest's 13-day cadence.

Added to `docs/QUESTIONS.md`: whether target changes at a check should default to on.
