import { TriangleAlert } from 'lucide-react'
import { en } from '../copy/en'
import { Button, EmptyState } from '../ui'

/** Shown when rendering fails. Data lives in IndexedDB, so a reload is safe. */
export function ErrorScreen() {
  return (
    <main className="mx-auto max-w-lg px-safe pt-safe">
      <EmptyState
        icon={TriangleAlert}
        title={en.error.title}
        body={en.error.body}
        action={<Button onClick={() => window.location.reload()}>{en.error.reload}</Button>}
      />
    </main>
  )
}
