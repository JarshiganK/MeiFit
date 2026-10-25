import { describe, expect, it } from 'vitest'
import { DEFAULT_ROUTINE, buildSetup, type SetupAnswers } from '../domain/setup'
import { db } from './db'
import {
  acceptProteinThreshold,
  currentTarget,
  getProfile,
  latestWeighIn,
  mealsBetween,
  saveSetup,
} from './profile'
import { STARTER_MENU } from './seed/starterMenu'
import { getSetting } from './settings'

const NOW = new Date(2026, 9, 25, 9, 30).getTime()
const ANSWERS: SetupAnswers = {
  nickname: 'Sam',
  sex: 'male',
  birthDate: '2001-10-25',
  heightCm: 169,
  weightKg: 69,
  activityLevel: 'moderate',
  goal: 'lose',
  pace: 'standard',
  ...DEFAULT_ROUTINE,
}

const OPTIONS = {
  loadStarterMenu: true,
  exams: [{ date: '2026-11-20', title: 'Maths paper' }],
  baselineCheckDue: '2026-10-31',
}

describe('saveSetup', () => {
  it('saves the profile, first targets, first weigh-in, menu, exams and baseline date', async () => {
    await saveSetup(buildSetup(ANSWERS, NOW), OPTIONS)

    const profile = await getProfile()
    expect(profile).toMatchObject({ id: 'me', nickname: 'Sam', setupDate: '2026-10-25' })
    expect(await currentTarget('2026-10-25')).toMatchObject({
      startsOn: '2026-10-25',
      kcal: 2021,
      proteinG: 124,
      proteinQuestThresholdG: null,
      reason: 'setup',
    })
    expect(await latestWeighIn()).toMatchObject({ date: '2026-10-25', weightKg: 69 })
    expect(await db.foods.count()).toBe(STARTER_MENU.length)
    expect(await db.events.toArray()).toEqual([
      expect.objectContaining({ date: '2026-11-20', type: 'exam', title: 'Maths paper' }),
    ])
    expect(await getSetting('baselineCheckDue', '')).toBe('2026-10-31')
  })

  it('starts with an empty menu when the starter menu is declined', async () => {
    await saveSetup(buildSetup(ANSWERS, NOW), { ...OPTIONS, loadStarterMenu: false })
    expect(await db.foods.count()).toBe(0)
  })

  it('never loads the starter menu on top of an existing menu', async () => {
    await saveSetup(buildSetup(ANSWERS, NOW), OPTIONS)
    await saveSetup(buildSetup(ANSWERS, NOW + 60_000), { ...OPTIONS, exams: [] })
    expect(await db.foods.count()).toBe(STARTER_MENU.length)
  })

  it('replaces the same day’s targets and weigh-in when setup is rerun that day', async () => {
    await saveSetup(buildSetup(ANSWERS, NOW), OPTIONS)
    await saveSetup(buildSetup({ ...ANSWERS, weightKg: 70, goal: 'maintain' }, NOW + 60_000), {
      ...OPTIONS,
      exams: [],
    })
    expect(await db.targetHistory.count()).toBe(1)
    expect((await currentTarget('2026-10-25'))?.kcal).toBe(2536)
    expect(await db.bodyLogs.count()).toBe(1)
    expect((await latestWeighIn())?.weightKg).toBe(70)
    expect(await db.profile.count()).toBe(1)
  })

  it('keeps earlier targets so past days are judged by the targets they had', async () => {
    await saveSetup(buildSetup(ANSWERS, NOW), OPTIONS)
    const nextWeek = new Date(2026, 10, 1, 9).getTime()
    await saveSetup(buildSetup({ ...ANSWERS, goal: 'maintain' }, nextWeek), {
      ...OPTIONS,
      exams: [],
    })
    expect(await db.targetHistory.count()).toBe(2)
    expect((await currentTarget('2026-10-31'))?.kcal).toBe(2021)
    expect((await currentTarget('2026-11-01'))?.kcal).toBe(2521)
    expect(await currentTarget('2026-10-24')).toBeUndefined()
  })
})

describe('starter menu', () => {
  it('matches plan §18, with the generic plate split by size', () => {
    expect(STARTER_MENU).toHaveLength(24)
    const byName = Object.fromEntries(STARTER_MENU.map((f) => [f.name, f]))
    expect(byName.Rice).toMatchObject({ unit: 'cups', kcal: 200, proteinG: 4 })
    expect(byName['Dhal curry']?.countsAsProtein).toBe(false)
    expect(byName['Chicken curry']?.countsAsProtein).toBe(true)
    expect(
      ['small', 'normal', 'large'].map((s) => byName[`Rice and curry plate (${s})`]?.kcal),
    ).toEqual([550, 650, 900])
    expect(new Set(STARTER_MENU.map((f) => f.name)).size).toBe(STARTER_MENU.length)
  })
})

describe('saveSetup when answers change later', () => {
  it('keeps the booked baseline check and adds no weigh-in when the weight is unchanged', async () => {
    await saveSetup(buildSetup(ANSWERS, NOW), OPTIONS)
    const nextWeek = new Date(2026, 10, 1, 9).getTime()
    await saveSetup(buildSetup({ ...ANSWERS, goal: 'maintain' }, nextWeek), {
      loadStarterMenu: false,
      exams: [],
      recordWeighIn: false,
    })
    expect(await db.bodyLogs.count()).toBe(1)
    expect(await getSetting('baselineCheckDue', '')).toBe('2026-10-31')
    expect((await getProfile())?.goal).toBe('maintain')
  })
})

describe('acceptProteinThreshold', () => {
  it('starts a calibration row from the given day, carrying the other targets', async () => {
    await db.targetHistory.add({
      startsOn: '2026-10-01',
      kcal: 2021,
      kcalFloor: 1626,
      proteinG: 124,
      proteinQuestThresholdG: null,
      reason: 'setup',
    })
    await acceptProteinThreshold('2026-10-15', 90)
    expect(await currentTarget('2026-10-14')).toMatchObject({ proteinQuestThresholdG: null })
    expect(await currentTarget('2026-10-15')).toMatchObject({
      startsOn: '2026-10-15',
      kcal: 2021,
      proteinG: 124,
      proteinQuestThresholdG: 90,
      reason: 'calibration',
    })
    // Changing it again the same day updates that row.
    await acceptProteinThreshold('2026-10-15', 95)
    expect(await db.targetHistory.count()).toBe(2)
    expect((await currentTarget('2026-10-15'))?.proteinQuestThresholdG).toBe(95)
  })

  it('needs targets to calibrate', async () => {
    await expect(acceptProteinThreshold('2026-10-15', 90)).rejects.toThrow()
  })

  it('reads meals between two dates', async () => {
    const meal = {
      at: 0,
      slot: 'lunch' as const,
      items: [],
      kcal: 0,
      proteinG: 0,
      source: 'tap' as const,
    }
    await db.meals.bulkAdd([
      { ...meal, date: '2026-09-30' },
      { ...meal, date: '2026-10-01' },
      { ...meal, date: '2026-10-14' },
      { ...meal, date: '2026-10-15' },
    ])
    expect((await mealsBetween('2026-10-01', '2026-10-14')).map((m) => m.date)).toEqual([
      '2026-10-01',
      '2026-10-14',
    ])
  })
})
