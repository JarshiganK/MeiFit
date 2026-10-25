# Daily Quest System: Master Plan

Oct 25, 2026 · @Jarshigan

## 1. Overview and goals

Daily Quest is a "System"-style life RPG for your phone: daily quests, XP and levels for diet, training, sleep and study. Nothing about you is built in. You enter your details at first launch, and the app calculates your targets from them.

- It's a free, offline, installable web app (PWA), built on an ASUS Vivobook and used from the iPhone Home Screen.
- All data stays on the phone. There's no account and no server, so "login" is a one-time setup, not a password.
- Studies always come first. The app supports studying and never competes with it.
- Hostel food can't be counted exactly, so the app estimates calories and judges progress by your weight trend.

Default goals, all changeable at setup: lose fat while getting stronger (or maintain, or build muscle), study consistently, sleep 7+ hours, and check your fitness every 4 weeks.

## 2. First-launch setup and targets

The first time the app opens, a 2-minute setup collects your details and shows the targets it calculated, which you can edit. You can change any answer later in Settings → Profile, or rerun the whole setup.

**Setup steps**

1. **Install check.** If the app is open in a Safari tab, it shows how to add it to the Home Screen first, because the tab and the Home Screen app keep separate data. It then asks for persistent storage.
2. **About you.** Nickname, sex (used only in the calorie formula), date of birth, height, current weight and activity level.
3. **Goal.** Lose fat, maintain or build muscle; pace (slow or standard); optional goal weight and goal waist.
4. **Routine.** Workouts per week, flex days per week (0–4), sleep target (default 7 h), weekly study-hour goal and study block length (default 50 min).
5. **Food.** Load the Sri Lankan hostel starter menu (section 18) or start with an empty menu.
6. **Exams.** Add exam dates now or later.
7. **Review.** See your calorie and protein targets, edit them if you want, and book your baseline fitness check within 7 days.

**How targets are calculated**

| Step | Formula |
| --- | --- |
| BMR (Mifflin-St Jeor) | 10 × kg + 6.25 × cm − 5 × age, then +5 (male) or −161 (female) |
| Maintenance (TDEE) | BMR × activity: 1.2 mostly sitting, 1.375 light (1–3 workouts a week), 1.55 moderate (3–5), 1.725 very active |
| Calorie target | Lose fat: TDEE − 250 (slow, about 0.25 kg a week) or − 500 (standard, about 0.5 kg a week). Maintain: TDEE. Build muscle: TDEE + 250 |
| Calorie floor | The higher of your BMR and 1,500 kcal (male) or 1,200 kcal (female). The target never goes below it |
| Protein target | 1.8 g per kg of body weight, never below 1.6 g/kg. Uses goal weight instead for someone well above a healthy weight |
| On-track weight change | Lose fat: losing 0.25–1.0% of body weight a week. Maintain: within ±1% of goal weight. Build muscle: gaining 0–0.25% a week |

Calories show as a range of ±50 around the target, since hostel estimates are rough.

**Adjustment rules**

- Weigh yourself 3–4 mornings a week, after the toilet and before eating. The app compares weekly averages.
- If your average hasn't dropped for 2–3 weeks, the weekly report suggests cutting 150–200 kcal, mostly from rice or oil.
- If you're losing more than 1% a week, or feel drained in the gym, it suggests adding 150–200 kcal back.
- It ignores your first 2 weeks when deciding whether to add calories back, since early losses are mostly water.
- Targets are recalculated from your current weight at every fitness check.
- You confirm every change. Each one is saved with the date it starts, so past days are always judged by the targets you had then.

## 3. Diet in a hostel: estimate, don't count

Canteen portions, oil and recipes change from day to day, so every calorie number is an estimate, roughly ±20–30%. The app logs as closely as it reasonably can, keeps logging under a minute a day, and lets your weekly weight trend decide whether the estimates are working.

**Logging**

