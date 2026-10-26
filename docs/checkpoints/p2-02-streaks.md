# Checkpoint: Phase 2 Must 2 (streaks and shields)

## 1. What I built

Status now shows your streak: the days in a row with at least 5 of the 7 daily quests done. Every 7 days in a row earns a shield (up to 2), which covers a missed day by itself. The card shows how many quests today still needs to keep the streak going, and never treats today as missed before midnight. Like XP, it's worked out from your logs every time.

Files to read first:

- `src/domain/streak.ts`: the walk through the days, shields and today's rule.
- `src/domain/streak.test.ts`: shields at 7 and 14 days, the cap of 2, shield use and breaks.
- `src/features/status/StreakCard.tsx`: the card.

## 2. Checks

- Unit and component tests: 602 passed in Asia/Colombo and America/Los_Angeles.
- Domain coverage: 100% of lines.
- End-to-end: 134 passed. The quests e2e now checks the streak card ("No streak yet", then today's progress).
- Axe: zero serious or critical violations (Status scans include the card).
- Initial JS: 119.6 KB gzipped.

Test change explained: the first-visit level test now waits for the stored level, because React runs that effect just after the board appears.

## 3. Try it on your iPhone

1. Open Status. Under the level card it says "No streak yet" and "Today: 0 of 5 quests to keep it going".
2. Complete 5 quests today: the card says "Today counts" and "1-day streak".
3. Keep going for 7 days: the first shield fills in ("1 of 2 shields").
4. Miss a day after that: the next day, the card says "A shield covered <day>" and the streak continues.

## 4. Commits

- `d1e4a11` Add streak and shield rules
- `bad1c2d` Show the streak and shields on Status
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Must 2". A locked workout quest (no plan yet) doesn't lower the bar of 5. No new questions or tasks.
