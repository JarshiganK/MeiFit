import { useState } from 'react'
import { en } from '../../copy/en'
import { acceptProteinThreshold } from '../../db/profile'
import type { ThresholdProposal } from '../../domain/calibration'
import type { LocalDate } from '../../domain/date'
import { Button, Card, NumberStepper, useToast } from '../../ui'

/** Day 15: propose a realistic protein quest, which the user confirms or adjusts (plan §3). */
export function ProteinProposal({
  date,
  proposal,
}: {
  date: LocalDate
  proposal: ThresholdProposal
}) {
  const copy = en.food.proposal
  const [grams, setGrams] = useState(proposal.thresholdG)
  const toast = useToast()

  return (
    <Card title={copy.title} framed>
      <div className="flex flex-col gap-4">
        <p className="text-muted">
          {proposal.averageG === null
            ? copy.fallbackBody(proposal.fullDays)
            : copy.body(Math.round(proposal.averageG), proposal.fullDays)}
        </p>
        <NumberStepper
          label={copy.label}
          value={grams}
          onChange={setGrams}
          min={proposal.minG}
          max={proposal.maxG}
          step={1}
          unit="g"
          hint={copy.hint(proposal.minG, proposal.maxG)}
        />
        <p className="text-sm text-muted">{copy.tips}</p>
        <Button
          block
          onClick={() => {
            void acceptProteinThreshold(date, grams).then(() =>
              toast.show({ message: copy.accepted(grams) }),
            )
          }}
        >
          {copy.accept}
        </Button>
      </div>
    </Card>
  )
}
