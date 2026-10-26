import { en } from '../../copy/en'
import type { DayRecord, Meal, TargetHistory } from '../../db/types'
import { hasAllMainMeals, type CalibrationStatus } from '../../domain/calibration'
import type { LocalDate } from '../../domain/date'
import { flexBudget } from '../../domain/flex'
import { MAIN_MEALS, dayTotals, displayProtein } from '../../domain/food'
import { Card, ProgressBar } from '../../ui'
import { FlexDaySwitch } from './FlexDaySwitch'
import { approxKcal } from './format'

export interface TotalsCardProps {
  date: LocalDate
  meals: Meal[]
  target: TargetHistory | undefined
  hideKcal: boolean
  flexPerWeek: number
  day: DayRecord | undefined
  week: DayRecord[]
  calibration: CalibrationStatus | null
}

/** Calories and protein for the day, the flex-dinner budget and the calibration note. */
export function TotalsCard({
  date,
  meals,
  target,
  hideKcal,
  flexPerWeek,
  day,
  week,
  calibration,
}: TotalsCardProps) {
  const totals = dayTotals(meals)
  const protein = displayProtein(totals.proteinG)
  const kcalLeft = target ? target.kcal - totals.kcal : 0
  const isFlex = day?.isFlexDay ?? false
  const flex = isFlex && target ? flexBudget(target.kcal, meals) : null
  const mainMeals = MAIN_MEALS.filter((slot) => totals.bySlot[slot].itemCount > 0).length
  const threshold = target?.proteinQuestThresholdG ?? null

  return (
    <Card title={en.food.totals} framed>
      <div className="flex flex-col gap-4">
        {!hideKcal && (
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold">{en.food.calories}</h3>
              <p className="tabular-nums">
                <span className="font-display text-xl font-bold">≈{approxKcal(totals.kcal)}</span>{' '}
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

        {flex && (
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold">{en.food.flexBudget}</h3>
              <p className="font-display text-xl font-bold tabular-nums">
                {en.food.flexBudgetValue(approxKcal(flex.budget))}
              </p>
            </div>
            <ProgressBar
              className="mt-2"
              tone="str"
              label={en.food.flexBudget}
              value={flex.dinnerKcal}
              max={Math.max(flex.budget, 1)}
              valueText={en.food.flexBudgetText(
                approxKcal(flex.dinnerKcal),
                approxKcal(flex.budget),
              )}
            />
            <p className="mt-1 text-sm text-muted tabular-nums">
              {flex.remaining >= 0
                ? en.food.flexBudgetLeft(approxKcal(flex.remaining))
                : en.food.flexBudgetOver(approxKcal(-flex.remaining))}
            </p>
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
          {calibration?.calibrating && calibration.day !== null ? (
            <div className="mt-2 text-sm text-muted">
              <p>{en.food.calibrating(calibration.day)}</p>
              <p className="mt-1 font-semibold text-text">
                {en.food.mainMealsLogged(mainMeals)}
                {hasAllMainMeals(meals) && ' ✓'}
              </p>
            </div>
          ) : (
            threshold !== null && (
              <p className="mt-1 text-sm text-muted tabular-nums">{en.food.questLine(threshold)}</p>
            )
          )}
        </div>

        <FlexDaySwitch date={date} perWeek={flexPerWeek} day={day} week={week} hidden={hideKcal} />

        <p className="text-sm text-muted">{hideKcal ? en.food.plateRule : en.food.estimateNote}</p>
      </div>
    </Card>
  )
}
