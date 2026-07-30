import { describe, expect, it } from 'vitest'

// Re-exported from the editor surface for callers that already import it here.
import { isDraggingFiles } from './MarkdownEditor'

/**
 * `dragover` has to be answered from `types`. A drag that reads `files` sees an
 * empty list mid-drag, never calls `preventDefault`, and the browser then
 * refuses the drop and navigates away from the editor to show the image.
 *
 * Broader coverage lives in `lib/transfer-files.test.ts`.
 */
describe('isDraggingFiles (re-export)', () => {
  const transfer = (types: string[], files: number) =>
    ({ files: { length: files }, types } as unknown as DataTransfer)

  it('accepts a file drag while its list is still withheld', () => {
    expect(isDraggingFiles(transfer(['Files'], 0))).toBe(true)
  })

  it('ignores a text drag so CodeMirror keeps handling it', () => {
    expect(isDraggingFiles(transfer(['text/plain'], 0))).toBe(false)
    expect(isDraggingFiles(null)).toBe(false)
  })
})
