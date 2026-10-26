# Phase 2 report: upgrade

## 1. Features

Must:

1. **Fitness checks and waist log:**
   - every 3–6 weeks, with a Status banner;
   - body, strength (estimated 1RM), endurance and recovery;
   - a review with confirmable target changes and a goal switch;
   - the waist quest every 2 weeks.

   See [p2-01-fitness-checks.md](p2-01-fitness-checks.md).

2. **Streaks and shields:** 5+ quests a day, shields at 7 and 14 days (up to 2), never missed before midnight. See [p2-02-streaks.md](p2-02-streaks.md).
3. **Stats and ranks:** STR, VIT and INT levels scaled to a typical week; ranks E–S. See [p2-03-stats-ranks.md](p2-03-stats-ranks.md).
4. **Exam calendar, exam mode and exam workout plan:**
   - automatic periods 14 days before exams, or by hand;
   - study XP ×1.5, the exam plan, no waist quest, a shorter fitness check.

   See [p2-04-exam-mode.md](p2-04-exam-mode.md).

5. **Rest timer and PR detection:** a timestamp-based rest bar; records for lifts, reps and holds (+25 STR); a records card. See [p2-05-rest-records.md](p2-05-rest-records.md).
6. **Weekly report and boss:**
   - the Monday boss: weight on track, workouts, study; 100 XP and a title;
   - a weekly report with a calorie check.

   See [p2-06-weekly-boss.md](p2-06-weekly-boss.md).

7. **Shortcuts reminders:** Settings → Shortcut help, with the six reminders and the Focus alarm. See [p2-07-reminders.md](p2-07-reminders.md).

Nice:

1. **Mood check-in:** one tap each for energy and mood, +5 XP a day, hidden in exam mode. See [p2-n1-mood.md](p2-n1-mood.md).
2. **Hours per subject:** the week's hours by subject on Study. See [p2-n2-subject-hours.md](p2-n2-subject-hours.md).
3. **Achievements:** Iron Week, Protein Hunter, Scholar, PR Breaker and Checkpoint. See [p2-n3-achievements.md](p2-n3-achievements.md).
4. **Progression suggestions:** "Ready to step up", one tap to raise the target. See [p2-n4-progression.md](p2-n4-progression.md).
5. **Missed-session reschedule:** a rest day offers this week's missed workout. See [p2-n5-reschedule.md](p2-n5-reschedule.md).

## 2. Checks on the phase's final commit

- `npm run check`: exit 0.
- **Unit and component tests:** 689 passed in Asia/Colombo and America/Los_Angeles.
- **Coverage:** 100% of lines in `src/domain`, 95.34% overall.
- **End-to-end:** 146 passed on WebKit (iPhone 15 Pro Max) and Chromium (Pixel 7).
- **Axe:** zero serious or critical violations on every screen and sheet tested, in both themes.
- **Initial JS:** 121.9 KB gzipped (budget 200 KB).

## 3. iPhone test script for the whole phase

Use the `develop` branch deploy, added to the Home Screen.

1. **Morning:**
   - Status shows your level, rank, stats, streak and shields.
   - Check in your energy and mood.
   - Tap "I'm awake".
2. **Fitness check:** when its banner shows, run it (waist, push-ups, plank, squats), review the targets and save. Progress lists it, and the waist quest ticks.
3. **Food:** log meals through the day. Watch the quests tick and the streak line ("Today: x of 5").
4. **Train:**
   - tick sets: the rest bar counts down;
   - beat last time to see "New personal record";
   - next time, try "Update plan" on a "Ready to step up" suggestion.
5. **Study:**
   - run a focus block with a subject;
   - add an exam 10 days away: exam mode turns on, Status shows "Study blocks (×1.5)", and the mood card hides;
   - Train uses the exam plan if you've built one (Edit plan → Exam mode).
6. **Missed workout:** skip a training day. The next rest day offers "Do …'s workout".
7. **Monday:**
   - Status shows last week's boss;
   - Progress shows the weekly report, the boss parts and, if suggested, the calorie check;
   - after 3 fitness checks, Achievements unlocks Checkpoint.
8. **Reminders:** Settings → Shortcut help. Set up the six reminders.

## 4. Open questions and tasks for you

Questions (`docs/QUESTIONS.md`):

- Combos: today's menu values or the saved ones? (Today's.)
- "Something else" entries as protein items when switched on? (Yes.)
- Force the plan's training days to match workouts per week? (No.)
- Fitness check target switches on by default? (Off: you confirm each.)
- The stat balance constants (`TYPICAL_WEEK_XP`): tune after 2 weeks.
- One exam day lowering the boss's workout target to 2? (Yes, lenient.)

Tasks (`docs/USER-TASKS.md`):

1. Create the optional "Focus 50" shortcut.
2. Set up the six reminder automations.

Still open from earlier:

- Choose a licence.
- Confirm offline from the Home Screen on the iPhone.
