import { expect, test, type Page } from '@playwright/test'
import {
  expectNoSeriousA11yIssues,
  idbAll,
  idbPut,
  seedProfile,
  useTheme,
  type ThemeName,
} from './helpers'

const TARGET = {
  id: 1,
  startsOn: '2026-01-01',
  kcal: 2021,
  kcalFloor: 1626,
  proteinG: 124,
  proteinQuestThresholdG: null,
  reason: 'setup',
}

const FOODS = [
  {
    id: 1,
    name: 'Rice',
    category: 'staple',
    serving: '1 cup cooked',
    unit: 'cups',
    kcal: 200,
    proteinG: 4,
    countsAsProtein: false,
  },
  {
    id: 2,
    name: 'Chicken curry',
    category: 'curry',
    serving: '1 serving',
    unit: 'size',
    kcal: 200,
    proteinG: 20,
    countsAsProtein: true,
  },
  {
    id: 3,
    name: 'Plain tea',
    category: 'drink',
    serving: '1 cup',
    unit: 'count',
    kcal: 20,
    proteinG: 0,
    countsAsProtein: false,
  },
]

test.beforeEach(async ({ page }) => {
  await seedProfile(page)
  await idbPut(page, 'targetHistory', TARGET)
  for (const food of FOODS) await idbPut(page, 'foods', food)
})

/** A tile or portion button: its label, then its ≈ calories. */
const withKcal = (label: string) => new RegExp(`^${label}\\s?≈`)

async function logItem(page: Page, tile: RegExp, portion: RegExp) {
  await page.getByRole('button', { name: tile }).click()
  await page.getByRole('dialog').getByRole('button', { name: portion }).click()
  await expect(page.getByRole('status').getByText(/^Added /)).toBeVisible()
}

test('logging a meal takes two taps, updates the ≈ totals and survives a reload', async ({
  page,
}) => {
  await page.goto('/food')
  await expect(page.getByRole('heading', { level: 1, name: 'Food' })).toBeVisible()
  await page.getByText('Lunch', { exact: true }).click()

  await logItem(page, withKcal('Rice'), withKcal('1½ cups'))
  await logItem(page, withKcal('Chicken curry'), withKcal('Normal'))
  await logItem(page, withKcal('Plain tea'), /^× 2$/)

  const totals = page.getByRole('region', { name: 'Totals' })
  // 300 + 200 + 40 = 540 kcal; 6 + 20 = 26 g protein.
  await expect(totals.getByText('≈540')).toBeVisible()
  await expect(totals.getByText('26 g')).toBeVisible()
  const lunch = page.getByRole('region', { name: 'Logged' }).getByRole('region', { name: 'Lunch' })
  await expect(lunch.getByText('1 protein item')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('region', { name: 'Totals' }).getByText('≈540')).toBeVisible()
  const meals = (await idbAll(page, 'meals')) as { slot: string; kcal: number }[]
  expect(meals.map((meal) => [meal.slot, meal.kcal])).toEqual([
    ['lunch', 300],
    ['lunch', 200],
    ['drink', 40],
  ])
})

test('a new menu item can be added and logged straight away', async ({ page }) => {
  await page.goto('/settings/menu')
  await page.getByRole('button', { name: 'Add item' }).click()
  const sheet = page.getByRole('dialog', { name: 'New menu item' })
  await sheet.getByLabel('Name').fill('Fish curry')
  await sheet.getByLabel('Calories per serving (kcal)').fill('180')
  await sheet.getByLabel('Protein per serving (g)').fill('18')
  await sheet.getByRole('switch', { name: 'Counts as a protein' }).click()
  await sheet.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Saved Fish curry')).toBeVisible()

  await page.goto('/food')
  await logItem(page, withKcal('Fish curry'), withKcal('Large'))
  await expect(page.getByRole('region', { name: 'Totals' }).getByText('27 g')).toBeVisible()
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`Food with meals and the portion sheet pass axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/food')
    await logItem(page, withKcal('Rice'), withKcal('1 cup'))
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await expectNoSeriousA11yIssues(page)

    await page.getByRole('button', { name: withKcal('Chicken curry') }).click()
    await expect(page.getByRole('dialog', { name: 'Chicken curry' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
  test(`the menu editor with items and its form pass axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/settings/menu')
    await expect(page.getByRole('button', { name: /^Edit Rice/ })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await page.getByRole('button', { name: /^Edit Rice/ }).click()
    await expect(page.getByRole('dialog', { name: 'Edit Rice' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
}

test('flex day budget, +1 drink and a custom entry', async ({ page }) => {
  await page.goto('/food')
  await page.getByText('Lunch', { exact: true }).click()
  await logItem(page, withKcal('Rice'), withKcal('2 cups'))
  await page.getByRole('switch', { name: 'Flex day' }).click()
  const totals = page.getByRole('region', { name: 'Totals' })
  await expect(totals.getByText('≈1,620 left for dinner')).toBeVisible()

  await page.getByRole('button', { name: '+1 Plain tea' }).click()
  await expect(page.getByText('Added Plain tea (× 1) to drinks')).toBeVisible()

  await page.getByRole('button', { name: 'Something else' }).click()
  const sheet = page.getByRole('dialog', { name: 'Add something else' })
  await sheet.getByLabel('What was it?').fill('Shop kottu')
  await sheet.getByLabel('Calories per serving (kcal)').fill('950')
  await sheet.getByLabel('Protein per serving (g)').fill('30')
  await sheet.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Added Shop kottu to lunch')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('switch', { name: 'Flex day' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  const meals = (await idbAll(page, 'meals')) as { source: string }[]
  expect(meals.map((meal) => meal.source)).toEqual(['tap', 'tap', 'custom'])
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`Food on a flex day with the custom entry form passes axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/food')
    await page.getByRole('switch', { name: 'Flex day' }).click()
    await expect(page.getByText(/left for dinner/)).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await page.getByRole('button', { name: 'Something else' }).click()
    await expect(page.getByRole('dialog', { name: 'Add something else' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
}
