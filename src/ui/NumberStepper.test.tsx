import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { NumberStepper } from './NumberStepper'

function Harness({ initial = 69.5 }: { initial?: number }) {
  const [value, setValue] = useState(initial)
  return (
    <NumberStepper
      label="Weight"
      unit="kg"
      hint="Morning weigh-in"
      value={value}
      onChange={setValue}
      min={30}
      max={250}
      step={0.1}
    />
  )
}

describe('NumberStepper', () => {
  it('has a labelled 16 px-safe text input with a unit and hint', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Weight')
    expect(input).toHaveValue('69.5')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveAccessibleDescription('Morning weigh-in')
    expect(screen.getByText('kg')).toBeInTheDocument()
  })

  it('steps up and down with the buttons', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Weight' }))
    expect(screen.getByLabelText('Weight')).toHaveValue('69.7')
    await userEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }))
    expect(screen.getByLabelText('Weight')).toHaveValue('69.6')
  })

  it('accepts typing, including a comma decimal, and snaps on Enter', async () => {
    render(<Harness />)
    const input = screen.getByLabelText('Weight')
    await userEvent.clear(input)
    await userEvent.type(input, '72,34{Enter}')
    expect(input).toHaveValue('72.3')
  })

  it('clamps to the range and disables the button at the limit', async () => {
    render(<Harness initial={249.9} />)
    const input = screen.getByLabelText('Weight')
    await userEvent.clear(input)
    await userEvent.type(input, '400')
    await userEvent.tab()
    expect(input).toHaveValue('250')
    expect(screen.getByRole('button', { name: 'Increase Weight' })).toBeDisabled()
  })

  it('ignores text that is not a number', async () => {
    render(<Harness />)
    const input = screen.getByLabelText('Weight')
    await userEvent.clear(input)
    await userEvent.type(input, 'abc')
    await userEvent.tab()
    expect(input).toHaveValue('69.5')
  })
})
