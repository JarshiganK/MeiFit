# Checkpoint: Phase 1 item 7 (weight log and weekly average chart)

## 1. What I built

Progress now opens on a Weight card:

- Type today's weight and tap Save. A second weigh-in the same day replaces the first, and Undo puts it back.
- The card shows this week's average (Monday–Sunday), how many weigh-ins it's from, and the change from the week before.
- A chart of the last 12 weeks shows each weigh-in as a dot and each week's average as a line. It loads lazily and works offline.
- Recent weigh-ins can be edited or deleted.

Files to read first:

- `src/domain/body.ts`: weekly averages, weigh-ins per week and the week-to-week change.
- `src/db/body.ts`: one weigh-in per day, delete and Undo (a waist measurement on the same day is kept).
- `src/features/progress/WeightCard.tsx`: the card, the text summary and table for the chart, and the edit sheet.
- `src/features/progress/WeightChart.tsx`: the lazy Chart.js chart.

## 2. Checks

- Unit and component tests: 457 passed in Asia/Colombo and in America/Los_Angeles.
- Domain coverage: 100% of lines (95.04% overall).
- End-to-end: 102 passed on WebKit and Chromium, including saving a weigh-in and redrawing the chart offline after a reload.
- Axe: zero serious or critical violations, including Progress with the chart and the edit sheet, in both themes.
- Initial JS: 116.6 KB gzipped (budget 200 KB). The chart is a separate 57 KB chunk.

Design review: the current week's average point sat on its Thursday, which can be in the future and stretched the axis. It now sits at the middle of that week's actual weigh-ins.

Test changes explained: `src/app/App.test.tsx` expected the old Progress placeholder; Progress now opens on the Weight card.

## 3. Try it on your iPhone

Use the `develop` branch deploy, added to the Home Screen.

1. Open Progress and type today's weight (try "69,4" with a comma), then tap Save. "Today: 69.4 kg" appears.
2. Save a different weight: it replaces today's, and Undo restores the first.
3. Over a few days, check that "This week" shows the average and the number of weigh-ins.
4. After the second week, the change from the week before appears.
5. The chart shows dots for weigh-ins and a green line for weekly averages. Switch the theme in Settings: the chart follows it.
6. Tap a recent weigh-in to fix it or delete it (then Undo).
7. Turn on airplane mode and reopen Progress: the chart still draws.

## 4. Commits

- `94e5e30` Add weekly weight averages and change
- `463fe3f` Save one weigh-in per day with undo
- `f7a8fa3` Add the weight log and trend chart to Progress
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 1 item 7":

- The chart covers the last 12 weeks.
- Weights between 25 and 300 kg are accepted, stored to 0.1 kg.
- The chart is described in text and a hidden table for screen readers.

No new questions or tasks.
