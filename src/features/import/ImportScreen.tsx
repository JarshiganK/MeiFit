import { useLiveQuery } from 'dexie-react-hooks'
import { ClipboardPaste, Footprints, Moon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { activeMenu } from '../../db/food'
import { importMeal, importSleep, importSteps } from '../../db/imports'
import { formatShortDate, formatTime, minutesBetween, toLocalDate } from '../../domain/date'
import { parseImport, type ParsedImport } from '../../domain/importFormat'
import { Button, Card, useToast } from '../../ui'
import { formatDuration } from '../status/formatSleep'
import { MealReviewFields } from './MealReviewFields'
import { initialReview, reviewedItems, type MealReview } from './mealReview'

/** Import from Shortcuts through the clipboard (plan §11). */
export function ImportScreen() {
  const menu = useLiveQuery(activeMenu, [], [])
  const navigate = useNavigate()
  const toast = useToast()
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedImport | null>(null)
  const [reviews, setReviews] = useState<Record<number, MealReview>>({})
  const [pasteFailed, setPasteFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const copy = en.import

  const read = (value: string) => {
    const result = parseImport(value)
    setParsed(result)
    setReviews(
      Object.fromEntries(
        result.items.flatMap((item) =>
          item.kind === 'meal' ? [[item.line, initialReview(item.names, item.at, menu)]] : [],
        ),
      ),
    )
  }

  const paste = async () => {
    try {
      const value = await navigator.clipboard.readText()
      setPasteFailed(false)
      setText(value)
      read(value)
    } catch {
      setPasteFailed(true)
    }
  }

  const save = async () => {
    if (!parsed) return
    setSaving(true)
    let count = 0
    for (const item of parsed.items) {
      if (item.kind === 'sleep') await importSleep(item)
      if (item.kind === 'steps') await importSteps(item.date, item.steps)
      if (item.kind === 'meal') {
        const review = reviews[item.line]!
        const items = reviewedItems(review, menu)
        if (items.length === 0) continue
        await importMeal({ date: toLocalDate(item.at), at: item.at, slot: review.slot, items })
      }
      count++
    }
    toast.show({ message: copy.saved(count) })
    void navigate('/', { replace: true })
  }

  return (
    <>
      <ScreenHeader title={copy.title} backTo="/" />
      <div className="flex flex-col gap-4 pt-2">
        <p className="text-muted">{copy.intro}</p>
        <Button size="lg" icon={<ClipboardPaste size={22} />} onClick={() => void paste()}>
          {copy.paste}
        </Button>
        {pasteFailed && (
          <p role="alert" className="text-sm text-error">
            {copy.pasteFailed}
          </p>
        )}
        <div>
          <label htmlFor="import-text" className="mb-2 block text-sm font-semibold">
            {copy.box}
          </label>
          <textarea
            id="import-text"
            rows={4}
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-describedby="import-text-hint"
            className="w-full rounded-md border border-border bg-raised p-3 font-mono text-base text-text outline-none focus-visible:outline-3 focus-visible:outline-accent"
          />
          <p id="import-text-hint" className="mt-1 text-sm text-muted">
            {copy.boxHint}
          </p>
          <Button variant="secondary" className="mt-2" onClick={() => read(text)}>
            {copy.read}
          </Button>
        </div>

        {parsed && parsed.items.length === 0 && parsed.problems.length === 0 && (
          <p role="status">{copy.nothing}</p>
        )}

        {parsed?.items.map((item) => {
          if (item.kind === 'sleep') {
            return (
              <Card key={item.line}>
                <p className="flex items-center gap-2 font-semibold">
                  <Moon aria-hidden="true" size={18} className="text-vit" />
                  {copy.sleep(
                    formatDuration(minutesBetween(item.bedAt, item.wakeAt)),
                    formatShortDate(toLocalDate(item.wakeAt)),
                  )}
                </p>
                <p className="text-sm text-muted">{copy.replaces}</p>
              </Card>
            )
          }
          if (item.kind === 'steps') {
            return (
              <Card key={item.line}>
                <p className="flex items-center gap-2 font-semibold">
                  <Footprints aria-hidden="true" size={18} className="text-str" />
                  {copy.steps(formatNumber(item.steps), formatShortDate(item.date))}
                </p>
                <p className="text-sm text-muted">{copy.replaces}</p>
              </Card>
            )
          }
          const review = reviews[item.line]
          if (!review) return null
          return (
            <Card
              key={item.line}
              title={copy.meal(
                en.food.slotSingular[review.slot],
                formatTime(item.at),
                formatShortDate(toLocalDate(item.at)),
              )}
              subtitle={copy.mealHint}
            >
              <MealReviewFields
                names={item.names}
                menu={menu}
                review={review}
                onChange={(next) => setReviews((r) => ({ ...r, [item.line]: next }))}
              />
            </Card>
          )
        })}

        {parsed && parsed.problems.length > 0 && (
          <Card title={copy.problemsTitle}>
            <ul className="flex flex-col gap-1 text-sm">
              {parsed.problems.map((p) => (
                <li key={p.line}>{copy.problem(p.line, copy.problems[p.problem])}</li>
              ))}
            </ul>
          </Card>
        )}

        {parsed && parsed.items.length > 0 && (
          <Button size="lg" block disabled={saving} onClick={() => void save()}>
            {copy.save}
          </Button>
        )}
      </div>
    </>
  )
}
