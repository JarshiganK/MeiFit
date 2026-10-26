import { describe, expect, it } from 'vitest'
import {
  answerText,
  geminiRequestBody,
  geminiUrl,
  isValidModelName,
  mealPrompt,
  namesFromAnswer,
  scaledSize,
} from './gemini'

describe('Gemini backup (plan §11)', () => {
  it('asks for names from the menu only', () => {
    expect(mealPrompt(['Rice', 'Chicken curry'])).toBe(
      'Which of these foods are on the plate: Rice, Chicken curry? Reply only with names from the list, separated by commas.',
    )
  })

  it('builds the request for the model named in Settings', () => {
    expect(geminiUrl(' gemini-2.5-flash ')).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    )
    expect(geminiRequestBody('QUJD', 'image/jpeg', 'prompt')).toEqual({
      contents: [
        { parts: [{ inline_data: { mime_type: 'image/jpeg', data: 'QUJD' } }, { text: 'prompt' }] },
      ],
    })
    expect(isValidModelName('gemini-2.5-flash')).toBe(true)
    expect(isValidModelName('../evil')).toBe(false)
    expect(isValidModelName('')).toBe(false)
  })

  it('reads the answer text', () => {
    const response = {
      candidates: [{ content: { parts: [{ text: 'Rice, ' }, { text: 'Chicken curry.' }] } }],
    }
    expect(answerText(response)).toBe('Rice, Chicken curry.')
    expect(answerText({})).toBeUndefined()
    expect(answerText({ candidates: [{}] })).toBeUndefined()
    expect(
      answerText({ candidates: [{ content: { parts: [{ text: '  ' }, { other: 1 }] } }] }),
    ).toBeUndefined()
    expect(answerText(null)).toBeUndefined()
  })

  it('splits the answer into names', () => {
    expect(namesFromAnswer('Rice, "Chicken curry", Dhal curry.')).toEqual([
      'Rice',
      'Chicken curry',
      'Dhal curry',
    ])
    expect(namesFromAnswer('- Rice\n• Parotta\n\n')).toEqual(['Rice', 'Parotta'])
    expect(namesFromAnswer('x'.repeat(61))).toEqual([])
  })

  it('shrinks photos to 800 px wide', () => {
    expect(scaledSize(4032, 3024)).toEqual({ width: 800, height: 600 })
    expect(scaledSize(640, 480)).toEqual({ width: 640, height: 480 })
  })
})
