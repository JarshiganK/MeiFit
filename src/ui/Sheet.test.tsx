import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Sheet } from './Sheet'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Portion" description="Pick a size">
        <button type="button">Large</button>
      </Sheet>
    </>
  )
}

function dialog() {
  return screen.getByRole<HTMLDialogElement>('dialog', { hidden: true })
}

describe('Sheet', () => {
  it('opens as a labelled, described modal dialog', async () => {
    render(<Harness />)
    expect(dialog().open).toBe(false)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(dialog().open).toBe(true)
    expect(screen.getByRole('dialog', { name: 'Portion' })).toHaveAccessibleDescription(
      'Pick a size',
    )
  })

  it('closes with the Close button', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(dialog().open).toBe(false)
  })

  it('closes on Escape (the dialog cancel event)', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent(dialog(), new Event('cancel', { cancelable: true }))
    expect(dialog().open).toBe(false)
  })

  it('closes on a backdrop click but not on a click inside', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('button', { name: 'Large' }))
    expect(dialog().open).toBe(true)
    fireEvent.click(dialog())
    expect(dialog().open).toBe(false)
  })

  it('reports a native close (e.g. a form with method="dialog")', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent(dialog(), new Event('close'))
    expect(dialog().open).toBe(false)
  })

  it('stays open when reopened before the last close event arrives', async () => {
    render(<Harness />)
    // Browsers queue the close event; hold it back to model a fast reopen.
    let sendLateClose = () => {}
    dialog().close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open')
      sendLateClose = () => this.dispatchEvent(new Event('close'))
    }
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await userEvent.click(screen.getByRole('button', { name: 'Open', hidden: true }))
    sendLateClose()
    expect(dialog().open).toBe(true)
  })
})
