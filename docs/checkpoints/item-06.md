# Checkpoint: Phase 1 item 6 (two-tap sleep log)

## 1. What I built

Status now has a Sleep card. Tap "Going to sleep" at night and "I'm awake" in the morning, and the night is saved on the day you woke up (plan §5). If "I'm awake" comes more than 16 hours later, the app asks for the real wake time instead of guessing (owner change 4). The last sleep shows its length and times, and has Edit and Delete with Undo; "Add a sleep" covers a forgotten night.

Files to read first:

- `src/domain/sleep.ts`: wake-date rule, the 16-hour check, validation and the main sleep of a day.
- `src/db/sleep.ts`: the open sleep (a setting) and the sleep log.
- `src/features/status/SleepCard.tsx`: the card, the wake-time question and the edit form.

## 2. Checks

- Unit and component tests: 441 passed in Asia/Colombo and in America/Los_Angeles.
- Domain coverage: 100% of lines (96.04% overall).
- End-to-end: 96 passed on WebKit and Chromium, including a night across midnight with a reload in between.
- Axe: zero serious or critical violations, including Status with a sleep and the edit sheet, in both themes.
- Initial JS: 115.9 KB gzipped (budget 200 KB).

Bug found by e2e and fixed: before 07:00, "Add a sleep" suggested a wake time later today, which then failed the "not in the future" check. It now suggests the most recent night that has already ended.

Design review: the "Add a sleep" button now lines up with the card's text.

## 3. Try it on your iPhone

Use the `develop` branch deploy, added to the Home Screen.

1. At bedtime, open Status and tap "Going to sleep". It shows "Sleeping since …".
2. Close the app. In the morning, open it and tap "I'm awake". A toast shows how long you slept, and the card shows the times and "woke <day>".
3. Tap Undo on that toast: you're back to "Sleeping since …". Tap "I'm awake" again.
4. Tap Edit, change either time and Save. Then try a wake time before the bedtime: it explains the problem.
5. To test the forgotten tap: tap "Going to sleep", then tap "I'm awake" more than 16 hours later. It asks "When did you wake up?".
6. Tap "Add a sleep" to enter a night you forgot to log.

## 4. Commits

- `abd12b3` Add sleep rules for wake dates and long sleeps
- `292cea9` Save open sleeps and sleep logs
- `77c256b` Add the two-tap sleep card to Status
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 1 item 6":

- The open sleep is a setting rather than a half-filled log.
- Hand entries and edits are saved as "manual".
- The longest sleep of a day is the main one.

No new questions or tasks.
