import { en } from '../copy/en'

/**
 * Shown for the moment a screen's chunk loads. It holds the header's height so
 * nothing jumps when the screen arrives.
 */
export function ScreenFallback() {
  return (
    <div role="status" aria-label={en.loading} className="pt-2">
      <div className="flex min-h-14 items-center">
        <div className="h-7 w-32 animate-pulse rounded-sm bg-raised motion-reduce:animate-none" />
      </div>
    </div>
  )
}
