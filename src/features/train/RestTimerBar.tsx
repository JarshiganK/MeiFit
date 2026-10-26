import { useLiveQuery } from 'dexie-react-hooks'
import { Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { nowMs } from '../../app/useToday'
import { en } from '../../copy/en'
import { getSetting, setSetting } from '../../db/settings'
import { REST_SECONDS, restLeft } from '../../domain/records'
import { formatCountdown } from '../../domain/study'
import { Button } from '../../ui'

/** The rest between sets (plan §6). Time comes from the saved start, so it survives the app pausing. */
export function RestTimerBar() {
  const timer = useLiveQuery(() => getSetting('restTimer', null), [], null)
  const [now, setNow] = useState(nowMs)
  useEffect(() => {
    if (!timer) return
    const tick = () => setNow(nowMs())
    tick()
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [timer])

  if (!timer) return null
  const left = restLeft(timer, now)
  const clear = () => void setSetting('restTimer', null)
  return (
    <section
      aria-label={en.rest.label}
      className="sticky top-0 z-20 -mx-1 flex items-center gap-2 rounded-lg border border-str bg-raised px-3 py-2 shadow-card"
    >
      <Timer aria-hidden="true" size={22} className="shrink-0 text-str" />
      <p
        role="timer"
        aria-live="off"
        className="min-w-0 flex-1 font-display text-lg font-bold tabular-nums"
      >
        {left > 0 ? en.rest.left(formatCountdown(left * 1000)) : en.rest.done}
      </p>
      {left > 0 ? (
        <>
          <Button
            variant="secondary"
            onClick={() =>
              void setSetting('restTimer', {
                ...timer,
                seconds: Math.min(
                  timer.seconds + REST_SECONDS.step,
                  timer.seconds + REST_SECONDS.max,
                ),
              })
            }
          >
            {en.rest.more}
          </Button>
          <Button variant="ghost" onClick={clear}>
            {en.rest.skip}
          </Button>
        </>
      ) : (
        <Button variant="ghost" onClick={clear}>
          {en.rest.dismiss}
        </Button>
      )}
    </section>
  )
}
