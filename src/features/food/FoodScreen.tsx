import { ChevronLeft, ChevronRight, Layers, PenLine } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ScreenFallback } from '../../app/ScreenFallback'
import { ScreenHeader } from '../../app/ScreenHeader'
import { nowMs, useToday } from '../../app/useToday'
import { en } from '../../copy/en'
import { deleteMeal, logCombo, logCustom, logFood } from '../../db/food'
import type { Combo, Food } from '../../db/types'
import { addDays, atLocalTime, formatShortDate, type LocalDate } from '../../domain/date'
import {
  SLOT_TIME,
  comboItems,
  defaultSlot,
  displayProtein,
  slotForFood,
  sumItems,
  type MealItem,
  type MealSlot,
} from '../../domain/food'
import {
  Button,
  Card,
  IconButton,
  SegmentedControl,
  Sheet,
  buttonClass,
  cx,
  useToast,
} from '../../ui'
import { CustomEntry } from './CustomEntry'
import { DayLog } from './DayLog'
import { DrinkButtons } from './DrinkButtons'
import { approxKcal, portionLabel } from './format'
import { MenuGrid } from './MenuGrid'
import { PhotoMeal } from './PhotoMeal'
import { PortionPicker } from './PortionPicker'
import { ProteinProposal } from './ProteinProposal'
import { TotalsCard } from './TotalsCard'
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
  const day = useFoodDay(date, today)
  const [slot, setSlot] = useState<MealSlot>(() => defaultSlot(nowMs()))
  const [food, setFood] = useState<Food | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const toast = useToast()

  if (!day) return <ScreenFallback />

  const hideKcal = day.isMinor
  const earliest = day.profile?.setupDate ?? today
  const goTo = (next: LocalDate) => setPicked(next >= today ? null : next)

  /** Today uses the real time; an earlier day uses a typical time for the meal. */
  const timeFor = (target: MealSlot) => {
    const time = SLOT_TIME[target]
    return date === today ? nowMs() : atLocalTime(date, time.hours, time.minutes)
  }

  /** Runs a log action, then offers Undo. */
  const afterLog = async (save: () => Promise<number | undefined>, message: string) => {
    try {
      const id = await save()
      setSaveFailed(false)
      if (id === undefined) return
      toast.show({
        message,
        action: { label: en.common.undo, onAction: () => void deleteMeal(id) },
      })
    } catch {
      setSaveFailed(true)
    }
  }

  const logPortion = (chosen: Food, portion: number) => {
    setFood(null)
    const target = slotForFood(chosen, slot)
    void afterLog(
      () => logFood({ date, at: timeFor(target), slot, food: chosen, portion }),
      en.food.added(chosen.name, portionLabel(chosen.unit, portion), en.food.slotSingular[target]),
    )
  }

  const logComboTap = (combo: Combo) => {
    if (comboItems(combo, day.foods).length === 0) {
      toast.show({ message: en.food.comboEmpty(combo.name) })
      return
    }
    void afterLog(
      () => logCombo({ date, at: timeFor(slot), slot, combo }),
      en.food.comboAdded(combo.name, en.food.slotSingular[slot]),
    )
  }

  const logCustomItem = (item: MealItem) => {
    setCustomOpen(false)
    void afterLog(
      () => logCustom({ date, at: timeFor(slot), slot, item }),
      en.food.addedOne(item.name, en.food.slotSingular[slot]),
    )
  }

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
            {dayLabel(date, today)}
          </p>
          <IconButton
            label={en.food.nextDay}
            icon={<ChevronRight size={24} />}
            disabled={date >= today}
            onClick={() => goTo(addDays(date, 1))}
          />
        </nav>

        {day.proposal && <ProteinProposal date={date} proposal={day.proposal} />}

        <TotalsCard
          date={date}
          meals={day.meals}
          target={day.target}
          hideKcal={hideKcal}
          flexPerWeek={day.profile?.flexDaysPerWeek ?? 0}
          day={day.day}
          week={day.week}
          calibration={day.calibration}
        />

        <DayLog title={en.food.logged} meals={day.meals} foods={day.foods} hideKcal={hideKcal} />

        <DrinkButtons
          foods={day.foods}
          drinkLogs={day.drinkLogs}
          hideKcal={hideKcal}
          onLog={(drink) => logPortion(drink, 1)}
        />

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

            {day.combos.length > 0 && (
              <section aria-label={en.food.combos}>
                <h3 className="text-sm font-semibold text-muted">{en.food.combos}</h3>
                <p className="mb-2 text-sm text-muted">{en.food.combosHint}</p>
                <ul className="grid grid-cols-2 gap-2">
                  {day.combos.map((combo) => {
                    const totals = sumItems(comboItems(combo, day.foods))
                    return (
                      <li key={combo.id}>
                        <button
                          type="button"
                          onClick={() => logComboTap(combo)}
                          className="flex min-h-16 w-full flex-col items-start justify-center rounded-md border border-accent bg-raised px-3 py-2 text-left shadow-card focus-visible:outline-3 focus-visible:outline-accent"
                        >
                          <span className="inline-flex items-center gap-1 font-semibold leading-tight">
                            <Layers aria-hidden="true" size={16} className="shrink-0 text-accent" />
                            {combo.name}
                          </span>
                          <span className="mt-1 text-sm text-muted tabular-nums">
                            {hideKcal
                              ? en.food.itemProtein(displayProtein(totals.proteinG))
                              : en.food.comboValues(
                                  approxKcal(totals.kcal),
                                  displayProtein(totals.proteinG),
                                )}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            <MenuGrid foods={day.foods} hideKcal={hideKcal} onPick={setFood} />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                icon={<PenLine size={20} />}
                onClick={() => setCustomOpen(true)}
              >
                {en.food.custom}
              </Button>
              <PhotoMeal menu={day.foods.filter((f) => !f.archived)} />
              <Link to="/settings/menu" className={cx(buttonClass({ variant: 'ghost' }))}>
                {en.food.editMenu}
              </Link>
            </div>
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
            onPick={(portion) => logPortion(food, portion)}
          />
        )}
      </Sheet>

      <Sheet
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title={en.food.customTitle}
        description={en.food.addsTo(en.food.slotSingular[slot])}
      >
        {customOpen && (
          <CustomEntry
            hideKcal={hideKcal}
            otherNames={day.foods.map((f) => f.name)}
            onLog={logCustomItem}
          />
        )}
      </Sheet>
    </>
  )
}
