# Checkpoint: Phase 2 Nice 4 (progression suggestions)

## 1. What I built

When your last session hit the top of the target on every set, Train shows "Ready to step up" for that exercise: +2.5 kg for lifts, +2 reps for bodyweight moves, or +5 s for holds. "Update plan" raises the target, and today's sets pre-fill with the new weight.

Files to read first:

- `src/domain/session.ts` (`progressionFor` and `prefill`).
- `src/features/train/SessionCard.tsx`.

## 2. Checks

- Unit and component tests: 684 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 146 passed.
- Initial JS: 121.8 KB gzipped.

## 3. Try it on your iPhone

1. Do every set of an exercise at the top of its rep range, at or above its target weight.
2. Next time it's planned, Train shows "Ready to step up: … @ +2.5 kg". Tap "Update plan".
3. The sets pre-fill with the new weight.

## 4. Commits

- `946d879` Add progression suggestions and pre-fill raised targets
- `b4dad84` Suggest a step up on Train and update the plan
- The next commit adds this report.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Nice 4". No new questions or tasks.
