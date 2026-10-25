import { Beef, Flame, HeartPulse } from 'lucide-react'
import { useState } from 'react'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { kcalRange, roundKcal, type Targets } from '../../domain/targets'
import { Button, Card, NumberStepper, TextField } from '../../ui'

export interface TargetEdits {
  kcal: number
  proteinG: number
}

export interface ReviewStepProps {
  targets: Targets
  edits: TargetEdits | null
  onEdit: (edits: TargetEdits | null) => void
  errors: { kcal?: string; proteinG?: string }
  /** Only on first launch; changing answers later keeps the booked check. */
  baseline?: { value: string; min: string; max: string; onChange: (date: string) => void }
}

const fmt = (kcal: number) => formatNumber(roundKcal(kcal))

export function ReviewStep({ targets, edits, onEdit, errors, baseline }: ReviewStepProps) {
  const copy = en.setup.review
  const [editing, setEditing] = useState(edits !== null)
  const kcal = edits?.kcal ?? targets.kcal
  const proteinG = edits?.proteinG ?? targets.proteinG
  const range = kcalRange(kcal)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">{copy.intro}</p>

      {!targets.isMinor && (
        <Card framed>
          <div className="flex items-start gap-3">
            <Flame aria-hidden="true" size={24} className="mt-1 shrink-0 text-accent" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-muted">{copy.calories}</h2>
              <p className="font-display text-3xl font-bold tabular-nums">{copy.kcal(fmt(kcal))}</p>
              <p className="text-sm text-muted tabular-nums">
                {copy.range(formatNumber(range.low), formatNumber(range.high))}
              </p>
              <p className="mt-1 text-sm text-muted tabular-nums">
                {copy.floor(fmt(targets.kcalFloor))}
              </p>
              {targets.floorApplied && edits === null && (
                <p className="mt-1 text-sm text-muted">{copy.floorApplied}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card framed={targets.isMinor}>
        <div className="flex items-start gap-3">
          <Beef aria-hidden="true" size={24} className="mt-1 shrink-0 text-vit" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-muted">{copy.protein}</h2>
            <p className="font-display text-3xl font-bold tabular-nums">{copy.grams(proteinG)}</p>
            <p className="mt-1 text-sm text-muted">{copy.calibration}</p>
            {targets.isMinor && <p className="mt-2 text-sm text-muted">{copy.plateRule}</p>}
          </div>
        </div>
      </Card>

      {!editing ? (
        <Button
          variant="secondary"
          onClick={() => {
            setEditing(true)
            onEdit({ kcal: targets.kcal, proteinG: targets.proteinG })
          }}
        >
          {copy.edit}
        </Button>
      ) : (
        <Card title={copy.edit}>
          <div className="flex flex-col gap-4">
            {!targets.isMinor && (
              <NumberStepper
                label={copy.editKcal}
                value={kcal}
                min={targets.kcalFloor}
                max={6000}
                step={10}
                onChange={(next) => onEdit({ kcal: next, proteinG })}
                {...(errors.kcal ? { hint: errors.kcal } : {})}
              />
            )}
            <NumberStepper
              label={copy.editProtein}
              value={proteinG}
              min={targets.proteinMinG}
              max={400}
              onChange={(next) => onEdit({ kcal, proteinG: next })}
              {...(errors.proteinG ? { hint: errors.proteinG } : {})}
            />
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(false)
                onEdit(null)
              }}
            >
              {copy.reset}
            </Button>
          </div>
        </Card>
      )}

      {baseline && (
        <TextField
          label={copy.baseline}
          hint={copy.baselineHint}
          type="date"
          value={baseline.value}
          min={baseline.min}
          max={baseline.max}
          onChange={(e) => baseline.onChange(e.target.value)}
        />
      )}

      <div className="flex gap-3 rounded-md border border-border bg-raised p-3 text-sm text-muted">
        <HeartPulse aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-vit" />
        <p>{en.setup.healthNote}</p>
      </div>
    </div>
  )
}
