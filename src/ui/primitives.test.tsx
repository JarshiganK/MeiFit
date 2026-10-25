import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Inbox } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  ProgressBar,
  SegmentedControl,
  StatBadge,
  Stepper,
  Switch,
  Tabs,
  clampToStep,
} from '.'

describe('Button and IconButton', () => {
  it('renders a non-submitting button that responds to clicks', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Log meal</Button>)
    const button = screen.getByRole('button', { name: 'Log meal' })
    expect(button).toHaveAttribute('type', 'button')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('gives icon buttons an accessible name and a 44 px target', () => {
    render(<IconButton label="Add drink" icon={<Inbox />} />)
    const button = screen.getByRole('button', { name: 'Add drink' })
    expect(button.className).toContain('size-11')
  })
})

describe('Card', () => {
  it('labels its region with the title', () => {
    render(
      <Card title="Level 12" subtitle="Rank E" framed>
        body
      </Card>,
    )
    expect(screen.getByRole('region', { name: 'Level 12' })).toHaveClass('hud-frame')
    expect(screen.getByText('Rank E')).toBeInTheDocument()
  })
})

describe('ProgressBar', () => {
  it('exposes value, range and a readable value text', () => {
    render(<ProgressBar label="XP" value={150} max={100} valueText="Full" />)
    const bar = screen.getByRole('progressbar', { name: 'XP' })
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuetext', 'Full')
    expect((bar.firstElementChild as HTMLElement).style.transform).toBe('scaleX(1)')
  })

  it('shows an empty bar when max is zero', () => {
    render(<ProgressBar label="Protein" value={10} max={0} tone="vit" />)
    const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement
    expect(fill.style.transform).toBe('scaleX(0)')
  })
})

describe('Stepper, StatBadge and EmptyState', () => {
  it('announces the step in words', () => {
    render(<Stepper current={2} total={7} />)
    expect(screen.getByText('Step 2 of 7')).toBeInTheDocument()
  })

  it('pairs each stat colour with a text label', () => {
    render(<StatBadge stat="int" value="+30" />)
    expect(screen.getByText('INT')).toHaveClass('text-int')
    expect(screen.getByText('+30')).toBeInTheDocument()
  })

  it('renders title, body and action', () => {
    render(
      <EmptyState icon={Inbox} title="Empty" body="Nothing yet" action={<Button>Go</Button>} />,
    )
    expect(screen.getByRole('heading', { name: 'Empty' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})

describe('Switch', () => {
  it('toggles and reports its state', async () => {
    function Harness() {
      const [on, setOn] = useState(false)
      return <Switch label="Debug console" hint="Hint" checked={on} onChange={setOn} />
    }
    render(<Harness />)
    const toggle = screen.getByRole('switch', { name: 'Debug console' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(toggle).toHaveAccessibleDescription('Hint')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})

describe('SegmentedControl', () => {
  it('works as a labelled radio group', async () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        label="Theme"
        hint="System follows your phone."
        value="system"
        onChange={onChange}
        options={[
          { value: 'system', label: 'System' },
          { value: 'dark', label: 'Dark' },
        ]}
      />,
    )
    expect(screen.getByRole('group', { name: 'Theme' })).toHaveAccessibleDescription(
      'System follows your phone.',
    )
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(onChange).toHaveBeenCalledWith('dark')
  })
})

describe('Tabs', () => {
  const tabs = [
    { id: 'today', label: 'Today', content: <p>Today panel</p> },
    { id: 'plan', label: 'Plan', content: <p>Plan panel</p> },
    { id: 'exam', label: 'Exam', content: <p>Exam panel</p> },
  ]

  it('switches panels on click', async () => {
    render(<Tabs label="Train" tabs={tabs} />)
    expect(screen.getByText('Today panel')).toBeVisible()
    await userEvent.click(screen.getByRole('tab', { name: 'Plan' }))
    expect(screen.getByRole('tab', { name: 'Plan' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Plan' })).toHaveTextContent('Plan panel')
  })

  it('moves with arrow keys, Home and End, wrapping around', async () => {
    render(<Tabs label="Train" tabs={tabs} defaultTab="today" />)
    screen.getByRole('tab', { name: 'Today' }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Exam' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Today' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Exam' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Today' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('a')
    expect(screen.getByRole('tab', { name: 'Today' })).toHaveFocus()
  })
})

describe('clampToStep', () => {
  it('snaps to the step and stays in range', () => {
    expect(clampToStep(69.46, 30, 250, 0.1)).toBe(69.5)
    expect(clampToStep(10, 30, 250, 0.1)).toBe(30)
    expect(clampToStep(999, 30, 250, 0.5)).toBe(250)
    expect(clampToStep(7, 0, 10, 2)).toBe(8)
  })
})
