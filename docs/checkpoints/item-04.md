# Checkpoint: Phase 1 item 4 (starter menu, tap logging, daily totals)

## 1. What I built

The Food screen now logs meals in two taps: tap a menu item, then a portion (rice in ½–3 cups, other items small / normal / large, pieces × 1–10). It shows today's ≈ calories against the target, a protein bar, and what's been logged by meal, where any line can be resized, moved or removed with Undo. A day switcher lets you fill in an earlier day, and Settings → Menu edits the menu without changing past days.

Files to read first:

- `src/domain/food.ts`: portions, the default meal slot by time, item snapshots, day totals and menu-item validation.
- `src/db/food.ts`: logging, editing the log and the menu (one `meals` row per tap, so Undo is exact).
- `src/features/food/FoodScreen.tsx`: the screen, totals card and portion sheet.
- `src/features/food/DayLog.tsx`: the day's meals by slot and the change/remove sheet.
- `src/features/settings/MenuEditorScreen.tsx`: add, edit, remove and put back menu items.

## 2. Checks

- Unit and component tests: 377 passed in Asia/Colombo and in America/Los_Angeles.
- Domain coverage: 100% of lines (95.97% overall).
- End-to-end: 84 passed on WebKit and Chromium, including logging a meal, a reload, and adding a menu item then logging it.
- Axe: zero serious or critical violations, including the Food screen with meals, the portion sheet, the menu editor and its form, in both themes.
- Initial JS: 114.6 KB gzipped (budget 200 KB).

Design review (screenshots in `test-results/screens/`): I moved the Logged card above the menu, so today's meals show without scrolling past the whole menu.

Test changes explained:

- `src/app/App.test.tsx`: the Food tab test expected the Phase 0 placeholder ("Meals will live here"). The Food screen is real now; its designed empty state for an empty menu is "Your menu is empty".

## 3. Try it on your iPhone

Use the `develop` branch deploy, added to the Home Screen, with the starter menu loaded at setup.

1. Open Food. The meal picker should already be on the meal for the time of day.
2. Tap Rice, then "1½ cups". A toast says "Added Rice (1½ cups) to lunch" (or the current meal). Totals show ≈300 kcal.
3. Tap Chicken curry, then Normal. "1 protein item" appears under the meal.
4. Tap Plain tea, then × 2. It goes under Drinks whatever meal is picked.
5. Tap Undo on a toast: that item disappears.
6. Tap a logged line: change the portion, move it to Dinner, or Remove (then Undo).
7. Tap the left arrow for Yesterday and log something; go back to Today and it isn't there.
8. Settings → Menu → Add item: add "Fish curry", 180 kcal, 18 g, Counts as a protein. It appears on the Food screen straight away.
9. Edit Rice to 210 kcal: earlier rice logs keep ≈200 per cup.
10. Close the app fully and reopen: everything is still there. Try it in airplane mode too.

## 4. Commits

- `4c542c6` Add portion, meal slot and daily total rules
- `2c62f0e` Save tap-logged meals and menu edits
- `460d923` Add Food screen logging and the menu editor
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 1 item 4":

- One `meals` row per tap.
- Past-day logs are stamped at a typical time for the meal.
- Under-18s see protein only, and new items they add are saved with 0 kcal.
- Menu items are archived rather than deleted.
- `Sheet` now ignores the close event of its own `close()`.

No new questions or tasks.
