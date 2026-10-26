# Checkpoint: Phase 3 item 1 (import screen and the DQ1 format)

## 1. What I built

Status has an Import button. Run a Shortcut, come back, tap Import, then Paste. The app reads the `DQ1` lines:

- **Meals** open on a review card. The meal slot comes from the photo time, foods are matched to your menu, and you can change or skip any of them.
- **Sleep and steps** replace that day's entries.

Lines it can't read are listed with the reason. A text box covers the case where the clipboard can't be read. Progress shows imported steps.

Files to read first:

- `src/domain/importFormat.ts`: the parser and fuzzy matching.
- `src/features/import/ImportScreen.tsx`: paste, review and save.
- `src/db/imports.ts`: replace-on-import for sleep and steps.

## 2. Checks

- Unit and component tests: 705 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 154 passed, including an import of a meal, a night and steps, with axe on the review screen.
- Initial JS: 123.6 KB gzipped.

## 3. Try it on your iPhone

1. Copy this text (from Notes): `DQ1;meal;2026-10-25T13:05;chicken curry,rice`, adjusting the date to today.
2. Open Daily Quest → Status → Import (clipboard icon) → Paste, then tap Safari's small Paste button.
3. Check the matches, change one, and tap "Save import": it's on Food under the right meal.
4. Try a sleep line and a steps line: they replace that day's entries, and steps show on Progress.

## 4. Commits

- `9eb7086` Add the DQ1 import parser and menu matching
- `e07e4ec` Save imported meals, sleep and steps
- `2ef1e1c` Add the import screen and a steps card
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 3 item 1":

- A sleep import replaces every sleep ending that day.
- Imported foods are logged at one serving.
- The e2e test uses the text box.

The Shortcuts that produce these lines come next (owner tasks).
