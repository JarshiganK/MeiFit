import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yIssues, idbPut, seedProfile, useTheme, type ThemeName } from './helpers'

const NOW = new Date('2026-10-26T08:30:00+05:30') // Monday morning

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await seedProfile(page) // set up on 2026-10-25
  await idbPut(page, 'targetHistory', {
    id: 1,
    startsOn: '2026-10-25',
    kcal: 2021,
    kcalFloor: 1626,
    proteinG: 124,
    proteinQuestThresholdG: null,
    reason: 'setup',
  })
  await idbPut(page, 'foods', {
    id: 1,
    name: 'Boiled egg',
    category: 'side',
    serving: '1',
    unit: 'count',
    kcal: 70,
    proteinG: 6,
    countsAsProtein: true,
  })
})

test('logging a protein breakfast completes its quest and XP rises', async ({ page }) => {
  await page.goto('/')
  const board = page.getByRole('region', { name: 'Today’s quests' })
  const breakfast = board.getByRole('listitem').filter({ hasText: 'Protein at breakfast' })
  await expect(breakfast.getByText('Not yet')).toBeVisible()
  await expect(page.getByText('0 XP in total')).toBeVisible()

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Food' }).click()
  await page.getByText('Breakfast', { exact: true }).click()
  await page.getByRole('button', { name: /^Boiled egg/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: '× 2' }).click()

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Status' }).click()
  await expect(breakfast.getByText('Done')).toBeVisible()
  await expect(page.getByText('10 XP in total')).toBeVisible()
  await expect(page.getByText('115 XP to level 2')).toBeVisible()

  // XP is worked out from the logs, so it's the same after a reload.
  await page.reload()
  await expect(page.getByText('10 XP in total')).toBeVisible()
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`Status with quests and the level-up moment pass axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.addInitScript(() => localStorage.setItem('dq.seenLevel', '1'))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    // Five study blocks today: 150 XP, enough for level 2.
    await idbPut(page, 'studySessions', {
      id: 1,
      date: '2026-10-26',
      startedAt: NOW.getTime() - 5 * 3_600_000,
      minutes: 250,
      completed: true,
      source: 'manual',
    })
    await page.goto('/')
    const dialog = page.getByRole('dialog', { name: 'Level up!' })
    await expect(dialog).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await dialog.getByRole('button', { name: 'Continue' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('150 XP in total')).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
}
