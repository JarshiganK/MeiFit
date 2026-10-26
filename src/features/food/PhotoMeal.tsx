import { useLiveQuery } from 'dexie-react-hooks'
import { Camera } from 'lucide-react'
import { useRef, useState } from 'react'
import { nowMs } from '../../app/useToday'
import { en } from '../../copy/en'
import { importMeal } from '../../db/imports'
import { getSetting } from '../../db/settings'
import type { Food } from '../../db/types'
import { toLocalDate } from '../../domain/date'
import { DEFAULT_GEMINI_MODEL } from '../../domain/gemini'
import { Button, Sheet, useToast } from '../../ui'
import { MealReviewFields } from '../import/MealReviewFields'
import { initialReview, reviewedItems, type MealReview } from '../import/mealReview'
import { PhotoError, recognizeFoods, shrinkPhoto } from './photo'

interface Found {
  at: number
  names: string[]
  review: MealReview
}

/** The Food screen's Photo button (plan §11: the Gemini backup). Shown only when it's set up. */
export function PhotoMeal({ menu }: { menu: Food[] }) {
  const settings = useLiveQuery(async () => ({
    enabled: await getSetting('geminiEnabled', false),
    apiKey: await getSetting('geminiKey', ''),
    model: await getSetting('geminiModel', DEFAULT_GEMINI_MODEL),
  }))
  const input = useRef<HTMLInputElement>(null)
  const [working, setWorking] = useState(false)
  const [found, setFound] = useState<Found | null>(null)
  const toast = useToast()
  const copy = en.gemini

  if (!settings?.enabled || !settings.apiKey) return null

  const recognise = async (file: File) => {
    setWorking(true)
    const at = nowMs()
    try {
      const names = await recognizeFoods({
        key: settings.apiKey,
        model: settings.model,
        photo: await shrinkPhoto(file),
        menuNames: menu.map((f) => f.name),
      })
      if (names.length === 0) toast.show({ message: copy.nothingFound })
      else setFound({ at, names, review: initialReview(names, at, menu) })
    } catch (error) {
      toast.show({
        message:
          error instanceof PhotoError && error.reason === 'offline' ? copy.offline : copy.failed,
      })
    } finally {
      setWorking(false)
    }
  }

  const add = async () => {
    if (!found) return
    const items = reviewedItems(found.review, menu)
    setFound(null)
    if (items.length === 0) return
    await importMeal({ date: toLocalDate(found.at), at: found.at, slot: found.review.slot, items })
    toast.show({ message: copy.added })
  }

  return (
    <>
      <Button
        variant="secondary"
        icon={<Camera size={20} />}
        disabled={working}
        onClick={() => input.current?.click()}
      >
        {working ? copy.working : copy.photo}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label={copy.photoLabel}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void recognise(file)
        }}
      />
      <Sheet
        open={found !== null}
        onClose={() => setFound(null)}
        title={copy.reviewTitle}
        description={copy.reviewHint}
      >
        {found && (
          <div className="flex flex-col gap-4">
            <MealReviewFields
              names={found.names}
              menu={menu}
              review={found.review}
              onChange={(review) => setFound({ ...found, review })}
            />
            <Button block size="lg" onClick={() => void add()}>
              {copy.add}
            </Button>
          </div>
        )}
      </Sheet>
    </>
  )
}
