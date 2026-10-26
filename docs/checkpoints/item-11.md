# Checkpoint: Phase 1 item 11 (quest board, XP and levels)

## 1. What I built

Status is now the quest board:

- **Level card:** your level, an XP bar and total XP.
- **Today's quests:** the seven daily quests of plan §7, each with its progress and XP.
- **This week:** the weekly quests (3 weigh-ins, a backup).
- **Quick logs:** sleep, the Quick drinks +1 and the flex-day switch.

XP is never stored: it's worked out from everything you've logged since setup, so earlier days count too, and fixing a log fixes the XP. Reaching a new level shows a short celebration you can tap away.

Files to read first:

- `src/domain/quests.ts`: every quest rule, weekly quests and total XP.
- `src/domain/levels.ts`: the level curve (2,025 XP for level 10, 67,275 for level 70).
- `src/features/status/QuestBoard.tsx`: how each quest is named and described.
- `src/features/status/LevelCard.tsx`: the XP bar and the level-up moment.

## 2. Checks

- Unit and component tests: 561 passed in Asia/Colombo and in America/Los_Angeles.
- Domain coverage: 100% of lines (94.9% overall).
- End-to-end: 130 passed on WebKit and Chromium. This includes logging a protein breakfast on Food, seeing its quest done and XP rise on Status, and the result surviving a reload.
- Axe: zero serious or critical violations on Status with quests and on the level-up dialog, in both themes.
- Initial JS: 117.8 KB gzipped (budget 200 KB).

Bug found in the design review: the level number and the study countdown used text sizes the theme doesn't define, so they rendered tiny. Both are fixed, and a new test (`tests/token-classes.test.ts`) fails on any undefined text size.

## 3. Try it on your iPhone

Use the `develop` branch deploy, added to the Home Screen.

1. Open Status: Level 1, "125 XP to level 2", and seven quests.
2. On Food, log an egg at breakfast. Back on Status, "Protein at breakfast" is ticked and XP is up by 10.
3. Log lunch and dinner with two protein items each. Those quests tick too.
4. In your first 14 days, the protein quest reads "Log all three main meals".
5. Tick 80% of today's sets on Train: the Workout quest is done (+50). On a rest day it's "Rest day" (+10).
6. Finish a focus block: Study blocks shows 1 of 5 (+30).
7. Tap "I'm awake" after a full night: the sleep quest ticks.
8. Turn on Flex day on Status: the dinner quest becomes "Flex dinner within budget".
9. When you pass 125 XP, a "Level up!" card appears once. Tap anywhere to close it.
10. Delete a logged meal: its quest unticks and the XP goes back down.

## 4. Commits

- `5bb2744` Add quest, XP and level rules from the logs
- `93ab768` Load quest history from the logs
- `52d21ff` Show the quest board, level and XP on Status
- The next commit adds this report, the Phase 1 report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 1 item 11":

- With no plan, the workout quest is locked and isn't counted in today's XP.
- Weekly XP is credited once the week ends.
- The level-up moment is remembered per phone.
- Stats, ranks, streaks and exam mode start in Phase 2.

No new questions or tasks.
