import { useState } from 'react'
import { en } from '../../copy/en'
import { saveFood } from '../../db/food'
import { customItem, validateFood, type FoodField, type MealItem } from '../../domain/food'
import { parseNumber } from '../../domain/number'
import { Button, Switch, TextField } from '../../ui'

export interface CustomEntryProps {
  hideKcal: boolean
  otherNames: string[]
  /** Adds the entry to the day; `foodId` is set when it was also saved to the menu. */
  onLog: (item: MealItem) => void
}

/** Outside food or anything not on the menu, with estimated calories and protein (plan §3). */
export function CustomEntry({ hideKcal, otherNames, onLog }: CustomEntryProps) {
  const copy = en.menuEditor
  const [name, setName] = useState('')
  const [kcalText, setKcal] = useState('')
  const [proteinText, setProtein] = useState('')
  const [countsAsProtein, setCountsAsProtein] = useState(false)
  const [addToMenu, setAddToMenu] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const kcal = hideKcal ? (parseNumber(kcalText) ?? 0) : parseNumber(kcalText)
  const proteinG = parseNumber(proteinText)
  const errors = validateFood(
    { name, serving: '', kcal, proteinG },
    // Only a menu item needs a unique name.
    addToMenu ? otherNames : [],
  )
  const errorFor = (field: FoodField) => {
    const error = showErrors ? errors[field] : undefined
    return error ? { error: copy.errors[error] } : {}
  }

  const submit = async () => {
    if (Object.keys(errors).length > 0 || kcal === undefined || proteinG === undefined) {
      setShowErrors(true)
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('dialog [aria-invalid="true"]')?.focus()
      })
      return
    }
    const item = customItem(name, kcal, proteinG, countsAsProtein)
    if (addToMenu) {
      const foodId = await saveFood({
        name: item.name,
        serving: '',
        category: 'outside',
        unit: 'size',
        kcal: item.kcal,
        proteinG: item.proteinG,
        countsAsProtein,
      })
      onLog({ ...item, foodId })
    } else {
      onLog(item)
    }
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <p className="text-muted">{en.food.customIntro}</p>
      <TextField
        label={en.food.customName}
        value={name}
        maxLength={60}
        autoComplete="off"
        onChange={(event) => setName(event.target.value)}
        {...errorFor('name')}
      />
      {!hideKcal && (
        <TextField
          label={copy.kcal}
          inputMode="decimal"
          value={kcalText}
          onChange={(event) => setKcal(event.target.value)}
          {...errorFor('kcal')}
        />
      )}
      <TextField
        label={copy.protein}
        inputMode="decimal"
        value={proteinText}
        onChange={(event) => setProtein(event.target.value)}
        {...errorFor('proteinG')}
      />
      <Switch
        label={copy.countsAsProtein}
        hint={copy.countsAsProteinHint}
        checked={countsAsProtein}
        onChange={setCountsAsProtein}
      />
      <Switch
        label={en.food.customAddToMenu}
        hint={en.food.customAddToMenuHint}
        checked={addToMenu}
        onChange={setAddToMenu}
      />
      <Button type="submit" block size="lg">
        {en.food.customLog}
      </Button>
    </form>
  )
}