- Tap items from the menu. Rice is logged in cups (½, 1, 1½, 2, 2½, 3); everything else as small, normal or large (0.75×, 1×, 1.5×).
- Save your usual plates as combos for one-tap logging.
- Can't tell what's on the plate? Log a generic rice and curry plate (small, normal or large) instead of skipping the meal.
- Drinks are a +1 button (Nescafe, tea), saved as food in a drinks slot.
- Outside food has quick-add items (kottu, fried rice, rotti) or a custom entry with estimated calories and protein.
- Calories show with "≈" and round to the nearest 10, so nobody mistakes them for exact numbers.
- Each logged item keeps the calories and protein it had when logged, so correcting a menu value later doesn't rewrite past days.

**What the app checks each day:** a protein at each meal, total protein against your quest threshold, and on flex days, dinner against the remaining budget.

**Plate rule:** two proteins, one carb and plenty of vegetables. Rice is the biggest dial: one extra cup is about 200 kcal.

**Default tips (editable):** keep parotta and fried potato mix small, have treats like cream buns once or twice a week at most, and use 1 teaspoon of sugar or less per drink.

**Flex days**

- Choose 0–4 flex days a week at setup, and toggle them on the day.
- On a flex day, breakfast and lunch are lighter and dinner gets the rest: flex budget = calorie target − everything logged before dinner.
- The Food screen shows the remaining flex budget as you log.

**Protein calibration (first 14 days)**

Hostel food often lands below the protein target, so the protein quest starts from what's realistic. For the first 14 days, the quest is "log all three main meals", and protein is shown but not judged.

On day 15, the app proposes a quest threshold: your 14-day average + 10 g, rounded to the nearest 5 g, between 1.2 g/kg and your target. Each fitness check nudges it toward the target. Cheap ways to raise protein: 2 extra boiled eggs (about 12 g for 140 kcal), soya, curd or canned fish.

## 4. Fitness checks (every 4 weeks)

Every 4 weeks, a 20-minute fitness check measures your body, strength and endurance against the last check, then reviews your targets. The first one is your baseline, done within 7 days of setup.

**Timing**

- Default every 4 weeks; change it to 3–6 weeks in Settings.
- Each check has a due day (default Saturday morning, before training) and a window of 3 days either side to do it.
- A banner on the Status screen shows while the window is open.
- Missing the window has no penalty. The check moves to the next weekend.
- In exam mode, only weight and waist are measured. The full check waits until exams end.

**What it measures**

| Part | Measure | How |
| --- | --- | --- |
| Body | Weekly average weight | Automatic from weigh-ins |
| Body | Waist | Tape at the navel, in the morning, relaxed, same spot every time |
| Body | Progress photo | Reminder only; photos stay in a hidden album in Photos |
| Strength | Estimated 1-rep max for up to 3 main lifts you pick | Automatic from the last 4 weeks of sets: weight × (1 + reps ÷ 30) |
| Endurance | Max push-ups | One set, stopping when form breaks |
| Endurance | Plank hold | Seconds until your hips drop |
| Endurance | Bodyweight squats | As many as possible in 60 seconds |
| Recovery | Resting heart rate (optional) | That morning before getting up: count for 60 seconds, or import from Health |

**Review (the app does this at the end)**

- Shows each result next to the last check, with an up or down arrow.
- Shows 4-week averages: sleep, study hours, protein, workouts done against planned, estimated calories and weight change.
- Recalculates calorie and protein targets from your current weight, applies the adjustment rules and reviews the protein quest threshold. You confirm each change.
- If you've reached your goal weight or goal waist, it offers to switch your goal to maintain.

**Rewards:** completing a check earns 50 VIT, and each endurance test that improves earns +10 STR (up to +30).

Let your waist and photos decide when you've reached your goal, not an exact number on the scale.

## 5. Time rules: days and weeks

A day runs from 12:00 midnight to the next midnight, in the phone's local time. Every date in the app follows these rules.

