/**
 * Browser DataTransfer helpers for the media desk.
 *
 * Clipboard and drag payloads differ across engines. Firefox is the awkward
 * one: screenshot pastes often leave `files` empty while still exposing the
 * image through `items` + `getAsFile()`, and clipboard-backed File objects can
 * become unreadable once the paste handler returns. Everything here stays
 * synchronous so the bytes are captured in the same turn as the event.
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
  return IMAGE_EXTENSION_PATTERN.test(file.name)
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
 */
export function filenameForImage(file: File): string {
  if (file.name && IMAGE_EXTENSION_PATTERN.test(file.name)) return file.name

  const extension = IMAGE_MIME_TO_EXT[file.type.toLowerCase()]
  if (!extension) return file.name || 'image.png'

  const stem =
    file.name
      .replace(/\.[^.]*$/, '')
      .trim()
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image'
  return `${stem}.${extension}`
}

/**
 * Re-wrap a file so its bytes outlive the paste/drop event.
 *
 * Firefox can clear clipboard-backed File data after the handler returns.
 * Building a fresh `File` during the event copies the blob into one the
 * editor can still read when publishing.
 */
export function materializeImageFile(file: File): File {
  const name = filenameForImage(file)
  return new File([file], name, {
    type: file.type || mimeFromFilename(name),
    lastModified: file.lastModified || Date.now(),
  })
}

/**
 * Collect image files from a paste or drop payload.
 *
 * Prefer `items` + `getAsFile()` (Firefox screenshot pastes), then fall back
 * to `files`. Always materialize so later `FileReader` / publish steps work.
 */
export function filesFromDataTransfer(
  transfer: DataTransfer | null | undefined,
): File[] {
  if (!transfer) return []

  const out: File[] = []
  const seen = new Set<string>()

  const take = (file: File | null) => {
    if (!file || !isImageFile(file)) return
    const materialized = materializeImageFile(file)
    const key = `${materialized.name}:${materialized.size}:${materialized.type}:${materialized.lastModified}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(materialized)
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
