# Checkpoint: Phase 2 Must 5 (rest timer and PR detection)

## 1. What I built

Ticking a set now starts a rest timer: a bar on Train counts down 90 s (or your setting) and offers +15 s and Skip. It keeps time from its start, so it's right after you switch apps. A set that beats every earlier session for that exercise is a personal record: the toast says so, and it earns +25 STR (once per exercise per day). Records are judged by estimated 1RM for lifts, reps for bodyweight moves and seconds for holds. Progress lists your best for each exercise.

Files to read first:

- `src/domain/records.ts`: records and the rest countdown.
- `src/features/train/SessionCard.tsx` (`tick`): starting rest and spotting a record.
- `src/features/train/RestTimerBar.tsx`: the bar.
- `src/features/progress/RecordsCard.tsx`: the Progress card.

## 2. Checks

- Unit and component tests: 650 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 138 passed. The session test now sees the rest bar, and its axe scan covers it.
- Axe: zero serious or critical violations.
- Initial JS: 120.4 KB gzipped.

## 3. Try it on your iPhone

1. On Train, tick a set: "Rest 01:30" appears at the top. Tap "+15 s", then let it run out: "Rest's over. Next set!".
2. Switch to another app for a minute and come back: the countdown is still right.
3. Change "Rest between sets" in Edit plan to 60 s, then tick again.
4. Beat last session (one more rep, or more weight): the toast says "New personal record! +25 STR".
5. Progress → Personal records lists your best per exercise.

## 4. Commits

- `d3accaa` Add personal record and rest timer rules
- `b3e0b49` Load records and keep the rest timer per phone
- `0b6dc8b` Add the rest timer, record toasts and records card
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Must 5":

- An exercise's first day is never a record.
- One record per exercise per day.
- The rest timer is visual only: iOS can't ring for a paused web app.

No new questions or tasks.