- Dates are stored as YYYY-MM-DD, made with Day.js in local time. Never use `toISOString()` for a date: it gives the UTC date, which is wrong for anything logged between midnight and 5:30 a.m. in Sri Lanka.
- Every log also keeps its full timestamp, so its date can always be rebuilt.
- **Meals and drinks** count on the day they're eaten. A snack at 12:30 a.m. belongs to the new day.
- **Sleep** is saved as full bedtime and wake-up times and counts on the day you wake up. A night from 11:30 p.m. on the 25th to 6:30 a.m. on the 26th is the 26th's sleep.
- **Study blocks and workouts** count on the day they start. A block started at 11:40 p.m. counts for that day.
- **Weeks** run Monday to Sunday. Weekly quests, the weekly report and the weekly boss judge the finished week, and their results appear on Monday.
- **Today** is never counted as missed until midnight passes, so a streak can't break partway through a day.

## 6. Features by module

Phases: 1 = first version, 2 = upgrade, 3 = smart features. In Phase 2, Must items come first and Nice items are built only if there's time.

| Module | Feature | Phase |
| --- | --- | --- |
| Setup | First-launch setup, target calculation, Profile in Settings | 1 |
| Game core | Daily quest board, XP and levels | 1 |
| Game core | STR / VIT / INT stats, E–S ranks | 2 Must |
| Game core | Streaks with streak shields, exam mode, weekly boss | 2 Must |
| Game core | Achievements | 2 Nice |
| Diet | Starter menu (calories, protein, counts-as-protein flag) and menu editor | 1 |
| Diet | Tap logging: rice in cups, other items small / normal / large | 1 |
| Diet | Combos, generic plates, drinks +1, outside food quick-add | 1 |
| Diet | Daily totals, protein bar, flex-dinner budget, protein calibration | 1 |
| Diet | Photo meal recognition (Shortcuts or Gemini) | 3 |
| Workout | Plan builder (exercises, sets, reps or seconds, target weight) | 1 |
| Workout | Session logging (tap ✔ or edit), pre-fill from last session | 1 |
| Workout | Rest timer, PR detection, exam-mode workout plan | 2 Must |
| Workout | Progression suggestions, missed-session reschedule | 2 Nice |
| Fitness check | 4-weekly check, baseline, history and comparison, target review | 2 Must |
| Sleep | Two-tap sleep and wake log | 1 |
| Sleep | Import from Apple Health through a Shortcut | 3 |
| Body | Weight log with weekly average chart | 1 |
| Body | Waist log every 2 weeks, calorie adjustment suggestions | 2 Must |
| Study | Focus timer | 1 |
| Study | Exam and deadline calendar, auto exam mode | 2 Must |
| Study | Hours per subject | 2 Nice |
| Wellbeing | One-tap energy and mood check-in | 2 Nice |
| Reports | Weekly report (Monday, for the finished week) | 2 Must |
| System | Offline installable PWA, persistent storage, backup export and import | 1 |
| System | Settings, debug console toggle, version number and update prompt | 1 |
| System | Reminders through Shortcuts automations | 2 Must |
| System | Steps import through a Shortcut | 3 |

## 7. Game rules

**Daily quests**

| Quest | Done when | XP |
| --- | --- | --- |
| Protein breakfast | Breakfast has at least 1 item that counts as protein | 10 VIT |
| Two proteins at lunch | Lunch has at least 2 protein items | 10 VIT |
| Dinner | 2 protein items, or on a flex day, dinner within the flex budget | 10 VIT |
| Daily protein | Total protein at or above your quest threshold (first 14 days: all 3 main meals logged) | 20 VIT |
| Workout | At least 80% of planned sets done; a planned rest day earns 10 | 50 STR |
| Study block | A completed focus-timer block, or a manual entry at least one block long; up to 5 a day | 30 INT each |
| Sleep | The sleep that ended today meets your sleep target | 20 VIT |

Whether a food counts as protein is a flag on each menu item. In the starter menu, dhal doesn't count, because half a cup has only about 6 g.

**Weekly quests and bonuses**

| Quest | XP |
| --- | --- |
| 3+ weigh-ins in the week | 20 |
| Export a backup | 15 |
| Measure your waist (every 2 weeks) | 15 |
| Complete a fitness check (every 4 weeks) | 50 VIT, +10 STR per improved test |
| New personal record | +25 STR |
| Mood check-in (once a day) | +5 |

