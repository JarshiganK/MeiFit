import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Drumstick, Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { ScreenFallback } from '../../app/ScreenFallback'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { allFoods, saveFood, setFoodArchived } from '../../db/food'
import { getProfile } from '../../db/profile'
import type { Food, FoodCategory, FoodUnit } from '../../db/types'
import { ageOn, toLocalDate } from '../../domain/date'
import { CATEGORY_ORDER, displayProtein, validateFood, type FoodField } from '../../domain/food'
import { parseNumber } from '../../domain/number'
import { ADULT_AGE } from '../../domain/targets'
import {
  Button,
  Card,
  IconButton,
  SegmentedControl,
  SelectField,
  Sheet,
  Switch,
  TextField,
  useToast,
} from '../../ui'
import { approxKcal } from '../food/format'

interface FormState {
  id?: number | undefined
  name: string
  serving: string
  category: FoodCategory
  unit: FoodUnit
  kcal: string
  proteinG: string
  countsAsProtein: boolean
  archived?: boolean | undefined
}

const NEW_FOOD: FormState = {
  name: '',
  serving: '',
  category: 'curry',
  unit: 'size',
  kcal: '',
  proteinG: '',
  countsAsProtein: false,
}

function toForm(food: Food): FormState {
  return {
    id: food.id,
    name: food.name,
    serving: food.serving,
    category: food.category,
    unit: food.unit,
    kcal: String(food.kcal),
    proteinG: String(food.proteinG),
    countsAsProtein: food.countsAsProtein,
    archived: food.archived,
  }
}

