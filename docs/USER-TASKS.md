# Tasks for the owner

Things that need your accounts or your phone. Numbered steps; tick them off as you go.

## Open

1. **Create the "Focus 50" shortcut (optional, plan §11 Shortcut C).** It lets an alarm ring when a focus block ends, even with the app closed.
   1. On your iPhone, open Shortcuts and tap +.
   2. Add the action "Start Timer", set it to 50 minutes.
   3. Name the shortcut exactly **Focus 50** and tap Done.
   4. If you use a different block length (for example 25), make one named "Focus 25" too: the app opens "Focus <minutes>" for the length you pick.
   5. In Daily Quest, open Study and tap "Also start a Clock alarm". The first time, iOS asks to open Shortcuts: allow it. Check that the Clock timer starts and that you can switch back to the app.
2. **Set up the six reminders (plan §11).** Daily Quest can't send notifications itself; Shortcuts does it. The same steps are in the app under Settings → Shortcut help.
   1. Open Shortcuts → Automation → + → Time of Day.
   2. Make one automation for each: Daily 7:00 "Daily quests ready"; Daily 12:30 "Lunch: two proteins"; 18:00 on your training days "Gym time"; Daily 22:15 "Wind down, log sleep"; Saturday 9:00 "Export a backup; fitness check if due"; Monday 7:00 "Weekly boss result and report".
   3. For each: choose Run Immediately, add the action Show Notification with the text above, and tap Done.
   4. Adjust the times to your lecture timetable.
   5. Check that each one shows a notification at its time.
3. **Build the Meal Snap shortcut (plan §11, Shortcut A).** Needs an iPhone with Apple Intelligence (Private Cloud Compute).
   1. In Daily Quest: Settings → Shortcut help → Meal Snap → "Copy the prompt" (it includes your current menu).
   2. In Shortcuts: + → Take Photo → Use Model (Private Cloud Compute) with the copied prompt.
   3. Add Text: `DQ1;meal;` then the Current Date (format ISO 8601), `;`, then the model's answer. Add Copy to Clipboard.
   4. Add Show Notification "Meal copied. Open Daily Quest and tap Import." Name it "Meal Snap".
   5. Optional: Settings → Action Button → Shortcut → Meal Snap.
   6. Test: snap a plate, open Daily Quest → Import → Paste, and check the review screen.
4. **Build the Health Sync shortcut (plan §11, Shortcut B).**
   1. Follow Settings → Shortcut help → Health Sync in the app.
   2. Test: run it, open Daily Quest → Import → Paste, and check the sleep and steps lines.
   3. Optional: make it a 7:00 Personal Automation.