**Levels and ranks**

Going from level n to n + 1 takes 100 + 25 × n XP. A full day earns up to 270 XP (345 in exam mode), and a typical good day about 200.

| Rank | Levels | Total XP to reach | At about 200 XP a day |
| --- | --- | --- | --- |
| E | 1–9 | 0 | Start |
| D | 10–19 | 2,025 | About 10 days |
| C | 20–34 | 6,650 | About 1 month |
| B | 35–49 | 18,275 | About 3 months |
| A | 50–69 | 35,525 | About 6 months |
| S | 70+ | 67,275 | About 11 months |

**Stats:** STR, VIT and INT each have their own level curve, scaled so a typical week moves each by about the same amount. Study can earn 150 INT a day against 50 STR and 70 VIT, so one shared scale would leave INT far ahead. Tune the scales after 2 weeks of real data.

**Streaks**

- A day counts if you complete at least 5 of the 7 daily quests. The study quest counts once, however many blocks you do.
- Every 7 days in a row earns 1 shield, up to 2. A shield is used automatically on a missed day.
- The app works out streaks and shields by walking through the days in order, so they always match the logs.
- You never lose XP as a penalty. If you correct a wrong log, XP is recalculated to match it.

**Exam mode**

- Turns on automatically 14 days before the next exam in your calendar, or by hand, and ends the day after the last exam. Each exam period is saved with its start and end dates.
- Study XP is multiplied by 1.5.
- The exam-mode workout plan replaces the normal one: 2–3 short sessions a week, with the other days as planned rest.
- Diet and sleep quests stay the same. Waist and mood quests are hidden, and fitness checks shrink to weight and waist.

**Weekly boss (judged on Monday for the finished week)**

You win if all three hold:

1. **Weight on track.** Losing fat: this week's average is lower than the average two weeks ago. Maintaining: within ±1% of goal weight. Building muscle: higher than two weeks ago, by no more than 0.5%. It needs 3+ weigh-ins; in your first 2 weeks, it compares with your starting weight.
2. **Workouts.** At least your weekly workout target (2 in exam mode).
3. **Study.** At least your weekly study-hour goal.

The reward is 100 XP and a title.

**Achievement ideas:** Iron Week (a 7-day streak), Protein Hunter (30 days in total at or above your protein threshold), Scholar (100 study blocks), PR Breaker (10 personal records), Checkpoint (3 fitness checks). Use your own names and visual design throughout, and don't copy anything from Solo Leveling.

## 8. Tech stack (all free)

| Purpose | Tool |
| --- | --- |
| Code editor | VS Code |
| Runtime | Node.js (LTS version) |
| Version control | Git plus a private GitHub repo |
| Build tool | Vite |
| UI | React (JavaScript first, TypeScript later if you want) |
| Styling | Tailwind CSS v4 |
| Local database | Dexie.js plus dexie-react-hooks |
| Offline and install support | vite-plugin-pwa |
| Charts | Chart.js (react-chartjs-2) |
| Dates | Day.js |
| Navigation | React Router |
| Hosting | Netlify, free plan |
| iPhone debug console | Eruda |
| AI (phase 3) | Shortcuts "Use Model" with Private Cloud Compute; the free Gemini API tier as backup |
| AI coding helper | Google AI Plus (Gemini app) |

- **Tailwind v4** installs as a Vite plugin with no config file by default. Instructions that create `tailwind.config.js` are for v3.
- **React Router on Netlify** needs a `public/_redirects` file containing `/* /index.html 200`, or reloading a page like /food gives a 404. HashRouter avoids this too.
- **Netlify's free plan** gives 300 credits a month. Each production deploy costs 15 credits, and branch deploys are free ([Netlify pricing](https://www.netlify.com/pricing/)). That's about 20 merges to main a month.
- **Eruda** loads only when the debug toggle is on, so it doesn't slow the app down.

