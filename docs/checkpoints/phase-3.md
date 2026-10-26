# Phase 3 report: smart features

## 1. Features

1. **Import screen and the DQ1 format:**
   - Status → Import → Paste reads `DQ1` meal, sleep and steps lines;
   - meals are reviewed against your menu before saving;
   - sleep and steps replace that day's entries;
   - steps show on Progress.

   See [p3-01-import.md](p3-01-import.md).

2. **Meal Snap and Health Sync shortcuts:** step-by-step help in Settings, and a "Copy the prompt" button with your current menu. Building the shortcuts is owner tasks 3 and 4. See [p3-02-shortcuts.md](p3-02-shortcuts.md).
3. **Gemini backup:** optional and off by default.
   - It uses your own key, kept on this phone and out of backups.
   - The photo is shrunk to 800 px and sent with your menu names.
   - The answer goes through the same review as imports.

   See [p3-03-gemini.md](p3-03-gemini.md).

4. **Visual theme polish:** no sideways scroll at 360 or 1024 px on any screen, Settings order, and a fuller dev gallery. See [p3-04-polish.md](p3-04-polish.md).
5. **Teachable Machine model (optional): deferred.** There's no labelled photo data yet; TensorFlow.js would add about 1 MB; Meal Snap and Gemini already cover photos. See `docs/PROGRESS.md`.

## 2. Checks on the phase's final commit

- `npm run check`: exit 0.
- **Unit and component tests:** 717 passed in Asia/Colombo and America/Los_Angeles.
- **Coverage:** 100% of lines in `src/domain`, 95.11% overall.
- **End-to-end:** 162 passed on WebKit (iPhone 15 Pro Max) and Chromium (Pixel 7).
- **Axe:** zero serious or critical violations.
- **Initial JS:** 124.6 KB gzipped (budget 200 KB).

## 3. iPhone test script for the whole phase

Use the `develop` branch deploy, added to the Home Screen.

1. **Health Sync:** build it (task 4). In the morning, run it, open Daily Quest → Import (clipboard icon) → Paste, check the sleep and steps lines, then Save. Sleep shows on Status; steps show on Progress.
2. **Meal Snap:** copy the prompt from Settings → Shortcut help, build Meal Snap (task 3) and put it on the Action button. Snap lunch, then Import → Paste. Check the matches, fix one, and save: it's on Food under lunch.
3. **Gemini (optional, task 5):** add your key in Settings, then on Food tap Photo, take a picture and add the meal. In airplane mode it says it needs internet.
4. **Backup:** export a backup and confirm it has no `geminiKey`.
5. **Layout:** rotate each tab to landscape and turn up the text size: no sideways scrolling.

## 4. Open questions and tasks for you

Questions: none new in Phase 3. Earlier ones are in `docs/QUESTIONS.md`.

Tasks (`docs/USER-TASKS.md`):

1. "Focus 50" shortcut (optional).
2. The six reminder automations.
3. Meal Snap shortcut.
4. Health Sync shortcut.
5. Gemini key (optional).

Also: choose a licence (`docs/PROGRESS.md`).