/** Settings → Menu: add, change and remove menu items (plan §3, §18). */
export function MenuEditorScreen() {
  const data = useLiveQuery(async () => {
    const profile = await getProfile()
    return {
      foods: await allFoods(),
      isMinor: profile ? ageOn(profile.birthDate, toLocalDate(Date.now())) < ADULT_AGE : false,
    }
  }, [])
  const [form, setForm] = useState<FormState | null>(null)
  const toast = useToast()

  if (!data) return <ScreenFallback />
  const { foods, isMinor } = data
  const active = foods.filter((food) => !food.archived)
  const archived = foods.filter((food) => food.archived)

  const archive = async (food: FormState) => {
    if (food.id === undefined) return
    setForm(null)
    await setFoodArchived(food.id, true)
    toast.show({
      message: en.menuEditor.archived(food.name),
      action: { label: en.common.undo, onAction: () => void setFoodArchived(food.id!, false) },
    })
  }

  return (
    <>
      <ScreenHeader title={en.menuEditor.title} backTo="/settings" />
      <div className="flex flex-col gap-4 pt-2">
        <p className="text-muted">{en.menuEditor.intro}</p>
        <Button icon={<Plus size={20} />} onClick={() => setForm(NEW_FOOD)}>
          {en.menuEditor.add}
        </Button>

        {active.length === 0 && <p className="text-muted">{en.menuEditor.empty}</p>}
        {CATEGORY_ORDER.map((category) => {
          const items = active.filter((food) => food.category === category)
          if (items.length === 0) return null
          return (
            <Card key={category} title={en.food.categories[category]}>
              <ul className="-my-2 divide-y divide-border">
                {items.map((food) => (
                  <li key={food.id}>
                    <button
                      type="button"
                      onClick={() => setForm(toForm(food))}
                      className="flex min-h-13 w-full items-center gap-3 py-2 text-left focus-visible:outline-3 focus-visible:outline-accent"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="sr-only">{en.menuEditor.edit} </span>
                        <span className="block font-semibold">{food.name}</span>
                        <span className="block text-sm text-muted tabular-nums">
                          {food.serving}
                          {food.serving && ' · '}
                          {isMinor
                            ? en.food.itemProtein(displayProtein(food.proteinG))
                            : en.food.itemValues(
                                approxKcal(food.kcal),
                                displayProtein(food.proteinG),
                              )}
                        </span>
                      </span>
                      {food.countsAsProtein && (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-vit">
                          <Drumstick aria-hidden="true" size={14} />
                          {en.food.countsAsProtein}
                        </span>
                      )}
                      <ChevronRight aria-hidden="true" size={20} className="shrink-0 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}

        {archived.length > 0 && (
          <Card title={en.menuEditor.archivedTitle} subtitle={en.menuEditor.archivedHint}>
            <ul className="-my-2 divide-y divide-border">
              {archived.map((food) => (
                <li key={food.id} className="flex min-h-13 items-center gap-3 py-1">
                  <span className="min-w-0 flex-1 text-muted">{food.name}</span>
                  <IconButton
                    label={en.menuEditor.restore(food.name)}
                    icon={<RotateCcw size={20} />}
                    onClick={() => {
                      void setFoodArchived(food.id!, false)
                      toast.show({ message: en.menuEditor.restored(food.name) })
                    }}
                  />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Sheet
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id === undefined ? en.menuEditor.addTitle : en.menuEditor.editTitle(form.name)}
      >
        {form && (
          <FoodForm
            key={form.id ?? 'new'}
            initial={form}
            hideKcal={isMinor}
            otherNames={foods.filter((food) => food.id !== form.id).map((food) => food.name)}
            onSaved={(name) => {
              setForm(null)
              toast.show({ message: en.menuEditor.saved(name) })
            }}
            onArchive={() => void archive(form)}
          />
        )}
      </Sheet>
    </>
  )
}

function FoodForm({
  initial,
  hideKcal,
  otherNames,
  onSaved,
  onArchive,
}: {
  initial: FormState
  hideKcal: boolean
  otherNames: string[]
  onSaved: (name: string) => void
  onArchive: () => void
}) {
  const copy = en.menuEditor
  const [form, setForm] = useState(initial)
  const [showErrors, setShowErrors] = useState(false)
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  // Under-18s never see calorie numbers; a new item they add is saved with 0 kcal.
  const kcal = hideKcal ? (parseNumber(form.kcal) ?? 0) : parseNumber(form.kcal)
  const proteinG = parseNumber(form.proteinG)
  const errors = validateFood(
    { name: form.name, serving: form.serving, kcal, proteinG },
    otherNames,
  )
  const errorFor = (field: FoodField) => {
    const error = showErrors ? errors[field] : undefined
    return error ? { error: copy.errors[error] } : {}
  }

  const save = async () => {
    if (Object.keys(errors).length > 0 || kcal === undefined || proteinG === undefined) {
      setShowErrors(true)
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('dialog [aria-invalid="true"]')?.focus()
      })
      return
    }
    const food: Food = {
      name: form.name,
      serving: form.serving,
      category: form.category,
      unit: form.unit,
      kcal,
      proteinG,
      countsAsProtein: form.countsAsProtein,
      ...(form.id !== undefined ? { id: form.id } : {}),
      ...(form.archived !== undefined ? { archived: form.archived } : {}),
    }
    await saveFood(food)
    onSaved(food.name.trim())
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <TextField
        label={copy.name}
        value={form.name}
        maxLength={60}
        autoComplete="off"
        onChange={(event) => update({ name: event.target.value })}
        {...errorFor('name')}
      />
      <TextField
        label={copy.serving}
        hint={copy.servingHint}
        value={form.serving}
        maxLength={60}
        autoComplete="off"
        onChange={(event) => update({ serving: event.target.value })}
        {...errorFor('serving')}
      />
      <SelectField
        label={copy.category}
        options={CATEGORY_ORDER.map((value) => ({ value, label: en.food.categories[value] }))}
        value={form.category}
        onChange={(category) => update({ category })}
      />
      <SegmentedControl
        label={copy.unit}
        hint={copy.unitHints[form.unit]}
        options={(['cups', 'size', 'count'] as const).map((value) => ({
          value,
          label: copy.units[value],
        }))}
        value={form.unit}
        onChange={(unit) => update({ unit })}
      />
      <div className="flex flex-col gap-4">
        {!hideKcal && (
          <TextField
            label={copy.kcal}
            inputMode="decimal"
            value={form.kcal}
            onChange={(event) => update({ kcal: event.target.value })}
            {...errorFor('kcal')}
          />
        )}
        <TextField
          label={copy.protein}
          inputMode="decimal"
          value={form.proteinG}
          onChange={(event) => update({ proteinG: event.target.value })}
          {...errorFor('proteinG')}
        />
      </div>
      <Switch
        label={copy.countsAsProtein}
        hint={copy.countsAsProteinHint}
        checked={form.countsAsProtein}
        onChange={(countsAsProtein) => update({ countsAsProtein })}
      />
      <Button type="submit" block size="lg">
        {copy.save}
      </Button>
      {initial.id !== undefined && !initial.archived && (
        <Button variant="ghost" block onClick={onArchive}>
          {copy.archive}
        </Button>
      )}
    </form>
  )
}