**Setting up the Vivobook**

1. Install VS Code, Node.js (LTS) and Git.
2. Create GitHub and Netlify accounts.
3. Create the project with `npm create vite@latest daily-quest`, choosing React and JavaScript.
4. Add the libraries, following each tool's current install guide.
5. Add the `public/_redirects` file.
6. Push to GitHub and connect the repo to Netlify. Choose the final site name now and never change it: iOS keeps data per web address, so a new name opens an empty app.
7. In Netlify's deploy settings, turn on branch deploys for all branches.
8. On your iPhone, open the Netlify link in Safari, then tap Share → Add to Home Screen.

## 9. Architecture and data model

The app is local-first with no backend: all data lives in IndexedDB on the phone through Dexie, and a service worker caches the app so it runs offline. Data from Shortcuts arrives through the clipboard (section 11).

**Calculated, never stored:** XP, level, rank, stats, streak, shields, quest results and achievements. They're worked out from the logs every time, so numbers can't drift apart.

**Stored with its date:** anything that changes the rules for a day, such as flex day, planned rest, exam mode and targets. That way, recalculating a past day always gives the same answer.

| Table | Main fields |
| --- | --- |
| profile | nickname, sex, birthDate, heightCm, activityLevel, goal, pace, goalWeight, goalWaist, workoutsPerWeek, flexDaysPerWeek, sleepTargetMin, studyGoalHours, blockMin |
| targetHistory | startsOn, kcal, kcalFloor, protein, proteinQuestThreshold, reason (setup, fitness check or manual) |
| days | date, isFlexDay, isPlannedRest |
| examPeriods | startsOn, endsOn, source (auto or manual) |
| settings | key, value (debug, Gemini key, Gemini model name, fitness check interval) |
| foods | name, category, serving, unit (cups or size), kcal, protein, countsAsProtein |
| meals | date, time, slot (breakfast, lunch, dinner, snack or drink), items \[foodId, portion, kcal, protein\], kcal, protein, source |
| combos | name, items |
| exercises | name, muscleGroup, type (weight and reps, reps only, or seconds) |
| workoutPlans | name, kind (normal or exam), days → exercises (sets, rep range or seconds, target kg) |
| workoutSets | date, startedAt, exerciseId, setNumber, reps, weightKg, seconds, done |
| fitnessChecks | date, waistCm, pushups, plankSec, squats60s, restingHr, lifts \[exerciseId, estimated 1RM\], notes |
| sleepLogs | wakeDate, bedAt, wakeAt, minutes, source |
| bodyLogs | date, weightKg, waistCm |
| subjects / studySessions | name; date, startedAt, subjectId, minutes, completed |
| events | date, type (exam or deadline), title, subjectId |
| moodLogs | date, energy 1–5, mood 1–5 |
| stepsLogs | date, steps, source |

- The app writes each day's planned-rest flag from the active plan when that day is first opened, so editing the plan later doesn't change past days.
- To change the database, add a new Dexie version. Never edit an old version block, or real data can be lost.
- A backup is one JSON file holding the app name, schema version, export time and every table. Import checks the version and upgrades older files.

## 10. Screens

Five tabs sit along the bottom, with a Settings gear at the top. Setup and the fitness check open as full-screen step-by-step flows.

| Screen | What it shows |
| --- | --- |
| Setup (first launch) | Install check, about you, goal, routine, food, exams, target review |
| Status (home) | Level, rank, XP bar, stats, streak and shields, today's quests, flex-day toggle, sleep/wake and drink +1 buttons, Import button, fitness check banner when due |
| Food | Meals by slot, menu grid (rice in cups, other items by size), combos, generic plates, totals with ≈, protein bar, remaining flex budget |
| Train | Today's planned sets with ✔ buttons, reps / weight / seconds editing, rest timer, plan editor for normal and exam plans |
| Study | Focus timer, subject picker, today's blocks, exam list, exam mode status |
| Progress | Weight chart (daily dots plus weekly average line), waist, fitness check history, personal records, weekly report, achievements |
| Fitness check | Each test in turn, results beside the last check, target review |
| Settings | Profile and targets, rerun setup, menu editor, backup export and import, Gemini key and model, fitness check interval, debug toggle, Shortcut help, version number |

