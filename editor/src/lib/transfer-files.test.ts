import { describe, expect, it } from 'vitest'

import {
  filenameForImage,
  filesFromDataTransfer,
  isDraggingFiles,
  materializeImageFile,
} from './transfer-files'

function fakeFile(
  name: string,
  type: string,
  body = 'image-bytes',
  lastModified = 1_700_000_000_000,
): File {
  return new File([body], name, { type, lastModified })
}

/**
 * Minimal DataTransfer stand-in. Real paste events in Firefox often expose
 * images only through `items`, with `files` empty — that shape is what the
 * helpers have to handle.
 */
function transfer(options: {
  files?: File[]
  items?: Array<{ kind: string; type: string; file: File | null }>
  types?: string[]
}): DataTransfer {
  const files = options.files ?? []
  const items = (options.items ?? []).map((item) => ({
    kind: item.kind,
    type: item.type,
    getAsFile: () => item.file,
  }))

  return {
    files: {
      length: files.length,
      item: (index: number) => files[index] ?? null,
      *[Symbol.iterator]() {
        yield* files
      },
    },
    items: {
      length: items.length,
      *[Symbol.iterator]() {
        yield* items
      },
    },
    types: options.types ?? (files.length || items.length ? ['Files'] : []),
  } as unknown as DataTransfer
}

describe('isDraggingFiles', () => {
  it('accepts a file drag while its list is still withheld', () => {
    expect(isDraggingFiles(transfer({ types: ['Files'], files: [] }))).toBe(
      true,
    )
  })

  it('accepts Firefox OS file drags advertised as application/x-moz-file', () => {
    expect(
      isDraggingFiles(
        transfer({ types: ['application/x-moz-file'], files: [] }),
      ),
    ).toBe(true)
  })

  it('ignores a text drag so CodeMirror keeps handling it', () => {
    expect(isDraggingFiles(transfer({ types: ['text/plain'], files: [] }))).toBe(
      false,
    )
    expect(isDraggingFiles(null)).toBe(false)
  })
})

describe('filenameForImage', () => {
  it('keeps a normal image name', () => {
    expect(filenameForImage(fakeFile('cover.png', 'image/png'))).toBe(
      'cover.png',
    )
  })

  it('fills in a missing extension from the MIME type', () => {
    expect(filenameForImage(fakeFile('screenshot', 'image/png'))).toBe(
      'screenshot.png',
    )
  })

  it('names an empty clipboard screenshot from its type', () => {
    // Real Firefox pastes use ""; some runtimes leave name undefined.
    expect(filenameForImage(fakeFile('', 'image/png'))).toBe('image.png')
    expect(filenameForImage(fakeFile('', 'image/jpeg'))).toBe('image.jpg')
    expect(
      filenameForImage({ type: 'image/webp' } as File),
    ).toBe('image.webp')
  })
})

describe('materializeImageFile', () => {
  it('returns a fresh File the publish path can still read later', async () => {
    const source = fakeFile('shot.png', 'image/png', 'png-payload')
    const copy = await materializeImageFile(source)

    expect(copy).not.toBe(source)
    expect(copy.name).toBe('shot.png')
    expect(copy.type).toBe('image/png')
    expect(await copy.text()).toBe('png-payload')
  })

  it('assigns a durable name to a nameless clipboard image', async () => {
    const source = fakeFile('', 'image/png', 'png-payload')
    const copy = await materializeImageFile(source)

    expect(copy.name).toBe('image.png')
    expect(await copy.text()).toBe('png-payload')
  })
})

describe('filesFromDataTransfer', () => {
  it('reads images from items when files is empty (Firefox paste shape)', () => {
    const image = fakeFile('image.png', 'image/png')
    const result = filesFromDataTransfer(
      transfer({
        files: [],
        items: [{ kind: 'file', type: 'image/png', file: image }],
        types: ['image/png'],
      }),
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('image.png')
    expect(result[0]?.type).toBe('image/png')
  })

  it('falls back to files when items are unavailable', () => {
    const image = fakeFile('drop.webp', 'image/webp')
    const result = filesFromDataTransfer(
      transfer({ files: [image], types: ['Files'] }),
    )

    expect(result.map((file) => file.name)).toEqual(['drop.webp'])
  })

  it('ignores non-image files mixed into the payload', () => {
    const result = filesFromDataTransfer(
      transfer({
        items: [
          {
            kind: 'file',
            type: 'application/pdf',
            file: fakeFile('notes.pdf', 'application/pdf'),
          },
          {
            kind: 'file',
            type: 'image/png',
            file: fakeFile('pic.png', 'image/png'),
          },
        ],
      }),
    )

    expect(result.map((file) => file.name)).toEqual(['pic.png'])
  })

  it('returns an empty list for a null transfer', () => {
    expect(filesFromDataTransfer(null)).toEqual([])
  })
})
