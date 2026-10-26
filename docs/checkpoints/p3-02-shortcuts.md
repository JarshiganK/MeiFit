# Checkpoint: Phase 3 item 2 (Meal Snap and Health Sync shortcuts)

## 1. What I built

Settings → Shortcut help now explains, step by step, how to build the Meal Snap shortcut (photo → Private Cloud Compute → `DQ1;meal` line) and the Health Sync shortcut (sleep and steps from Apple Health). "Copy the prompt" puts the Meal Snap prompt, filled with your current menu, on the clipboard. Both land on the Import screen from item 1.

Files to read first:

- `src/features/settings/ShortcutHelpScreen.tsx`.
- `src/copy/en.ts` (`shortcuts`).

## 2. Checks

- Unit and component tests: 706 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 154 passed (Shortcut help has an axe scan in both themes).
- Initial JS: 124.2 KB gzipped.

## 3. Try it on your iPhone

1. Settings → Shortcut help → Meal Snap → "Copy the prompt".
2. Build the shortcut (`docs/USER-TASKS.md`, task 3), snap a plate, then Import → Paste.
3. Build Health Sync (task 4), run it, then Import → Paste.

Only the iPhone can test this: Private Cloud Compute and Apple Health aren't available in automated tests.

## 4. Commits

- `65f65b5` Add Meal Snap and Health Sync help with a prompt copier
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

New tasks 3 (Meal Snap) and 4 (Health Sync) in `docs/USER-TASKS.md`.
