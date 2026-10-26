# Checkpoint: Phase 2 Nice 2 (hours per subject)

## 1. What I built

Study's "This week" card now lists your hours per subject ("Maths: 1.5 h"), most first, with untagged sessions as "No subject".

Files to read first:

- `src/domain/study.ts` (`minutesBySubject`).
- `src/features/study/StudyScreen.tsx`.

## 2. Checks

- Unit and component tests: 675 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 146 passed.
- Initial JS: 121.6 KB gzipped.

## 3. Try it on your iPhone

1. Study → pick a subject → run or add a session. Repeat with another subject.
2. "This week" shows "By subject" with the hours for each.

## 4. Commits

- `b88d2f2` Add study minutes per subject
- `c74abcb` Show this week's hours per subject on Study
- The next commit adds this report.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Nice 2". No new questions or tasks.
