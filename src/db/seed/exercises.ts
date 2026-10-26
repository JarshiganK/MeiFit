import type { Exercise } from '../types'

/**
 * Common exercises, loaded the first time a plan is built, so building one is
 * mostly tapping. Bodyweight moves come first: they need no gym.
 */
export const STARTER_EXERCISES: readonly Omit<Exercise, 'id'>[] = [
  { name: 'Push-ups', muscleGroup: 'Chest', type: 'reps' },
  { name: 'Bodyweight squats', muscleGroup: 'Legs', type: 'reps' },
  { name: 'Plank', muscleGroup: 'Core', type: 'seconds' },
  { name: 'Lunges', muscleGroup: 'Legs', type: 'reps' },
  { name: 'Glute bridge', muscleGroup: 'Legs', type: 'reps' },
  { name: 'Pull-ups', muscleGroup: 'Back', type: 'reps' },
  { name: 'Dips', muscleGroup: 'Chest', type: 'reps' },
  { name: 'Bench press', muscleGroup: 'Chest', type: 'weight-reps' },
  { name: 'Squat', muscleGroup: 'Legs', type: 'weight-reps' },
  { name: 'Deadlift', muscleGroup: 'Back', type: 'weight-reps' },
  { name: 'Overhead press', muscleGroup: 'Shoulders', type: 'weight-reps' },
  { name: 'Barbell row', muscleGroup: 'Back', type: 'weight-reps' },
  { name: 'Lat pulldown', muscleGroup: 'Back', type: 'weight-reps' },
  { name: 'Dumbbell curl', muscleGroup: 'Arms', type: 'weight-reps' },
  { name: 'Leg press', muscleGroup: 'Legs', type: 'weight-reps' },
]
