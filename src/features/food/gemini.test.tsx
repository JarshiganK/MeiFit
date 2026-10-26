import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { getSetting, setSetting } from '../../db/settings'
import { STARTER_MENU } from '../../db/seed/starterMenu'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'
import type * as PhotoModule from './photo'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))
// jsdom can't decode images; the shrinking itself is covered by scaledSize's unit test.
vi.mock('./photo', async (importOriginal) => ({
  ...(await importOriginal<typeof PhotoModule>()),
  shrinkPhoto: vi.fn(() => Promise.resolve({ base64: 'QUJD', mimeType: 'image/jpeg' })),
}))

const LUNCH = new Date(2026, 9, 25, 13, 5)

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: LUNCH })
  await seedProfile()
  await db.foods.bulkAdd(STARTER_MENU.map((food) => ({ ...food })))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function stubGemini(response: Response | Promise<Response>) {
  const fetchMock = vi.fn(() => Promise.resolve(response))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function answer(text: string) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
    status: 200,
  })
}

async function turnOn() {
  await setSetting('geminiEnabled', true)
  await setSetting('geminiKey', 'test-key')
}

const photo = () => new File(['x'], 'plate.jpg', { type: 'image/jpeg' })

describe('Gemini photo recognition (plan §11)', () => {
  it('is off by default: no Photo button on Food', async () => {
    renderApp('/food')
    await screen.findByRole('heading', { level: 1, name: 'Food' })
    expect(screen.queryByRole('button', { name: 'Photo' })).not.toBeInTheDocument()
  })

  it('is set up in Settings with a key that stays on this phone', async () => {
    renderApp('/settings')
    const card = await screen.findByRole('region', { name: en.gemini.title })
    await userEvent.click(await within(card).findByRole('switch', { name: en.gemini.enable }))
    await userEvent.type(await within(card).findByLabelText('Gemini API key'), 'my-key')
    const model = within(card).getByLabelText('Model name')
    expect(model).toHaveValue('gemini-2.5-flash')
    await userEvent.click(within(card).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText(en.gemini.keySaved)).toBeInTheDocument()
    expect(await getSetting('geminiKey', '')).toBe('my-key')
    expect(await getSetting('geminiEnabled', false)).toBe(true)
  })

  it('refuses an odd model name', async () => {
    await turnOn()
    renderApp('/settings')
    const card = await screen.findByRole('region', { name: en.gemini.title })
    const model = await within(card).findByLabelText('Model name')
    await userEvent.clear(model)
    await userEvent.type(model, '../models')
    expect(within(card).getByText(en.gemini.modelInvalid)).toBeInTheDocument()
  })

  it('sends the photo and menu, then adds the reviewed meal', async () => {
    await turnOn()
    const fetchMock = stubGemini(answer('Rice, Chicken curry, pizza.'))
    renderApp('/food')
    await screen.findByRole('button', { name: 'Photo' })
    await userEvent.upload(screen.getByLabelText(en.gemini.photoLabel), photo())

    const sheet = await screen.findByRole('dialog', { name: en.gemini.reviewTitle })
    expect(within(sheet).getByLabelText('“Rice”')).toHaveDisplayValue('Rice')
    expect(within(sheet).getByLabelText('“pizza”')).toHaveDisplayValue(en.import.skip)
    expect(within(sheet).getByLabelText('Meal')).toHaveDisplayValue('Lunch')

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    )
    expect(init.headers).toMatchObject({ 'x-goog-api-key': 'test-key' })
    expect(url).not.toContain('test-key')
    const body = init.body as string
    expect(body).toContain('QUJD')
    expect(body).toContain('Chicken curry')

    await userEvent.click(within(sheet).getByRole('button', { name: 'Add meal' }))
    expect(await screen.findByText(en.gemini.added)).toBeInTheDocument()
    await waitFor(async () =>
      expect((await db.meals.toArray())[0]?.items.map((i) => i.name)).toEqual([
        'Rice',
        'Chicken curry',
      ]),
    )
  })

  it('explains when Gemini fails or finds nothing', async () => {
    await turnOn()
    stubGemini(new Response('{}', { status: 400 }))
    renderApp('/food')
    await screen.findByRole('button', { name: 'Photo' })
    await userEvent.upload(screen.getByLabelText(en.gemini.photoLabel), photo())
    expect(await screen.findByText(en.gemini.failed)).toBeInTheDocument()

    stubGemini(answer(' '))
    await userEvent.upload(screen.getByLabelText(en.gemini.photoLabel), photo())
    expect(await screen.findByText(en.gemini.nothingFound)).toBeInTheDocument()
  })

  it('says it needs internet when offline', async () => {
    await turnOn()
    const fetchMock = stubGemini(answer('Rice'))
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    renderApp('/food')
    await screen.findByRole('button', { name: 'Photo' })
    await userEvent.upload(screen.getByLabelText(en.gemini.photoLabel), photo())
    expect(await screen.findByText(en.gemini.offline)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