## 11. iPhone Shortcuts integrations

Shortcuts pass data to the app through the clipboard, not links. Links opened from Shortcuts land in Safari, which keeps its storage separate from the Home Screen app.

**Importing:** tap Import, then tap the small Paste button Safari shows. It appears every time the text comes from another app, so importing always takes two taps. A plain text box you can paste into is the fallback.

**Import format** (one or more lines; `DQ1` is the format version)

```
DQ1;meal;2026-10-25T13:05;chicken curry,soya curry,rice
DQ1;sleep;2026-10-24T23:10;2026-10-25T06:28
DQ1;steps;2026-10-24;8234
```

- **meal:** the time the photo was taken, then food names. The app picks the meal slot from that time, not from when you paste. Names are fuzzy-matched to the menu, and every meal opens on a review screen before it's saved.
- **sleep:** bedtime and wake-up time. The app works out the minutes and saves it on the wake-up date.
- **steps:** the date the steps belong to, then the count.
- Importing sleep or steps for a date that already has them replaces the old entry instead of adding a second one.

**Shortcut A: Meal Snap** (assign it to the Action button)

1. Take Photo.
2. Use Model, set to Private Cloud Compute, since early reviews found the on-device model can't read images ([Six Colors](https://sixcolors.com/post/2025/06/experimenting-with-apples-ai-models-inside-shortcuts/)). Prompt: "Which of these foods are on the plate: \[menu list\]? Reply only with names from the list, separated by commas."
3. A Text action builds `DQ1;meal;[Current Date in ISO 8601];[result]`, then Copy to Clipboard.
4. Show Notification: "Meal copied. Open Daily Quest and tap Import."

Private Cloud Compute needs internet. Offline, log by tapping instead.

**Shortcut B: Health Sync** (run each morning)

1. Find Health Samples for yesterday's steps, then add them up.
2. Find Health Samples for last night's sleep. iPhone records approximate time in bed only if you use a Sleep schedule; otherwise, use the app's two-tap log.
3. Build the `DQ1;sleep` and `DQ1;steps` lines, copy them, and show a notification.

**Shortcut C: Focus timer alarm** (optional)

A shortcut named "Focus 50" that starts a 50-minute timer in the Clock app. A button on the Study screen opens `shortcuts://run-shortcut?name=Focus%2050`, so the alarm rings even when the app is in the background. Test that this link works from the Home Screen app.

**Reminders** (Personal Automations → Time of Day → Run Immediately → Show Notification)

| Time | Reminder |
| --- | --- |
| Daily 7:00 | Daily quests ready |
| Daily 12:30 | Lunch: two proteins |
| Training days 18:00 | Gym time |
| Daily 22:15 | Wind down, log sleep |
| Saturday 9:00 | Export a backup; fitness check if due |
| Monday 7:00 | Weekly boss result and report |

Adjust these times to your lecture timetable.

**Gemini in the app (backup)**

1. The Food screen's Photo button opens the camera.
2. The app shrinks the photo to about 800 px wide.
3. It sends the photo and your menu list to the free-tier Gemini model named in Settings. Keeping the model name in Settings means a retired model needs no code change.
4. You confirm the items on the review screen.

## 12. iPhone behaviour to plan for

- **Timers pause in the background.** iOS suspends a Home Screen app when you leave it, and without a server the app can't schedule its own notification. Timers save their start time and work out elapsed time from it, so they're correct when you come back. For an alarm, use Shortcut C or the Clock app.
- **Updates can lag.** After a deploy, the phone can keep running the old version. Settings shows the version number, and the app shows "Update available — reload" when a new version is ready.
- **The web address holds the data.** Never rename the Netlify site, because a new address opens an empty app.
- **Safari tab vs Home Screen app.** They keep separate data, so install the app before entering real data.
- **Text inputs** use 16 px text or larger. Smaller text makes iOS zoom in when you tap the field.
- **Safe area.** Pad the bottom navigation with `env(safe-area-inset-bottom)` so it clears the home indicator.

