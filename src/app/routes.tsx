import type { RouteObject } from 'react-router'
import { FoodScreen } from '../features/food/FoodScreen'
import { ProgressScreen } from '../features/progress/ProgressScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { StatusScreen } from '../features/status/StatusScreen'
import { StudyScreen } from '../features/study/StudyScreen'
import { TrainScreen } from '../features/train/TrainScreen'
import { AppShell } from './AppShell'
import { ErrorScreen } from './ErrorScreen'
import { NotFound } from './NotFound'

/** The design gallery exists only in development builds (CLAUDE.md §7). */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/ui',
        lazy: async () => ({ Component: (await import('../dev/UiGallery')).UiGallery }),
      },
    ]
  : []

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <ErrorScreen />,
    children: [
      { index: true, element: <StatusScreen /> },
      { path: 'food', element: <FoodScreen /> },
      { path: 'train', element: <TrainScreen /> },
      { path: 'study', element: <StudyScreen /> },
      { path: 'progress', element: <ProgressScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  ...devRoutes,
]
