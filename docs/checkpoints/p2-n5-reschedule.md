# Checkpoint: Phase 2 Nice 5 (missed-session reschedule)

## 1. What I built

If a training day earlier this week went by without a workout, the next rest day offers it: "You missed Thursday's workout. Do it today?". One tap runs that plan day today. Days made up already, or trained, aren't offered.

Files to read first:

- `src/domain/session.ts` (`missedSessions`).
- `src/features/train/TrainScreen.tsx` and `SessionCard.tsx`.

## 2. Checks

- Unit and component tests: 689 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 146 passed.
- Initial JS: 121.9 KB gzipped.

## 3. Try it on your iPhone

1. Skip a planned training day.
2. On the next rest day that week, Train shows "You missed …'s workout". Tap "Do …'s workout".
3. Tick its sets as usual: the workout quest counts for today.

## 4. Commits

- `e1e9f85` Add the missed-session rule
- `8cdab22` Offer a missed workout on rest days
- The next commit adds this report and the Phase 2 report.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Nice 5". No new questions or tasks.
