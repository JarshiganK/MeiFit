# Questions for the owner

Decisions made during unattended builds that you may want to review. Each one is logged in full in `docs/DECISIONS.md`, and each was chosen to be safe and easy to undo.

| Date       | Item | Question                                                                                  | What I chose                                                                        |
| ---------- | ---- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 2026-10-26 | 5    | Should a combo use today's menu values when logged, or the values from when it was saved? | Today's menu values, so a corrected menu item fixes its combos too. Easy to switch. |
| 2026-10-26 | 5    | Should "Something else" entries be judged as protein items?                               | Yes, when the "Counts as a protein" switch is on (off by default).                  |
