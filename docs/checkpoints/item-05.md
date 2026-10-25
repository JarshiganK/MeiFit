# Checkpoint: Phase 1 item 5 (combos, plates, drinks, outside food, flex budget, calibration)

## 1. What I built

The Food screen now has:

- Combos: save a logged meal, then log it again in one tap.
- A "Quick drinks" card: +1 for your most-logged drink, plus a sheet with every drink.
- "Something else" for outside food with estimated calories and protein, optionally saved to the menu.
- A Flex day switch with the dinner budget.
- The protein calibration: a "Day N of 14" note for the first two weeks, then a day-15 card that proposes a realistic protein quest for you to confirm.

Files to read first:

- `src/domain/calibration.ts`: the 14-day window and the threshold proposal (owner change 2).
- `src/domain/flex.ts`: the flex budget and the weekly limit.
- `src/domain/food.ts` (end of file): custom entries, combo pricing and the +1 drink choice (owner change 3).
- `src/features/food/TotalsCard.tsx`: totals, flex budget, calibration note and the flex switch.
- `src/features/food/FoodScreen.tsx`: how combos, drinks and custom entries are logged.

## 2. Checks

- Unit and component tests: 419 passed in Asia/Colombo and in America/Los_Angeles.
- Domain coverage: 100% of lines (95.96% overall).
- End-to-end: 90 passed on WebKit and Chromium, including flex budget, +1 drink and a custom entry surviving a reload.
- Axe: zero serious or critical violations (Food on a flex day and the custom-entry form, both themes).
- Initial JS: 115.4 KB gzipped (budget 200 KB).

Design review: "1 protein item" and "Save lunch as a combo" ran together on one line; they now sit in a wrapping row with spacing. The drinks card is called "Quick drinks", so three different regions aren't all named "Drinks".

## 3. Try it on your iPhone

Use the `develop` branch deploy, added to the Home Screen.

1. Food: log Rice (2 cups) and Chicken curry (Normal) at lunch. Under Lunch, tap "Save lunch as a combo", name it, and save it.
2. Pick Dinner and tap the combo tile: both items are added to dinner in one tap.
3. Quick drinks: tap "+1 …". Open "All drinks" and add Plain tea twice: the +1 button switches to Plain tea.
4. Tap "Something else", enter "Shop kottu", 950 kcal and 30 g, then Add. It shows under the meal you picked.
5. Turn on "Flex day": the dinner budget appears (target minus everything before dinner) and counts down as you log dinner.
6. If your profile allows one flex day a week, a second day that week shows "You've used this week's flex day" instead.
7. In your first 14 days, the Protein section says "Day N of 14" and counts your main meals.
8. On day 15, a "Set your protein quest" card appears on Food. Adjust it if you like and tap "Use this quest".
9. Settings → Menu → Combos: delete a combo, then Undo.

## 4. Commits

- `b27d5a2` Add flex budget, protein calibration and drink rules
- `cd98bfe` Save combos, custom entries, flex days and calibration
- `2c987f9` Add combos, quick drinks, flex day and calibration UI
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 1 item 5":

- Combos are priced from the current menu when logged.
- A one-off custom entry has `foodId` 0, and the backup check now accepts that.
- The flex limit counts per Monday–Sunday week.
- The calibration proposal uses the latest weigh-in for 1.2 g/kg, can be adjusted, and appears only when viewing today.
- The +1 drink and the flex switch also go on Status with item 11.

Added to `docs/QUESTIONS.md`: whether combos should be priced from the menu at logging time (my choice) or keep the values from when they were saved.
