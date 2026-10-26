import { useLiveQuery } from 'dexie-react-hooks'
import { AlarmClock, Bell } from 'lucide-react'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { getPlan } from '../../db/workout'
import { Card } from '../../ui'

const ORDER = ['quests', 'lunch', 'gym', 'sleep', 'backup', 'report'] as const

/** Settings → Shortcut help: reminders through Personal Automations (plan §11). */
export function ShortcutHelpScreen() {
  const plan = useLiveQuery(() => getPlan('normal'))
  const copy = en.shortcuts
  const trainingDays = plan?.days.map((d) => en.train.weekdays[d.weekday - 1]).join(', ')
  return (
    <>
      <ScreenHeader title={copy.title} backTo="/settings" />
      <div className="flex flex-col gap-4 pt-2">
        <p className="text-muted">{copy.intro}</p>

        <Card title={copy.remindersTitle}>
          <ul className="-my-1 divide-y divide-border">
            {ORDER.map((key) => (
              <li key={key} className="flex items-start gap-3 py-2">
                <Bell aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{copy.reminders[key].text}</span>
                  <span className="block text-sm text-muted">
                    {copy.reminders[key].time}
                    {key === 'gym' &&
                      ` · ${trainingDays ? copy.trainingDays(trainingDays) : copy.noPlan}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <h3 className="mt-4 font-semibold">{copy.remindersHow}</h3>
          <ol className="mt-2 list-decimal pl-5 text-sm">
            {copy.steps.map((step) => (
              <li key={step} className="py-0.5">
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted">{copy.note}</p>
        </Card>

        <Card title={copy.focusTitle}>
          <div className="flex items-start gap-3">
            <AlarmClock aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-int" />
            <p className="text-sm">{copy.focusBody}</p>
          </div>
          <ol className="mt-3 list-decimal pl-5 text-sm">
            {copy.focusSteps.map((step) => (
              <li key={step} className="py-0.5">
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  )
}
