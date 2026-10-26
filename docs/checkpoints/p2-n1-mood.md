# Checkpoint: Phase 2 Nice 1 (mood check-in)

## 1. What I built

Status has a "How are you today?" card. Tap energy (1–5) and mood (1–5), one tap each: it saves straight away and earns +5 XP once a day. It's hidden in exam mode.

Files to read first:

- `src/features/status/MoodCard.tsx`: the card.
- `src/db/mood.ts`: one check-in a day.
- `src/domain/quests.ts` (`bonusBreakdown`): the +5, skipped in exam mode.

## 2. Checks

- Unit and component tests: 673 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 146 passed (Status axe scans include the card).
- Initial JS: 121.6 KB gzipped.

## 3. Try it on your iPhone

1. On Status, tap an energy number and a mood number. The card says "Checked in for today", and total XP rises by 5.
2. Tap a different number: it updates, and no extra XP is given.
3. Turn on exam mode (Study → "Exam mode now"): the card disappears.

## 4. Commits

- `43d6377` Add mood check-ins and their XP
- `a00eab6` Add the mood check-in card to Status
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Nice 1". No new questions or tasks.
