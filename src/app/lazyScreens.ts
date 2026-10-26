/*
 * Every screen is its own chunk, so the initial bundle holds only the shell.
 * The service worker precaches the chunks, so tabs still open instantly offline.
 */
import { lazy } from 'react'

export const StatusScreen = lazy(() =>
  import('../features/status/StatusScreen').then((m) => ({ default: m.StatusScreen })),
)
export const FoodScreen = lazy(() =>
  import('../features/food/FoodScreen').then((m) => ({ default: m.FoodScreen })),
)
export const TrainScreen = lazy(() =>
  import('../features/train/TrainScreen').then((m) => ({ default: m.TrainScreen })),
)
export const StudyScreen = lazy(() =>
  import('../features/study/StudyScreen').then((m) => ({ default: m.StudyScreen })),
)
export const ProgressScreen = lazy(() =>
  import('../features/progress/ProgressScreen').then((m) => ({ default: m.ProgressScreen })),
)
export const SettingsScreen = lazy(() =>
  import('../features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
)
export const PrivacyScreen = lazy(() =>
  import('../features/settings/PrivacyScreen').then((m) => ({ default: m.PrivacyScreen })),
)
export const DeleteAllScreen = lazy(() =>
  import('../features/settings/DeleteAllScreen').then((m) => ({ default: m.DeleteAllScreen })),
)
export const ProfileScreen = lazy(() =>
  import('../features/settings/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
)
export const MenuEditorScreen = lazy(() =>
  import('../features/settings/MenuEditorScreen').then((m) => ({ default: m.MenuEditorScreen })),
)
export const PlanEditorScreen = lazy(() =>
  import('../features/train/PlanEditorScreen').then((m) => ({ default: m.PlanEditorScreen })),
)
export const FitnessCheckFlow = lazy(() =>
  import('../features/fitness/FitnessCheckFlow').then((m) => ({ default: m.FitnessCheckFlow })),
)
export const SetupFlow = lazy(() =>
  import('../features/setup/SetupFlow').then((m) => ({ default: m.SetupFlow })),
)
/** Reads the profile, so it brings the database with it: kept out of the initial bundle. */
export const ProfileGate = lazy(() =>
  import('./ProfileGate').then((m) => ({ default: m.ProfileGate })),
)
