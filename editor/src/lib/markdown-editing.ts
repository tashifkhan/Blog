/**
 * Pure text transforms behind the formatting toolbar and its shortcuts.
 *
 * Each returns the next body plus where the selection should land, so the
 * caller can restore it after React re-renders the textarea.
 */

export type EditResult = {
  body: string
  selectionStart: number
  selectionEnd: number
}

export type BodyEdit = (body: string, start: number, end: number) => EditResult

/** Wrap the selection, or drop an empty pair at the caret. */
export function wrapSelection(before: string, after: string): BodyEdit {
  return (body, start, end) => {
    const selected = body.slice(start, end)

    // Toggle off when the markers are already there.
    if (
      selected.length >= before.length + after.length &&
      selected.startsWith(before) &&
      selected.endsWith(after)
    ) {
      const stripped = selected.slice(
        before.length,
        selected.length - after.length,
      )
      return {
        body: body.slice(0, start) + stripped + body.slice(end),
        selectionStart: start,
        selectionEnd: start + stripped.length,
      }
    }

    return {
      body: body.slice(0, start) + before + selected + after + body.slice(end),
      selectionStart: start + before.length,
      selectionEnd: start + before.length + selected.length,
    }
  }
}

/**
 * Add or remove a line prefix across every line the selection touches, so
 * `## ` lands at the start of the line rather than mid-word at the caret.
 */
export function prefixLines(prefix: string): BodyEdit {
  return (body, start, end) => {
    const lineStart = body.lastIndexOf('\n', start - 1) + 1
    const nextBreak = body.indexOf('\n', end)
    const lineEnd = nextBreak === -1 ? body.length : nextBreak

    const lines = body.slice(lineStart, lineEnd).split('\n')
    const allPrefixed = lines.every((line) => line.startsWith(prefix))
    const next = lines
      .map((line) =>
        allPrefixed ? line.slice(prefix.length) : `${prefix}${line}`,
      )
      .join('\n')

    return {
      body: body.slice(0, lineStart) + next + body.slice(lineEnd),
      selectionStart: lineStart,
      selectionEnd: lineStart + next.length,
    }
  }
}

/** Drop a block at the caret, padded so it stands alone as its own paragraph. */
export function insertBlock(text: string): BodyEdit {
  return (body, start, end) => {
    const before = body.slice(0, start)
    const after = body.slice(end)

    let lead = ''
    if (before && !before.endsWith('\n\n')) {
      lead = before.endsWith('\n') ? '\n' : '\n\n'
    }
    const trail = after.startsWith('\n') ? '\n' : '\n\n'
    const inserted = `${lead}${text}${trail}`

    return {
      body: before + inserted + after,
      selectionStart: start + lead.length + text.length,
      selectionEnd: start + lead.length + text.length,
    }
  }
}
