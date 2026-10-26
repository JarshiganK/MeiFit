# Checkpoint: Phase 2 Must 3 (stats and ranks)

## 1. What I built

The level card now shows your rank (E to S, by level) and where the next rank starts. It also shows three stats: STR, VIT and INT, each with its own level and bar. Each quest's XP goes to its stat, and a fitness check adds VIT and STR. Stats are scaled so a typical week moves each by about the same amount; the scale is a constant you can tune after 2 weeks.

Files to read first:

- `src/domain/stats.ts`: stat scaling, stat levels and ranks.
- `src/domain/quests.ts` (`xpBreakdown`): XP by stat.
- `src/features/status/LevelCard.tsx`: the rank and stats on Status.

## 2. Checks

- Unit and component tests: 620 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 134 passed.
- Axe: zero serious or critical violations.
- Initial JS: 119.7 KB gzipped.

## 3. Try it on your iPhone

1. Open Status. The level card shows "Rank E" and "Rank D at level 10", and below the XP bar, STR, VIT and INT at Lv 1.
2. Complete a few food and sleep quests: the VIT bar fills.
3. Finish a focus block: the INT bar moves.
4. Tick a workout: the STR bar moves.

## 4. Commits

- `0a6c3bf` Add stat levels, ranks and an XP breakdown
- `d166be3` Show rank and stats on the level card
- Also fixed: `docs/checkpoints/p2-02-streaks.md` now lists its commit hashes (`d1e4a11`, `bad1c2d`).

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Must 3". New question: are the typical-week XP figures used to balance the stats fair? Tune them after 2 weeks.
