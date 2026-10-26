import { Utensils } from 'lucide-react'
import { en } from '../../copy/en'
import type { Food } from '../../db/types'
import { SelectField } from '../../ui'
import { REVIEW_SLOTS, SKIP, type MealReview } from './mealReview'

export interface MealReviewFieldsProps {
  names: readonly string[]
  menu: readonly Food[]
  review: MealReview
  onChange: (review: MealReview) => void
}

/** The meal and a menu pick for each recognised name; every pick can be changed or skipped. */
export function MealReviewFields({ names, menu, review, onChange }: MealReviewFieldsProps) {
  const copy = en.import
  const options = [
    ...menu.map((food) => ({ value: String(food.id), label: food.name })),
    { value: SKIP, label: copy.skip },
  ]
  return (
    <div className="flex flex-col gap-3">
      <SelectField
        label={copy.slotLabel}
        value={review.slot}
        options={REVIEW_SLOTS.map((value) => ({ value, label: en.food.slotSingular[value] }))}
        onChange={(slot) => onChange({ ...review, slot })}
      />
      {names.map((name, i) => (
        <div key={`${name}-${i}`} className="flex items-start gap-2">
          <Utensils aria-hidden="true" size={18} className="mt-9 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <SelectField
              label={copy.from(name)}
              value={review.picks[i] ?? SKIP}
              options={options}
              {...(review.picks[i] === SKIP ? { hint: copy.noMatch } : {})}
              onChange={(pick) =>
                onChange({ ...review, picks: review.picks.map((p, j) => (j === i ? pick : p)) })
              }
            />
          </div>
        </div>
      ))}
    </div>
  )
}
