/**
 * The Gemini backup's network side (plan §11): shrink the photo, send it with
 * the menu names using the user's own key, and return the food names.
 */
import {
  answerText,
  geminiRequestBody,
  geminiUrl,
  mealPrompt,
  namesFromAnswer,
  scaledSize,
} from '../../domain/gemini'

export class PhotoError extends Error {
  constructor(readonly reason: 'offline' | 'failed') {
    super(reason)
  }
}

/** Shrinks a photo to at most 800 px wide as a JPEG; returns base64 without the data: prefix. */
export async function shrinkPhoto(file: Blob): Promise<{ base64: string; mimeType: string }> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = scaledSize(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.8),
  )
  if (!blob) throw new PhotoError('failed')
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return { base64: btoa(binary), mimeType: 'image/jpeg' }
}

export async function recognizeFoods(input: {
  key: string
  model: string
  photo: { base64: string; mimeType: string }
  menuNames: string[]
}): Promise<string[]> {
  if (!navigator.onLine) throw new PhotoError('offline')
  let response: Response
  try {
    response = await fetch(geminiUrl(input.model), {
      method: 'POST',
      // The key goes in a header, not the URL, so it never lands in logs.
      headers: { 'content-type': 'application/json', 'x-goog-api-key': input.key },
      body: JSON.stringify(
        geminiRequestBody(input.photo.base64, input.photo.mimeType, mealPrompt(input.menuNames)),
      ),
    })
  } catch {
    throw new PhotoError(navigator.onLine ? 'failed' : 'offline')
  }
  if (!response.ok) throw new PhotoError('failed')
  const text = answerText(await response.json())
  return text ? namesFromAnswer(text) : []
}
