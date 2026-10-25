import { CupSoda, Plus } from 'lucide-react'
import { useState } from 'react'
import { en } from '../../copy/en'
import type { Food, Meal } from '../../db/types'
import { mostLoggedDrink } from '../../domain/food'
import { Button, Card, Sheet } from '../../ui'
import { approxKcal } from './format'

export interface DrinkButtonsProps {
  foods: Food[]
  drinkLogs: Meal[]
  hideKcal: boolean
  onLog: (food: Food) => void
}

/** "+1" for the most-logged drink (owner change 3), and a visible button for every other drink. */
export function DrinkButtons({ foods, drinkLogs, hideKcal, onLog }: DrinkButtonsProps) {
  const [open, setOpen] = useState(false)
  const drinks = foods.filter((food) => food.category === 'drink' && !food.archived)
  const favouriteId = mostLoggedDrink(
    drinkLogs,
    drinks.map((drink) => drink.id!),
  )
  const favourite = drinks.find((drink) => drink.id === favouriteId)

  return (
    <Card title={en.food.drinks}>
      {favourite ? (
        <div className="flex flex-wrap gap-2">
          <Button
            icon={<Plus size={20} />}
            onClick={() => onLog(favourite)}
            className="min-w-0 flex-1"
          >
            {en.food.plusOne(favourite.name)}
          </Button>
          <Button variant="secondary" icon={<CupSoda size={20} />} onClick={() => setOpen(true)}>
            {en.food.allDrinks}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">{en.food.noDrinks}</p>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={en.food.drinksSheet}>
        <ul className="flex flex-col gap-2">
          {drinks.map((drink) => (
            <li key={drink.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onLog(drink)
                }}
                className="flex min-h-13 w-full items-center gap-3 rounded-md border border-border bg-surface px-4 py-2 text-left focus-visible:outline-3 focus-visible:outline-accent"
              >
                <Plus aria-hidden="true" size={20} className="shrink-0 text-accent" />
                <span className="min-w-0 flex-1 font-semibold">{drink.name}</span>
                {!hideKcal && (
                  <span className="text-sm text-muted tabular-nums">≈{approxKcal(drink.kcal)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </Card>
  )
}
