/**
 * The Gemini backup for photo meal recognition (plan §11): only the photo and
 * the menu names are sent, with the user's own key, to the model named in
 * Settings. Pure helpers: building the request and reading the answer.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
export const PHOTO_MAX_WIDTH = 800
const MODEL_NAME = /^[a-z0-9][a-z0-9.-]*$/i

/** The same prompt as Meal Snap, so both routes answer with menu names. */
export function mealPrompt(menuNames: readonly string[]): string {
  return `Which of these foods are on the plate: ${menuNames.join(', ')}? Reply only with names from the list, separated by commas.`
}

export function isValidModelName(name: string): boolean {
  return MODEL_NAME.test(name.trim())
}

export function geminiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.trim())}:generateContent`
}

export function geminiRequestBody(imageBase64: string, mimeType: string, prompt: string) {
  return {
    contents: [
      {
        parts: [{ inline_data: { mime_type: mimeType, data: imageBase64 } }, { text: prompt }],
      },
    ],
  }
}

/** The answer's text, or undefined if the response has none. */
export function answerText(response: unknown): string | undefined {
  const candidates = (response as { candidates?: unknown })?.candidates
  if (!Array.isArray(candidates)) return undefined
  const parts = (candidates[0] as { content?: { parts?: unknown } } | undefined)?.content?.parts
  if (!Array.isArray(parts)) return undefined
  const text = parts
    .map((p) =>
      typeof (p as { text?: unknown }).text === 'string' ? (p as { text: string }).text : '',
    )
    .join('')
    .trim()
  return text || undefined
}

/** Food names from the answer: comma or line separated, without quotes, bullets or a final full stop. */
export function namesFromAnswer(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((n) => n.replace(/^[\s*•\-"'“”]+|[\s."'“”]+$/g, '').trim())
    .filter((n) => n.length > 0 && n.length <= 60)
}

/** Width and height for a photo shrunk to at most 800 px wide, keeping its shape. */
export function scaledSize(width: number, height: number): { width: number; height: number } {
  if (width <= PHOTO_MAX_WIDTH) return { width, height }
  return { width: PHOTO_MAX_WIDTH, height: Math.round((height * PHOTO_MAX_WIDTH) / width) }
}
