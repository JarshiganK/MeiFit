import { describe, expect, it } from 'vitest'
import { db } from './db'
import { deleteSetting, getSetting, setSetting } from './settings'

describe('settings repository', () => {
  it('returns the fallback when a setting has never been saved', async () => {
    expect(await getSetting('debug', false)).toBe(false)
    expect(await getSetting('fitnessCheckIntervalWeeks', 4)).toBe(4)
  })

  it('saves, overwrites and deletes typed values', async () => {
    await setSetting('debug', true)
    expect(await getSetting('debug', false)).toBe(true)
    await setSetting('fitnessCheckIntervalWeeks', 5)
    await setSetting('fitnessCheckIntervalWeeks', 6)
    expect(await getSetting('fitnessCheckIntervalWeeks', 4)).toBe(6)
    await deleteSetting('debug')
    expect(await getSetting('debug', false)).toBe(false)
    expect(await db.settings.count()).toBe(1)
  })

  it('stores each setting as a key/value row', async () => {
    await setSetting('geminiModel', 'model-name')
    expect(await db.settings.get('geminiModel')).toEqual({
      key: 'geminiModel',
      value: 'model-name',
    })
  })
})
