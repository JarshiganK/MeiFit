// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { en } from '../src/copy/en'

interface Section {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

/** Reads PRIVACY.md into the same shape as en.privacy.sections. */
function parsePrivacyMarkdown(markdown: string): Section[] {
  const sections: Section[] = []
  for (const line of markdown.split(/\r?\n/).map((l) => l.trim())) {
    if (line.startsWith('## ')) {
      sections.push({ title: line.slice(3), paragraphs: [] })
      continue
    }
    const current = sections.at(-1)
    if (!current || line === '') continue // the title and intro sit before the first section
    if (line.startsWith('- ')) (current.bullets ??= []).push(line.slice(2))
    else current.paragraphs.push(line)
  }
  return sections
}

describe('PRIVACY.md', () => {
  it('matches Settings → Privacy word for word', () => {
    const markdown = readFileSync(new URL('../PRIVACY.md', import.meta.url), 'utf8')
    const inApp = en.privacy.sections.map((s) => ({
      title: s.title,
      paragraphs: [...s.paragraphs],
      ...('bullets' in s ? { bullets: [...s.bullets] } : {}),
    }))
    expect(parsePrivacyMarkdown(markdown)).toEqual(inApp)
  })

  it('covers what is stored, what is sent, and how to export or delete', () => {
    const titles = en.privacy.sections.map((s) => s.title)
    expect(titles).toEqual(
      expect.arrayContaining(['What’s stored', 'What’s sent', 'Export or delete everything']),
    )
  })
})
