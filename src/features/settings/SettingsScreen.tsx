import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, HeartPulse, Lock, Monitor, Moon, Sun, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ScreenHeader } from '../../app/ScreenHeader'
import { isDebugEnabled, setDebugEnabled } from '../../app/debug'
import type { ThemePref } from '../../app/theme'
import { useTheme } from '../../app/useTheme'
import { APP_VERSION, BUILD_DATE } from '../../app/version'
import { en } from '../../copy/en'
import { Card, SegmentedControl, Switch } from '../../ui'
import { DataCard } from './DataCard'

const THEME_OPTIONS: { value: ThemePref; label: string; icon: ReactNode }[] = [
  { value: 'system', label: en.settings.themeSystem, icon: <Monitor size={16} /> },
  { value: 'light', label: en.settings.themeLight, icon: <Sun size={16} /> },
  { value: 'dark', label: en.settings.themeDark, icon: <Moon size={16} /> },
]

function LinkRow({
  to,
  icon,
  label,
  hint,
}: {
  to: string
  icon: ReactNode
  label: string
  hint: string
}) {
  return (
    <Link to={to} className="flex min-h-13 items-center gap-3 py-2">
      <span aria-hidden="true" className="inline-flex shrink-0 text-muted">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      <ChevronRight aria-hidden="true" size={20} className="shrink-0 text-muted" />
    </Link>
  )
}

export function SettingsScreen() {
  const { pref, setPref } = useTheme()
  const debug = useLiveQuery(isDebugEnabled, [], false)

  return (
    <>
      <ScreenHeader title={en.settings.title} backTo="/" />
      <div className="flex flex-col gap-4 pt-2">
        <DataCard />

        <Card title={en.settings.appearance}>
          <SegmentedControl
            label={en.settings.theme}
            options={THEME_OPTIONS}
            value={pref}
            onChange={setPref}
            hint={en.settings.themeHint}
          />
        </Card>

        <Card title={en.settings.privacyTitle}>
          <div className="flex flex-col divide-y divide-border">
            <LinkRow
              to="/settings/privacy"
              icon={<Lock size={20} />}
              label={en.settings.privacyLink}
              hint={en.settings.privacyHint}
            />
            <LinkRow
              to="/settings/delete"
              icon={<Trash2 size={20} />}
              label={en.settings.deleteLink}
              hint={en.settings.deleteHint}
            />
          </div>
        </Card>

        <Card title={en.settings.healthTitle}>
          <div className="flex gap-3">
            <HeartPulse aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-vit" />
            <p className="text-sm text-muted">{en.settings.healthBody}</p>
          </div>
        </Card>

        <Card title={en.settings.debugTitle}>
          <Switch
            label={en.settings.debug}
            hint={en.settings.debugHint}
            checked={debug}
            onChange={(on) => void setDebugEnabled(on)}
          />
        </Card>

        <Card title={en.settings.about}>
          <p className="text-sm text-muted tabular-nums">
            {en.settings.version(APP_VERSION, BUILD_DATE)}
          </p>
        </Card>
      </div>
    </>
  )
}
