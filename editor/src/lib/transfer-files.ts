/**
 * Browser DataTransfer helpers for the media desk.
 *
 * Clipboard and drag payloads differ across engines. Firefox is the awkward
 * one: screenshot pastes often leave `files` empty while still exposing the
 * image through `items` + `getAsFile()`, and clipboard-backed File objects can
 * become unreadable once the paste handler returns.
 *
 * Capture stays two-step on purpose:
 * 1. `filesFromDataTransfer` / `getAsFile()` run synchronously in the event
 *    turn (required — Firefox clears the transfer after the handler returns).
 * 2. `materializeImageFile` starts `arrayBuffer()` in that same turn so the
 *    engine keeps the bytes available, then builds a durable File the publish
 *    path can still read later. A soft `new File([blob])` wrap is not enough:
 *    it keeps a reference to the short-lived clipboard blob rather than
 *    copying the bytes.
 */

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return IMAGE_EXTENSION_PATTERN.test(file.name || '')
}

function mimeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'png') return 'image/png'
  if (extension === 'gif') return 'image/gif'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'avif') return 'image/avif'
  return ''
}

/**
 * Clipboard screenshots sometimes arrive with an empty name or no extension.
 * Infer a usable `image.png`-style name from the MIME type so the rest of the
 * pipeline (filename validation, publish paths) still accepts them.
 *
 * Some runtimes (and occasional engine quirks) expose a missing name as
 * `undefined` rather than `""` — treat both the same.
 */
export function filenameForImage(file: File): string {
  const rawName = typeof file.name === 'string' ? file.name : ''
  if (rawName && IMAGE_EXTENSION_PATTERN.test(rawName)) return rawName

  const extension = IMAGE_MIME_TO_EXT[(file.type || '').toLowerCase()]
  if (!extension) return rawName || 'image.png'

  const stem =
    rawName
      .replace(/\.[^.]*$/, '')
      .trim()
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image'
  return `${stem}.${extension}`
}

/**
 * Deep-copy a file so its bytes outlive the paste/drop event.
 *
 * Call this (and thereby `arrayBuffer()`) in the same turn as the paste/drop
 * handler. Awaiting the promise may finish later; starting the read is what
 * keeps Firefox from discarding clipboard-backed data.
 */
export async function materializeImageFile(file: File): Promise<File> {
  const name = filenameForImage(file)
  const type = file.type || mimeFromFilename(name)
  const lastModified = file.lastModified || Date.now()
  const buffer = await file.arrayBuffer()
  return new File([buffer], name, { type, lastModified })
}

/**
 * Collect image files from a paste or drop payload.
 *
 * Prefer `items` + `getAsFile()` (Firefox screenshot pastes), then fall back
 * to `files`. Returns the live transfer Files — pass them straight into
 * `materializeImageFile` before the event turn ends.
 */
export function filesFromDataTransfer(
  transfer: DataTransfer | null | undefined,
): File[] {
  if (!transfer) return []

  const out: File[] = []
  const seen = new Set<string>()

  const take = (file: File | null) => {
    if (!file || !isImageFile(file)) return
    const key = `${file.name}:${file.size}:${file.type}:${file.lastModified}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(file)
  }

  if (transfer.items?.length) {
    for (const item of Array.from(transfer.items)) {
      if (item.kind === 'file') take(item.getAsFile())
    }
  }

  if (!out.length && transfer.files?.length) {
    for (const file of Array.from(transfer.files)) take(file)
  }

  return out
}

/**
 * A drag only exposes its file list on drop; during `dragover` the browser
 * withholds it and advertises the payload through `types` instead. Reading
 * `files` here would always see zero and refuse the drop.
 *
 * Firefox also reports `application/x-moz-file` for OS file drags.
 */
export function isDraggingFiles(transfer: DataTransfer | null): boolean {
  if (!transfer) return false
  const types = Array.from(transfer.types as ArrayLike<string>)
  return (
    types.includes('Files') || types.includes('application/x-moz-file')
  )
}
