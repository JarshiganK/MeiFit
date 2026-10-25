import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { pwaState } from '../test/pwaRegisterStub'
import { ToastProvider } from '../ui'
import { UpdatePrompt } from './UpdatePrompt'

function renderPrompt() {
  render(
    <ToastProvider>
      <UpdatePrompt />
    </ToastProvider>,
  )
}

afterEach(() => {
  pwaState.needRefresh = false
  pwaState.offlineReady = false
  pwaState.updateServiceWorker.mockClear()
})

describe('UpdatePrompt', () => {
  it('shows nothing when there is no update', () => {
    renderPrompt()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('offers a reload when a new version is waiting', async () => {
    pwaState.needRefresh = true
    renderPrompt()
    expect(screen.getByText('Update available')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(pwaState.updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('says when the app is ready to work offline', () => {
    pwaState.offlineReady = true
    renderPrompt()
    expect(screen.getByText('Ready to work offline.')).toBeInTheDocument()
  })
})
