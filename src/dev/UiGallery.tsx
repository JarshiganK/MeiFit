import { Droplet, Inbox, Moon, Sun } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTheme } from '../app/useTheme'
import {
  Button,
  Card,
  ChoiceCards,
  EmptyState,
  IconButton,
  NumberStepper,
  ProgressBar,
  SegmentedControl,
  SelectField,
  Sheet,
  StatBadge,
  Stepper,
  Switch,
  Tabs,
  TextField,
  useToast,
} from '../ui'

/* Dev-only design gallery (CLAUDE.md §7). Strings here are not user-facing. */

const SWATCHES: [string, string][] = [
  ['bg', 'bg-bg'],
  ['surface', 'bg-surface'],
  ['raised', 'bg-raised'],
  ['border', 'bg-border'],
  ['text', 'bg-text'],
  ['muted', 'bg-muted'],
  ['accent (XP)', 'bg-accent'],
  ['str', 'bg-str'],
  ['vit', 'bg-vit'],
  ['int', 'bg-int'],
  ['error', 'bg-error'],
]

const TYPE_SCALE: [string, string][] = [
  ['display', 'font-display text-display font-bold'],
  ['3xl', 'font-display text-3xl font-bold'],
  ['2xl', 'font-display text-2xl font-bold'],
  ['xl', 'text-xl font-semibold'],
  ['lg', 'text-lg'],
  ['base', 'text-base'],
  ['sm', 'text-sm'],
  ['xs', 'text-xs'],
]

const SPACING: [string, string][] = [
  ['1 · 4px', 'w-1'],
  ['2 · 8px', 'w-2'],
  ['3 · 12px', 'w-3'],
  ['4 · 16px', 'w-4'],
  ['6 · 24px', 'w-6'],
  ['8 · 32px', 'w-8'],
  ['11 · 44px', 'w-11'],
]

const RADII: [string, string][] = [
  ['sm', 'rounded-sm'],
  ['md', 'rounded-md'],
  ['lg', 'rounded-lg'],
  ['xl', 'rounded-xl'],
  ['full', 'rounded-full'],
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  )
}

export function UiGallery() {
  const { theme, setPref } = useTheme()
  const toast = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [weight, setWeight] = useState(69.5)
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a')
  const [select, setSelect] = useState<'curry' | 'staple'>('curry')
  const [choice, setChoice] = useState<'lose' | 'maintain' | undefined>('lose')
  const [on, setOn] = useState(true)

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-8 px-safe pb-24 pt-safe">
      <header className="flex items-center justify-between pt-4">
        <h1 className="font-display text-2xl font-bold">Design tokens</h1>
        <IconButton
          label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          icon={theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
          tone="raised"
          onClick={() => setPref(theme === 'dark' ? 'light' : 'dark')}
        />
      </header>

      <Section title="Colour">
        <div className="grid grid-cols-3 gap-3">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="flex flex-col gap-1">
              <div className={`h-12 rounded-md border border-border ${cls}`} />
              <span className="text-xs text-muted">{name}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatBadge stat="str" value="+50" />
          <StatBadge stat="vit" value="+70" />
          <StatBadge stat="int" value="+150" />
        </div>
      </Section>

      <Section title="Type">
        {TYPE_SCALE.map(([name, cls]) => (
          <p key={name} className={`${cls} tabular-nums`}>
            {name} · Lv 12 · 1,240 XP
          </p>
        ))}
      </Section>

      <Section title="Spacing, radii, shadows">
        <div className="flex items-end gap-3">
          {SPACING.map(([name, cls]) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div className={`h-8 rounded-sm bg-accent ${cls}`} />
              <span className="text-xs text-muted">{name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          {RADII.map(([name, cls]) => (
            <div
              key={name}
              className={`flex size-14 items-center justify-center border border-border bg-raised text-xs ${cls}`}
            >
              {name}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="flex h-14 flex-1 items-center justify-center rounded-md bg-surface text-xs shadow-card">
            card
          </div>
          <div className="flex h-14 flex-1 items-center justify-center rounded-md bg-surface text-xs shadow-sheet">
            sheet
          </div>
          <div className="flex h-14 flex-1 items-center justify-center rounded-md bg-surface text-xs shadow-glow">
            glow
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <Button block size="lg">
          Primary · log meal
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete all</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex gap-2">
          <IconButton label="Drink" icon={<Droplet size={22} />} tone="raised" />
          <IconButton label="Inbox" icon={<Inbox size={22} />} />
        </div>
      </Section>

      <Section title="Cards and progress">
        <Card title="Level 12" subtitle="Framed card" framed>
          <div className="flex flex-col gap-3">
            <ProgressBar label="XP" value={1240} max={1425} valueText="1,240 of 1,425 XP" />
            <ProgressBar label="Strength" tone="str" value={3} max={5} size="sm" />
            <ProgressBar label="Vitality" tone="vit" value={4} max={5} size="sm" />
            <ProgressBar label="Intellect" tone="int" value={2} max={5} size="sm" />
          </div>
        </Card>
        <Card title="Plain card">
          <p className="text-muted">Most cards are unframed.</p>
        </Card>
      </Section>

      <Section title="Inputs">
        <NumberStepper
          label="Weight"
          unit="kg"
          value={weight}
          min={30}
          max={250}
          step={0.1}
          onChange={setWeight}
          hint="Morning, after the toilet, before eating."
        />
        <SegmentedControl
          label="Pace"
          options={[
            { value: 'a', label: 'Slow' },
            { value: 'b', label: 'Standard' },
            { value: 'c', label: 'Custom' },
          ]}
          value={segment}
          onChange={setSegment}
        />
        <Switch
          label="Flex day"
          hint="Lighter breakfast and lunch."
          checked={on}
          onChange={setOn}
        />
        <TextField label="Nickname" hint="Shown on your Status screen." defaultValue="Sam" />
        <TextField label="Waist (cm)" defaultValue="400" error="That number looks off." />
        <SelectField
          label="Type"
          options={[
            { value: 'curry', label: 'Curries' },
            { value: 'staple', label: 'Rice, bread and staples' },
          ]}
          value={select}
          onChange={setSelect}
        />
        <ChoiceCards
          label="Goal"
          choices={[
            { value: 'lose', label: 'Lose fat', hint: 'About 0.5 kg a week' },
            { value: 'maintain', label: 'Maintain' },
          ]}
          value={choice}
          onChange={setChoice}
        />
        <Stepper current={3} total={7} />
        <Tabs
          label="Example tabs"
          tabs={[
            { id: 'today', label: 'Today', content: <p className="text-muted">Today panel</p> },
            { id: 'plan', label: 'Plan', content: <p className="text-muted">Plan panel</p> },
          ]}
        />
      </Section>

      <Section title="Feedback">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.show({
                message: 'Meal deleted',
                action: { label: 'Undo', onAction: () => undefined },
              })
            }
          >
            Show toast
          </Button>
        </div>
        <EmptyState icon={Inbox} title="Nothing here yet" body="Empty states look like this." />
      </Section>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Pick a portion"
        description="Bottom sheets hold pickers."
      >
        <div className="grid grid-cols-3 gap-2">
          {['Small', 'Normal', 'Large'].map((size) => (
            <Button key={size} variant="secondary" onClick={() => setSheetOpen(false)}>
              {size}
            </Button>
          ))}
        </div>
      </Sheet>
    </main>
  )
}
