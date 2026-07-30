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

const EXPLICIT_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/
const BARE_DOMAIN = /^(?:localhost(?::\d+)?|(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,})(?:[/?#:]|$)/
const SAFE_LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

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
 * Turn a friendly destination into a safe Markdown link target.
 *
 * Bare domains become HTTPS links, while article-local paths and anchors stay
 * relative. Returning `null` lets the link dialog show a useful error instead
 * of writing malformed or unsafe Markdown.
 */
export function normalizeLinkDestination(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('#')
  ) {
    return trimmed.replaceAll(' ', '%20').replaceAll(')', '%29')
  }

  const candidate = BARE_DOMAIN.test(trimmed) ? `https://${trimmed}` : trimmed
  if (!EXPLICIT_SCHEME.test(candidate)) return null

  try {
    const parsed = new URL(candidate)
    if (!SAFE_LINK_SCHEMES.has(parsed.protocol)) return null
    return candidate.replaceAll(' ', '%20').replaceAll(')', '%29')
  } catch {
    return null
  }
}

/** Replace the current selection with one complete, correctly ordered link. */
export function insertLink(label: string, destination: string): BodyEdit {
  return (body, start, end) => {
    const selected = body.slice(start, end)
    const text = (label.trim() || selected || 'link text')
      .replaceAll('\\', '\\\\')
      .replaceAll('[', '\\[')
      .replaceAll(']', '\\]')
    const markdown = `[${text}](${destination})`
    const placeholder = !label.trim() && !selected

    return {
      body: body.slice(0, start) + markdown + body.slice(end),
      selectionStart: placeholder ? start + 1 : start + markdown.length,
      selectionEnd: placeholder ? start + 1 + text.length : start + markdown.length,
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

/** Marks where the caret should land inside a template. */
export const CARET = '$0'

/**
 * Insert a multi-line snippet and put the caret where the writing starts.
 *
 * Directive skeletons are several lines of fences; leaving the caret after the
 * closing fence, which is what `insertBlock` does, would mean navigating back
 * into the block by hand every time.
 */
export function insertTemplate(template: string): BodyEdit {
  const caret = template.indexOf(CARET)
  const text = caret === -1 ? template : template.replace(CARET, '')

  return (body, start, end) => {
    const result = insertBlock(text)(body, start, end)
    if (caret === -1) return result

    // `insertBlock` reports the caret at the end of the inserted text, so the
    // lead padding it added is the difference from where the text begins.
    const textStart = result.selectionStart - text.length
    const position = textStart + caret
    return { ...result, selectionStart: position, selectionEnd: position }
  }
}

/** Skeletons behind the directive toolbar buttons. */
export const CALLOUT_TEMPLATE = [':::note', CARET, ':::'].join('\n')

export const TWO_COL_TEMPLATE = [
  '::::two-col{ratio="1:1"}',
  ':::col',
  CARET,
  ':::',
  ':::col',
  '',
  ':::',
  '::::',
].join('\n')
