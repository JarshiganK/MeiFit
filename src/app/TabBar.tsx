import { BookOpen, Dumbbell, Gauge, LineChart, Utensils, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { en } from '../copy/en'
import { cx } from '../ui'

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: en.nav.status, icon: Gauge },
  { to: '/food', label: en.nav.food, icon: Utensils },
  { to: '/train', label: en.nav.train, icon: Dumbbell },
  { to: '/study', label: en.nav.study, icon: BookOpen },
  { to: '/progress', label: en.nav.progress, icon: LineChart },
]

export function TabBar() {
  return (
    <nav
      aria-label={en.nav.label}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-safe"
    >
      <ul className="mx-auto flex h-(--tabbar-height) max-w-lg items-stretch px-1">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cx(
                  'relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold',
                  isActive ? 'text-accent' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={cx(
                      'absolute top-0 h-0.5 w-8 rounded-full bg-accent transition-transform duration-(--dur-base) ease-out',
                      isActive ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                  <Icon aria-hidden="true" size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
