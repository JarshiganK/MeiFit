import { HeartPulse, Monitor, Moon, Sun } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ReactNode } from 'react'
import { ScreenHeader } from '../../app/ScreenHeader'
import { isDebugEnabled, setDebugEnabled } from '../../app/debug'
import type { ThemePref } from '../../app/theme'
import { useTheme } from '../../app/useTheme'
import { APP_VERSION, BUILD_DATE } from '../../app/version'
import { en } from '../../copy/en'
import { Card, SegmentedControl, Switch } from '../../ui'

const THEME_OPTIONS: { value: ThemePref; label: string; icon: ReactNode }[] = [
  { value: 'system', label: en.settings.themeSystem, icon: <Monitor size={16} /> },
  { value: 'light', label: en.settings.themeLight, icon: <Sun size={16} /> },
  { value: 'dark', label: en.settings.themeDark, icon: <Moon size={16} /> },
]

export function SettingsScreen() {
  const { pref, setPref } = useTheme()
  const debug = useLiveQuery(isDebugEnabled, [], false)

  return (
    <>
      <ScreenHeader title={en.settings.title} backTo="/" />
      <div className="flex flex-col gap-4 pt-2">
        <Card title={en.settings.appearance}>
          <SegmentedControl
            label={en.settings.theme}
            options={THEME_OPTIONS}
            value={pref}
            onChange={setPref}
            hint={en.settings.themeHint}
          />
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
