import { Drumstick, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router'
import { en } from '../../copy/en'
import type { Food } from '../../db/types'
import { CATEGORY_ORDER, displayProtein } from '../../domain/food'
import { EmptyState, buttonClass } from '../../ui'
import { approxKcal } from './format'

export interface MenuGridProps {
  foods: Food[]
  hideKcal: boolean
  onPick: (food: Food) => void
}

/** The menu as large tiles, grouped by type. One tap opens the portion picker. */
export function MenuGrid({ foods, hideKcal, onPick }: MenuGridProps) {
  const active = foods.filter((food) => !food.archived)
  if (active.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title={en.food.emptyMenuTitle}
        body={en.food.emptyMenuBody}
        action={
          <Link to="/settings/menu" className={buttonClass({ variant: 'primary' })}>
            {en.food.addFirstItem}
          </Link>
        }
      />
    )
  }
  return (
    <div className="flex flex-col gap-5">
      {CATEGORY_ORDER.map((category) => {
        const items = active.filter((food) => food.category === category)
        if (items.length === 0) return null
        return (
          <section key={category} aria-label={en.food.categories[category]}>
            <h3 className="mb-2 text-sm font-semibold text-muted">
              {en.food.categories[category]}
            </h3>
            {category === 'plate' && (
              <p className="-mt-1 mb-2 text-sm text-muted">{en.food.platesHint}</p>
            )}
            <ul className="grid grid-cols-2 gap-2">
              {items.map((food) => (
                <li key={food.id}>
                  <button
                    type="button"
                    onClick={() => onPick(food)}
                    className="flex min-h-16 w-full flex-col items-start justify-center rounded-md border border-border bg-surface px-3 py-2 text-left shadow-card focus-visible:outline-3 focus-visible:outline-accent active:bg-raised"
                  >
                    <span className="font-semibold leading-tight">{food.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted tabular-nums">
                      <span>
                        {hideKcal
                          ? en.food.itemProtein(displayProtein(food.proteinG))
                          : en.food.itemValues(
                              approxKcal(food.kcal),
                              displayProtein(food.proteinG),
                            )}
                      </span>
                      {food.countsAsProtein && (
                        <span className="inline-flex items-center gap-1 font-semibold text-vit">
                          <Drumstick aria-hidden="true" size={14} />
                          {en.food.countsAsProtein}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
