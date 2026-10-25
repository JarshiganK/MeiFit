import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ScreenFallback } from '../../app/ScreenFallback'
import { ScreenHeader } from '../../app/ScreenHeader'
import { nowMs, useToday } from '../../app/useToday'
import { en } from '../../copy/en'
import { deleteMeal, logFood } from '../../db/food'
import type { Food } from '../../db/types'
import { addDays, atLocalTime, formatShortDate, type LocalDate } from '../../domain/date'
import {
  SLOT_TIME,
  dayTotals,
  defaultSlot,
  displayProtein,
  slotForFood,
  type MealSlot,
} from '../../domain/food'
import {
  Card,
  IconButton,
  ProgressBar,
  SegmentedControl,
  Sheet,
  buttonClass,
  cx,
  useToast,
} from '../../ui'
import { DayLog } from './DayLog'
import { approxKcal, portionLabel } from './format'
import { MenuGrid } from './MenuGrid'
import { PortionPicker } from './PortionPicker'
import { useFoodDay } from './useFoodDay'

const PICKABLE_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

function dayLabel(date: LocalDate, today: LocalDate): string {
  if (date === today) return en.food.today
  if (date === addDays(today, -1)) return en.food.yesterday
  return formatShortDate(date)
}

export function FoodScreen() {
  const today = useToday()
  const [picked, setPicked] = useState<LocalDate | null>(null)
  const date = picked ?? today
  const day = useFoodDay(date)
  const [slot, setSlot] = useState<MealSlot>(() => defaultSlot(nowMs()))
  const [food, setFood] = useState<Food | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const toast = useToast()

  if (!day) return <ScreenFallback />

  const hideKcal = day.isMinor
  const totals = dayTotals(day.meals)
  const target = day.target
  const earliest = day.profile?.setupDate ?? today
  const label = dayLabel(date, today)
  const goTo = (next: LocalDate) => setPicked(next >= today ? null : next)

  const log = async (chosen: Food, portion: number) => {
    setFood(null)
    const targetSlot = slotForFood(chosen, slot)
    const time = SLOT_TIME[targetSlot]
    // Today uses the real time; an earlier day uses a typical time for the meal.
    const at = date === today ? nowMs() : atLocalTime(date, time.hours, time.minutes)
    try {
      const id = await logFood({ date, at, slot, food: chosen, portion })
      setSaveFailed(false)
      toast.show({
        message: en.food.added(
          chosen.name,
          portionLabel(chosen.unit, portion),
          en.food.slotSingular[targetSlot],
        ),
        action: {
          label: en.common.undo,
          onAction: () => void deleteMeal(id),
        },
      })
    } catch {
      setSaveFailed(true)
    }
  }

  const kcalLeft = target ? target.kcal - totals.kcal : 0
  const protein = displayProtein(totals.proteinG)

  return (
    <>
      <ScreenHeader title={en.food.title} />
      <div className="flex flex-col gap-4 pt-2">
        <nav aria-label={en.food.dayNav} className="flex items-center justify-between gap-2">
          <IconButton
            label={en.food.previousDay}
            icon={<ChevronLeft size={24} />}
            disabled={date <= earliest}
            onClick={() => goTo(addDays(date, -1))}
          />
          <p aria-live="polite" className="font-display text-lg font-semibold">
            {label}
          </p>
          <IconButton
            label={en.food.nextDay}
            icon={<ChevronRight size={24} />}
            disabled={date >= today}
            onClick={() => goTo(addDays(date, 1))}
          />
        </nav>

        <Card title={en.food.totals} framed>
          <div className="flex flex-col gap-4">
            {!hideKcal && (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{en.food.calories}</h3>
                  <p className="tabular-nums">
                    <span className="font-display text-xl font-bold">
                      ≈{approxKcal(totals.kcal)}
                    </span>{' '}
                    {target && (
                      <span className="text-sm text-muted">
                        {en.food.kcalOf(approxKcal(target.kcal))}
                      </span>
                    )}
                  </p>
                </div>
                {target && (
                  <>
                    <ProgressBar
                      className="mt-2"
                      label={en.food.calories}
                      value={totals.kcal}
                      max={target.kcal}
                      valueText={en.food.caloriesValue(
                        approxKcal(totals.kcal),
                        approxKcal(target.kcal),
                      )}
                    />
                    <p className="mt-1 text-sm text-muted tabular-nums">
                      {kcalLeft >= 0
                        ? en.food.kcalLeft(approxKcal(kcalLeft))
                        : en.food.kcalOver(approxKcal(-kcalLeft))}
                    </p>
                  </>
                )}
              </div>
            )}
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">{en.food.protein}</h3>
                <p className="tabular-nums">
                  <span className="font-display text-xl font-bold">{protein} g</span>{' '}
                  {target && (
                    <span className="text-sm text-muted">{en.food.proteinOf(target.proteinG)}</span>
                  )}
                </p>
              </div>
              {target && (
                <ProgressBar
                  className="mt-2"
                  tone="vit"
                  label={en.food.protein}
                  value={totals.proteinG}
                  max={target.proteinG}
                  valueText={en.food.proteinValue(protein, target.proteinG)}
                />
              )}
            </div>
            <p className="text-sm text-muted">
              {hideKcal ? en.food.plateRule : en.food.estimateNote}
            </p>
          </div>
        </Card>

        <DayLog title={en.food.logged} meals={day.meals} foods={day.foods} hideKcal={hideKcal} />

        <Card title={en.food.menu} subtitle={en.food.menuHint}>
          <div className="flex flex-col gap-4">
            <SegmentedControl
              label={en.food.logTo}
              options={PICKABLE_SLOTS.map((value) => ({
                value,
                label: en.food.slotSingular[value],
              }))}
              value={slot}
              onChange={setSlot}
            />
            {saveFailed && (
              <p role="alert" className="text-sm text-error">
                {en.food.logFailed}
              </p>
            )}
            <MenuGrid foods={day.foods} hideKcal={hideKcal} onPick={setFood} />
            <Link
              to="/settings/menu"
              className={cx(buttonClass({ variant: 'secondary' }), 'self-start')}
            >
              {en.food.editMenu}
            </Link>
          </div>
        </Card>
      </div>

      <Sheet
        open={food !== null}
        onClose={() => setFood(null)}
        title={food?.name ?? ''}
        description={
          food
            ? `${food.serving}${food.serving ? ' · ' : ''}${
                hideKcal
                  ? en.food.itemProtein(displayProtein(food.proteinG))
                  : en.food.itemValues(approxKcal(food.kcal), displayProtein(food.proteinG))
              }. ${en.food.addsTo(en.food.slotSingular[slotForFood(food, slot)])}`
            : undefined
        }
      >
        {food && (
          <PortionPicker
            unit={food.unit}
            perServing={food}
            hideKcal={hideKcal}
            onPick={(portion) => void log(food, portion)}
          />
        )}
      </Sheet>
    </>
  )
}
