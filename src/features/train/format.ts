import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import type { SetValues } from '../../domain/session'
import type { ExerciseType, PlannedExercise } from '../../domain/workout'

function reps(target: PlannedExercise): string {
  const { repMin = 0, repMax = 0 } = target
  return repMin === repMax ? String(repMin) : `${repMin}–${repMax}`
}

/** "3 × 8–12 @ 20 kg", "3 × 8–12" or "3 × 30 s". */
export function targetText(target: PlannedExercise, type: ExerciseType | undefined): string {
  const t = en.plan.target
  if (type === 'seconds') return t.seconds(target.sets, target.seconds ?? 0)
  if (type === 'weight-reps')
    return t.weightReps(target.sets, reps(target), formatNumber(target.targetKg ?? 0))
  return t.reps(target.sets, reps(target))
}

export function weekdayName(weekday: number): string {
  return en.train.weekdayNames[weekday - 1] ?? ''
}

/** "8 reps × 40 kg", "8 reps" or "30 s". */
export function valuesText(type: ExerciseType, values: SetValues): string {
  const v = en.session.values
  if (type === 'seconds') return v.seconds(values.seconds ?? 0)
  if (type === 'reps') return v.reps(values.reps ?? 0)
  return v.weightReps(values.reps ?? 0, formatNumber(values.weightKg ?? 0))
}
