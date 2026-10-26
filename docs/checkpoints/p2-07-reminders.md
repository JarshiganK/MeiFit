# Checkpoint: Phase 2 Must 7 (Shortcuts reminders)

## 1. What I built

Settings → Shortcut help explains how to set up the six reminders from plan §11 as iOS Personal Automations, because a Home Screen app can't send notifications itself. It lists each reminder's time and text, names your training days for the "Gym time" one, and gives five steps. It also explains the "Focus 50" shortcut behind the Study screen's alarm button.

Files to read first:

- `src/features/settings/ShortcutHelpScreen.tsx`: the page.
- `src/copy/en.ts` (`shortcuts`): the reminder table and steps.

## 2. Checks

- Unit and component tests: 669 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 145 passed. The new page has an axe scan in both themes.
  - One WebKit test was flaky: four axe scans took about 29 s against a 30 s limit. It now has 90 s, with the same assertions.
- Initial JS: 121.5 KB gzipped.

## 3. Try it on your iPhone

1. Settings → Shortcut help.
2. Follow the steps to add "Daily quests ready" at 7:00, then check the notification arrives.
3. Repeat for the other five reminders (task 2 in `docs/USER-TASKS.md`).

## 4. Commits

- `fca7303` Add Shortcut help for reminders and the focus alarm
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

- New task: set up the six automations (`docs/USER-TASKS.md`, task 2). It can only be done on the iPhone.
