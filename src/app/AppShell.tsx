import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { en } from '../copy/en'
import { OfflineBanner } from './OfflineBanner'
import { ScreenFallback } from './ScreenFallback'
import { TabBar } from './TabBar'
import { UpdatePrompt } from './UpdatePrompt'

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col pt-safe">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-3 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {en.app.skipToContent}
      </a>
      <OfflineBanner />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-lg flex-1 px-safe pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+1.5rem)] outline-none"
      >
        <Suspense fallback={<ScreenFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
      <UpdatePrompt />
      <ScrollRestoration />
    </div>
  )
}
