import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { nowMs, useToday } from '../../app/useToday'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { allWaists, restoreBodyLog, saveWaist } from '../../db/body'
import { WAIST_LIMITS } from '../../domain/body'
import { formatShortDate } from '../../domain/date'
import { parseNumber } from '../../domain/number'
import { Button, TextField, useToast } from '../../ui'

/** Waist, every 2 weeks (plan §6, §7). */
export function WaistForm() {
  const today = useToday()
  const waists = useLiveQuery(allWaists)
  const [text, setText] = useState('')
  const [error, setError] = useState(false)
  const toast = useToast()
  const last = waists?.at(-1)

  const save = async () => {
    const cm = parseNumber(text)
    const ok =
      cm !== undefined && Number.isFinite(cm) && cm >= WAIST_LIMITS.min && cm <= WAIST_LIMITS.max
    setError(!ok)
    if (!ok) return
    const before = await saveWaist(today, nowMs(), cm)
    setText('')
    toast.show({
      message: en.weight.waistSaved(formatNumber(cm)),
      action: { label: en.common.undo, onAction: () => void restoreBodyLog(today, before) },
    })
  }

  return (
    <div>
      <form
        noValidate
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <div className="min-w-0 flex-1">
          <TextField
            label={en.weight.waist}
            hint={en.weight.waistHint}
            inputMode="decimal"
            value={text}
            onChange={(event) => setText(event.target.value)}
            {...(error ? { error: en.fitness.errors.outOfRange } : {})}
          />
        </div>
        <Button type="submit" variant="secondary" className="mb-7">
          {en.weight.save}
        </Button>
      </form>
      {last && (
        <p className="mt-1 text-sm text-muted tabular-nums">
          {en.weight.lastWaist(formatNumber(last.waistCm), formatShortDate(last.date))}
        </p>
      )}
    </div>
  )
}
