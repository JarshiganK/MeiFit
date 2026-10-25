import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_TOAST_MS, ToastProvider } from './Toast'
import { useToast, type ToastOptions } from './toastContext'

function Trigger({ options }: { options: ToastOptions }) {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast.show(options)}>
      Trigger
    </button>
  )
}

function renderWith(options: ToastOptions) {
  render(
    <ToastProvider>
      <Trigger options={options} />
    </ToastProvider>,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Toast', () => {
  it('announces the message in a polite live region', async () => {
    renderWith({ message: 'Meal saved' })
    await userEvent.click(screen.getByRole('button', { name: 'Trigger' }))
    expect(screen.getByRole('status')).toHaveTextContent('Meal saved')
  })

  it('runs the undo action once and hides', async () => {
    const onAction = vi.fn()
    renderWith({ message: 'Meal deleted', action: { label: 'Undo', onAction } })
    await userEvent.click(screen.getByRole('button', { name: 'Trigger' }))
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onAction).toHaveBeenCalledOnce()
    expect(screen.queryByText('Meal deleted')).not.toBeInTheDocument()
  })

  it('can be dismissed', async () => {
    renderWith({ message: 'Saved' })
    await userEvent.click(screen.getByRole('button', { name: 'Trigger' }))
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('hides itself after the default duration', () => {
    vi.useFakeTimers()
    renderWith({ message: 'Saved' })
    act(() => {
      screen.getByRole('button', { name: 'Trigger' }).click()
    })
    expect(screen.getByText('Saved')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(DEFAULT_TOAST_MS)
    })
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('stays until acted on when the duration is null', () => {
    vi.useFakeTimers()
    renderWith({ message: 'Update available', durationMs: null })
    act(() => {
      screen.getByRole('button', { name: 'Trigger' }).click()
    })
    act(() => {
      vi.advanceTimersByTime(DEFAULT_TOAST_MS * 10)
    })
    expect(screen.getByText('Update available')).toBeInTheDocument()
  })

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Trigger options={{ message: 'x' }} />)).toThrow(/ToastProvider/)
  })
})