## 13. Development roadmap

The plan assumes about 5 hours a week in two weekend sessions, with a full pause during exams and the 2 weeks before them. Fit these weeks around your real exam dates first: if exams fall in December or January, Phase 1 will pause partway.

&#91;embedded content: development roadmap · 4 phases, 2 gates\]

Phase 1 starts once the app opens offline from the Home Screen, and Phase 2 once it has carried a full week of daily use.

**Phase 0: Setup (week 1)**

- Install the tools, create the accounts, create the project, push it to GitHub and connect Netlify with the final site name.
- Add the PWA plugin, manifest, app icon, apple-touch-icon and the `_redirects` file.
- Add the version number, update prompt and Eruda debug toggle.

**Phase 1: First version (weeks 2–7).** Build one feature at a time, in this order:

1. Database setup (Dexie schema version 1) and the local-date helpers
2. Backup export and import, plus persistent storage
3. First-launch setup and target calculation
4. Starter menu, food tap logging and daily totals
5. Combos, generic plates, drinks, outside food and flex budget
6. Two-tap sleep log
7. Weight log and weekly average chart
8. Study focus timer
9. Workout plan builder
10. Workout session logging with pre-fill
11. Quest board, XP and levels. Because XP is calculated from logs, earlier days get credit too.

**Phase 2: Upgrade (weeks 8–12).** About 25 hours, so build the Must items first.

- Must: fitness checks and waist log; streaks and shields; stats and ranks; exam calendar, exam mode and exam workout plan; rest timer and PR detection; weekly report and boss; Shortcuts reminders.
- Nice: achievements, progression suggestions, missed-session reschedule, hours per subject, mood check-in.

**Phase 3: Smart features (weeks 13–16, or after exams).** The import screen, the Meal Snap and Health Sync shortcuts, the Gemini backup, visual theme polish and, optionally, a Teachable Machine model.

## 14. Git workflow and commit rules

- **Branches.** One branch per feature, like `feature/sleep-log`. Every push to a branch gets a free Netlify branch deploy with its own link.
- **Test on the branch link first.** Open it on the iPhone and test there. It's a different web address, so test data never touches your real data.
- **Merge when it works.** Merge into main only once the feature works on the branch link. Main deploys to production, which costs 15 of your 300 monthly credits, so merge finished features, not every commit.
- **Small commits.** Each commit does one thing, and you commit as each small piece works.
- **Simple English messages.** Start with a verb and stay under about 60 characters, for example "Add hostel menu items", "Show daily protein total", "Fix sleep date after midnight" or "Move quest list to its own file". Avoid vague messages like "update" or "changes".
- **You make every commit yourself,** from VS Code or the terminal, only after reading and testing the change.
- **No AI tool as author or co-author.** Never let a tool commit automatically. If an AI coding tool can commit, turn off its co-author or attribution setting, and check `git log` before pushing. Set your own identity once:

