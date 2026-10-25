import { Drumstick } from 'lucide-react'
import { useState } from 'react'
import { en } from '../../copy/en'
import { changeItemPortion, moveMeal, removeItem, restoreMeal } from '../../db/food'
import type { Food, Meal, MealItem } from '../../db/types'
import { SLOT_ORDER, dayTotals, displayProtein, type MealSlot } from '../../domain/food'
import { Button, Card, SegmentedControl, Sheet, useToast } from '../../ui'
import { approxKcal, portionLabel } from './format'
import { PortionPicker } from './PortionPicker'

const MOVABLE_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

interface Selected {
  meal: Meal
  index: number
  item: MealItem
}

export interface DayLogProps {
  title: string
  meals: Meal[]
  foods: Food[]
  hideKcal: boolean
}

/** What's been logged on the day, by meal. Tap a line to change or remove it. */
export function DayLog({ title, meals, foods, hideKcal }: DayLogProps) {
  const toast = useToast()
  const [selected, setSelected] = useState<Selected | null>(null)
  const totals = dayTotals(meals)
  const food = selected ? foods.find((f) => f.id === selected.item.foodId) : undefined

  const close = () => setSelected(null)

  const remove = async () => {
    if (!selected?.meal.id) return
    const { meal, index, item } = selected
    close()
    const before = await removeItem(meal.id!, index)
    if (!before) return
    toast.show({
      message: en.food.removed(item.name),
      action: { label: en.common.undo, onAction: () => void restoreMeal(before) },
    })
  }

  return (
    <Card title={title}>
      {totals.itemCount === 0 ? (
        <div>
          <p className="font-semibold">{en.food.nothingLogged}</p>
          <p className="text-sm text-muted">{en.food.nothingLoggedHint}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {SLOT_ORDER.map((slot) => {
            const slotMeals = meals.filter((meal) => meal.slot === slot)
            const slotTotals = totals.bySlot[slot]
            if (slotTotals.itemCount === 0) return null
            const protein = displayProtein(slotTotals.proteinG)
            return (
              <section key={slot} aria-label={en.food.slots[slot]}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{en.food.slots[slot]}</h3>
                  <p className="text-sm text-muted tabular-nums">
                    {hideKcal
                      ? en.food.slotProteinOnly(protein)
                      : en.food.slotSummary(approxKcal(slotTotals.kcal), protein)}
                  </p>
                </div>
                {slot !== 'drink' && slot !== 'snack' && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-vit">
                    <Drumstick aria-hidden="true" size={14} />
                    {en.food.proteinItems(slotTotals.proteinItems)}
                  </p>
                )}
                <ul className="mt-1 divide-y divide-border">
                  {slotMeals.flatMap((meal) =>
                    meal.items.map((item, index) => {
                      const unit = foods.find((f) => f.id === item.foodId)?.unit
                      return (
                        <li key={`${meal.id ?? 0}-${index}`}>
                          <button
                            type="button"
                            onClick={() => setSelected({ meal, index, item })}
                            className="flex min-h-11 w-full items-center gap-3 py-2 text-left focus-visible:outline-3 focus-visible:outline-accent"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="sr-only">{en.food.change} </span>
                              <span className="block">{item.name}</span>
                              <span className="block text-sm text-muted">
                                {portionLabel(unit, item.portion)}
                              </span>
                            </span>
                            <span className="text-sm text-muted tabular-nums">
                              {hideKcal
                                ? en.food.itemProtein(displayProtein(item.proteinG))
                                : en.food.itemValues(
                                    approxKcal(item.kcal),
                                    displayProtein(item.proteinG),
                                  )}
                            </span>
                          </button>
                        </li>
                      )
                    }),
                  )}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <Sheet open={selected !== null} onClose={close} title={selected?.item.name ?? ''}>
        {selected && (
          <div className="flex flex-col gap-5">
            {food && (
              <PortionPicker
                unit={food.unit}
                perServing={{
                  kcal: selected.item.portion > 0 ? selected.item.kcal / selected.item.portion : 0,
                  proteinG:
                    selected.item.portion > 0 ? selected.item.proteinG / selected.item.portion : 0,
                }}
                current={selected.item.portion}
                hideKcal={hideKcal}
                onPick={(portion) => {
                  void changeItemPortion(selected.meal.id!, selected.index, portion)
                  close()
                }}
              />
            )}
            {selected.meal.slot !== 'drink' && (
              <SegmentedControl
                label={en.food.moveTo}
                options={MOVABLE_SLOTS.map((slot) => ({
                  value: slot,
                  label: en.food.slotSingular[slot],
                }))}
                value={selected.meal.slot}
                onChange={(slot) => {
                  void moveMeal(selected.meal.id!, slot)
                  close()
                }}
              />
            )}
            <Button variant="danger" block onClick={() => void remove()}>
              {en.food.removeItem}
            </Button>
          </div>
        )}
      </Sheet>
    </Card>
  )
}
