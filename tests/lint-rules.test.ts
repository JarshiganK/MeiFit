// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

// Only the project's syntax rules run here, so type information isn't needed
// for the in-memory snippets.
const eslint = new ESLint({
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  overrideConfig: { languageOptions: { parserOptions: { projectService: false } } },
  ruleFilter: ({ ruleId }) => ruleId === 'no-restricted-syntax',
})

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath })
  return (result?.messages ?? []).map((m) => m.message)
}

describe('project lint rules', () => {
  it('bans toISOString outside src/domain/date.ts', async () => {
    const messages = await ruleIds('export const d = new Date(0).toISOString()\n', 'src/app/x.ts')
    expect(messages.some((m) => m.includes('toISOString'))).toBe(true)
  })

  it('allows toISOString in src/domain/date.ts', async () => {
    const messages = await ruleIds(
      'export const d = new Date(0).toISOString()\n',
      'src/domain/date.ts',
    )
    expect(messages.some((m) => m.includes('toISOString'))).toBe(false)
  })

  it('stops domain code from reading the clock', async () => {
    const messages = await ruleIds('export const now = Date.now()\n', 'src/domain/x.ts')
    expect(messages.some((m) => m.includes('never reads the clock'))).toBe(true)
  })

  it('bans raw hex colours and arbitrary pixel values in components', async () => {
    const hex = await ruleIds("export const c = '#ff0000'\n", 'src/ui/x.tsx')
    const px = await ruleIds("export const c = 'w-[13px]'\n", 'src/ui/x.tsx')
    expect(hex.some((m) => m.includes('colour token'))).toBe(true)
    expect(px.some((m) => m.includes('pixel value'))).toBe(true)
  })
})
