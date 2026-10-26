# Checkpoint: Phase 2 Nice 3 (achievements)

## 1. What I built

Progress has an Achievements card with five from plan §7, each with a description and a progress bar:

- Iron Week (a 7-day streak)
- Protein Hunter (30 protein days)
- Scholar (100 study blocks)
- PR Breaker (10 records)
- Checkpoint (3 fitness checks)

They're worked out from your logs.

Files to read first:

- `src/domain/achievements.ts`.
- `src/features/progress/AchievementsCard.tsx`.

## 2. Checks

- Unit and component tests: 679 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 146 passed (Progress axe scans include the card).
- Initial JS: 121.8 KB gzipped.

## 3. Try it on your iPhone

1. Progress → Achievements shows "0 of 5 unlocked" and five bars.
2. After your third fitness check, Checkpoint shows "Unlocked".

## 4. Commits

- `33ef0ed` Add achievement rules
- `adffcfd` Show achievements on Progress
- The next commit adds this report.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Nice 3". No new questions or tasks.
