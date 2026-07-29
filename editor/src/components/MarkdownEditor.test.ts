import { describe, expect, it } from 'vitest'

import { isDraggingFiles } from './MarkdownEditor'

/**
 * `dragover` has to be answered from `types`. A drag that reads `files` sees an
 * empty list mid-drag, never calls `preventDefault`, and the browser then
 * refuses the drop and navigates away from the editor to show the image.
 */
describe('isDraggingFiles', () => {
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
