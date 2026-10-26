import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { en } from '../../copy/en'
import { getSetting, setSetting } from '../../db/settings'
import { DEFAULT_GEMINI_MODEL, isValidModelName } from '../../domain/gemini'
import { Button, Card, Switch, TextField, useToast } from '../../ui'

/** Settings → photo recognition with the user's own Gemini key (plan §11, §16). Off by default. */
export function GeminiCard() {
  const data = useLiveQuery(async () => ({
    enabled: await getSetting('geminiEnabled', false),
    apiKey: await getSetting('geminiKey', ''),
    model: await getSetting('geminiModel', DEFAULT_GEMINI_MODEL),
  }))
  return (
    <Card title={en.gemini.title} subtitle={en.gemini.intro}>
      {data && <GeminiForm key={data.apiKey + '|' + data.model} {...data} />}
    </Card>
  )
}

function GeminiForm({
  enabled,
  apiKey: savedKey,
  model: savedModel,
}: {
  enabled: boolean
  apiKey: string
  model: string
}) {
  const copy = en.gemini
  const toast = useToast()
  const [apiKey, setApiKey] = useState(savedKey)
  const [model, setModel] = useState(savedModel)
  const modelOk = isValidModelName(model)
  return (
    <div className="flex flex-col gap-4">
      <Switch
        label={copy.enable}
        checked={enabled}
        onChange={(on) => void setSetting('geminiEnabled', on)}
      />
      {enabled && (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!modelOk) return
            void Promise.all([
              setSetting('geminiKey', apiKey.trim()),
              setSetting('geminiModel', model.trim()),
            ]).then(() => toast.show({ message: copy.keySaved }))
          }}
        >
          <TextField
            label={copy.key}
            hint={copy.keyHint}
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <TextField
            label={copy.model}
            hint={copy.modelHint}
            autoComplete="off"
            spellCheck={false}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            {...(modelOk ? {} : { error: copy.modelInvalid })}
          />
          <Button type="submit" variant="secondary" className="self-start">
            {copy.save}
          </Button>
        </form>
      )}
    </div>
  )
}
