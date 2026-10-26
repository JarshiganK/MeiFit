# Checkpoint: Phase 2 Must 4 (exam calendar, exam mode, exam workout plan)

## 1. What I built

- **Exams and deadlines card (Study):** add exams and deadlines, then delete them with Undo.
- **Exam mode, automatic:** it switches on 14 days before an exam and ends the day after the last one. Each period is saved with its dates.
- **Exam mode, by hand:** an "Exam mode now" switch turns it on, for example for a test that isn't in the calendar.
- **While exam mode is on:**
  - study XP is ×1.5;
  - Train uses the exam workout plan (edit it in the plan editor's "Exam mode" tab);
  - the waist quest takes a break;
  - the fitness check shrinks to weight and waist.
- **Status** shows when exam mode is on and until when.

Files to read first:

- `src/domain/exams.ts`: periods from exam dates, merging, and syncing saved periods.
- `src/domain/quests.ts`: the ×1.5, the exam plan and the hidden waist quest.
- `src/db/exams.ts`: the calendar and manual exam mode.
- `src/features/study/ExamsCard.tsx`: the calendar card.

## 2. Checks

- Unit and component tests: 641 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 138 passed, including adding an exam, exam mode turning on, and the ×1.5 study quest on Status.
- Axe: zero serious or critical violations (exams card, add sheet).
- Initial JS: 120.1 KB gzipped.

Test change explained: the shared test fixture's exam period didn't match its own exam date. Now that the app syncs periods with the calendar on open, it has the period its exam implies.

## 3. Try it on your iPhone

1. **Add an exam:** Study → Exams and deadlines → add one about 3 weeks away. The card says when exam mode starts.
2. **Exam mode on:** add one 10 days away. It says "Exam mode is on until …", and Status shows the note and "Study blocks (×1.5)".
3. **Exam plan:** Train → Edit plan → switch to "Exam mode" and pick 2 days. While exam mode is on, Train says "your exam plan is in use".
4. **Manual mode:** toggle "Exam mode now" off and on again.
5. **Delete:** delete the exam, then Undo.

## 4. Commits

- `4c073b7` Add exam periods, exam-mode XP and the exam plan rule
- `0a16916` Keep exam periods in step with the calendar
- `714039b` Add the exam calendar, exam mode and exam plan UI
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 2 Must 4":

- Finished periods are never rewritten.
- Manual mode runs until switched off.
- With no exam plan, the normal plan stays in use.

No new questions or tasks.
