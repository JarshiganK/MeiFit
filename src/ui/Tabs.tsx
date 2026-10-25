import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from './cx'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export interface TabsProps {
  label: string
  tabs: TabItem[]
  defaultTab?: string
}

/** ARIA tabs with arrow-key, Home and End navigation (automatic activation). */
export function Tabs({ label, tabs, defaultTab }: TabsProps) {
  const baseId = useId()
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const focusTab = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length]
    if (!tab) return
    setActive(tab.id)
    buttons.current[(index + tabs.length) % tabs.length]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    focusTab(next)
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 rounded-md border border-border bg-bg p-1"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[index] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cx(
                'min-h-11 flex-1 rounded-sm px-3 text-sm font-semibold',
                selected ? 'bg-raised text-text shadow-card ring-1 ring-border' : 'text-muted',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          className="pt-4"
        >
          {tab.id === active && tab.content}
        </div>
      ))}
    </div>
  )
}
