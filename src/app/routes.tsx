import { Suspense } from 'react'
import type { RouteObject } from 'react-router'
import { AppShell } from './AppShell'
import { ErrorScreen } from './ErrorScreen'
import {
  DeleteAllScreen,
  FoodScreen,
  PrivacyScreen,
  ProfileScreen,
  ProgressScreen,
  SettingsScreen,
  SetupFlow,
  StatusScreen,
  StudyScreen,
  TrainScreen,
} from './lazyScreens'
import { NotFound } from './NotFound'
import { ScreenFallback } from './ScreenFallback'

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
      { path: 'settings/profile', element: <ProfileScreen /> },
      { path: 'settings/privacy', element: <PrivacyScreen /> },
      { path: 'settings/delete', element: <DeleteAllScreen /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/setup',
    element: (
      <Suspense fallback={<ScreenFallback />}>
        <SetupFlow />
      </Suspense>
    ),
    errorElement: <ErrorScreen />,
  },
  ...devRoutes,
]
