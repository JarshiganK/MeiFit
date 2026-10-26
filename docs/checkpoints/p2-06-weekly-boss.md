# Checkpoint: Phase 2 Must 6 (weekly report and boss)

## 1. What I built

Every Monday, the finished week is judged by the weekly boss. You beat it with:

- weight on track for your goal, with 3+ weigh-ins;
- your workout target, or 2 in exam mode;
- your weekly study hours.

Beating it earns 100 XP and a title. Progress has a weekly report for each finished week: averages, weight change, the boss, your titles, and the plan's calorie suggestion with an "Apply from today" button. Status shows this week's boss progress, plus last week's result on Mondays.

Files to read first:

- `src/domain/weekly.ts`: the boss rules, the report and the titles.
- `src/domain/xp.ts`: XP totals including boss wins.
- `src/features/progress/WeeklyReportCard.tsx`: the report and the calorie check.
- `src/db/profile.ts` (`applyCalorieChange`): applying a suggestion.

## 2. Checks

- Unit and component tests: 667 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 142 passed, including the Monday banner and the report.
- Axe: zero serious or critical violations.
- Initial JS: 120.8 KB gzipped.

## 3. Try it on your iPhone

1. During the week, Status → This week shows the boss parts: weigh-ins, workouts and study.
2. On Monday, Status shows "Last week's boss". Tap "See the weekly report".
3. On Progress, read the report and use ‹ to look at earlier weeks.
4. If the calorie check appears (fat loss, average not dropping), tap "Apply from today". The Food screen's target follows.
5. Beat the boss to earn a title: it's listed under "Titles earned".

## 4. Commits

- `23941c0` Add the weekly boss, report and XP totals
- `8d5d425` Apply suggested calorie changes from a report
- `722404b` Show the weekly report and boss on Progress and Status
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Must 6":

- Any exam day in a week lowers the workout target to 2.
- The reference weight falls back to the starting weight.
- The calorie check is ±175 kcal and can be applied once a day.

Added to `docs/QUESTIONS.md`: whether a single exam day should be enough to lower the boss's workout target.
