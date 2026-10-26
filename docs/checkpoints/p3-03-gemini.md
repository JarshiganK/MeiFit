# Checkpoint: Phase 3 item 3 (Gemini backup)

## 1. What I built

An optional, off-by-default backup to Meal Snap.

- **Setup:** Settings → Photo recognition (Gemini) takes your own API key, which stays on this phone and is never backed up, and a model name.
- **Using it:** the Food screen then shows a Photo button. The photo, shrunk to 800 px (location data dropped), is sent with your menu names. The answer opens the same review as an import before it's saved.
- **Privacy:** the Privacy page and PRIVACY.md now describe it as available.

Files to read first:

- `src/domain/gemini.ts`: prompt, request and answer parsing.
- `src/features/food/photo.ts`: shrinking and the request (key in a header).
- `src/features/food/PhotoMeal.tsx`: the button and review.
- `src/features/settings/GeminiCard.tsx`: the settings.

## 2. Checks

- Unit and component tests: 717 passed in both time zones.
- Domain coverage: 100% of lines.
- End-to-end: 158 passed, including turning it on with axe; the CSP still only allows the Gemini origin.
- Initial JS: 124.6 KB gzipped.

## 3. Try it on your iPhone

1. Optional task 5 in `docs/USER-TASKS.md`: get a key and save it in Settings.
2. Food → Photo → take a picture of a plate → check the matches → "Add meal".
3. Turn on airplane mode and try again: "needs internet".
4. Export a backup and check the file has no `geminiKey`.

## 4. Commits

- `6e95b65` Add Gemini request and answer helpers
- `e6d905a` Share the meal review between import and photos
- `a73098c` Add optional Gemini photo recognition
- The next commit adds this report and the decision log.

## 5. Decisions, questions and tasks for me

Logged in `docs/DECISIONS.md` under "Phase 3 item 3":

- The default model name is `gemini-2.5-flash`.
- The key goes in a header.
- Photos are re-encoded.

New optional task 5: try it with your own key.