```
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

- **Understand every line.** If AI helped with a piece of code, ask it to explain until you could write that code yourself.
- **Degree submissions.** If you ever submit this for your degree, check your university's AI-use policy. Many require you to declare AI help, regardless of who's listed in the commits.

**Example feature flow**

1. `git checkout -b feature/sleep-log`
2. Commit as you go: "Add sleep and wake buttons" → "Save sleep times to database" → "Show last night's sleep on home"
3. `git push -u origin feature/sleep-log`, then test the branch link on the iPhone
4. `git checkout main`, then `git merge feature/sleep-log`, then `git push`

## 15. Testing and debugging

- Build in Chrome or Edge with the device toolbar set to iPhone size (430 × 932).
- Test on the iPhone using the feature's branch deploy link. For offline and storage tests, add that link to the Home Screen too, since a Safari tab behaves differently.
- Turn on Eruda in Settings to see errors on the iPhone.
- Keep a `BUGS.md` file in the repo to track problems.

**Checklist for each feature**

- [ ] It works in airplane mode.
- [ ] Data survives closing the app and restarting the phone.
- [ ] Totals are correct (check once by hand).
- [ ] Entries logged at 11:55 p.m. and 12:05 a.m. land on different days.
- [ ] Exporting a backup and importing it restores everything.

**Test case for target calculation** (male, 25, 169 cm, 69 kg, moderate activity, losing fat at standard pace)

- BMR = 10 × 69 + 6.25 × 169 − 5 × 25 + 5 = 1,626 kcal
- Maintenance = 1,626 × 1.55 = 2,521 kcal
- Calorie target = 2,521 − 500 = about 2,020 kcal, shown as 1,970–2,070
- Calorie floor = 1,626 kcal (higher than 1,500)
- Protein target = 1.8 × 69 = 124 g

**Test case for levels:** reaching level 10 takes 2,025 XP in total, and level 70 takes 67,275.

## 16. Data safety and privacy

- All data stays on the phone, and the app asks for persistent storage during setup.
- Export a backup every week (a JSON file saved to Files → iCloud Drive) and keep the latest 4. Always export before an iOS update or a phone change.
- Each backup includes its schema version, so older backups still import after the app changes.
- Progress photos stay only in a hidden album in Photos, never in the app or online.
- Meal Snap uses Apple's Private Cloud Compute. On Gemini's free tier, Google may use what you send to improve its models, so the Gemini backup sends only food photos.
- API keys live only in the app's Settings, never in the code or on GitHub. Keep the repo private.

## 17. Study-first rules

- Spend at most about 5 hours a week on development, on weekends. On weekdays, allow only quick fixes of up to 30 minutes.
- Do no development during exam weeks or the 2 weeks before them. The app keeps running in exam mode.
- Finish one feature before starting the next, and put new ideas in a `LATER.md` file instead of building them right away.
- If a feature takes twice as long as planned, cut it down.
- If daily logging takes more than 2 minutes, simplify the app.

## 18. Starter menu pack: Sri Lankan hostel food

This pack is optional at setup, and every value is a starting estimate to adjust in the menu editor. Where the old plan gave a range, the pack uses the middle of it.

| Item | Serving | kcal | Protein (g) | Counts as protein |
| --- | --- | --- | --- | --- |
| Rice | 1 cup cooked | 200 | 4 | No |
| String hoppers | 1 piece | 35 | 0.7 | No |
| Bread | 1 slice | 75 | 2.5 | No |
| Pittu | 1 cup | 250 | 4 | No |
| Parotta | 1 piece | 280 | 5 | No |
| Chicken curry | 1 serving | 200 | 20 | Yes |
| Boiled egg | 1 | 70 | 6 | Yes |
| Soya curry | 1 serving | 150 | 12 | Yes |
| Saman sambol | 1 serving | 150 | 14 | Yes |
| Dhal curry | ½ cup | 120 | 6 | No |
| Potato fried mix | 1 serving | 200 | 2 | No |
| Mushroom devil | 1 serving | 120 | 3 | No |
| Beetroot curry | 1 serving | 70 | 1.5 | No |
| Varai or other vegetables | 1 serving | 70 | 2 | No |
| Nescafe with milk (1 tsp sugar) | 1 cup | 100 | 3 | No |
| Plain tea (1 tsp sugar) | 1 cup | 20 | 0 | No |
| Cream bun | 1 | 300 | 5 | No |
| Chicken kottu | 1 plate | 1,000 | 35 | Yes |
| Chicken fried rice | 1 plate | 900 | 30 | Yes |
| Egg rotti | 1 | 250 | 8 | Yes |
| Chicken rotti | 1 | 300 | 12 | Yes |
| Rice and curry plate (unknown items) | Small / normal / large | 550 / 650 / 900 | 20 / 25 / 30 | Counts as 1 |

The generic plate assumes 1½, 2 or 3 cups of rice with one protein curry and vegetables, so it counts as one protein item.
