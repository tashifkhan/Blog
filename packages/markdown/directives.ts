/**
 * Container directives (`:::name`) for markdown-it.
 *
 * This and its `<Tag>` sibling in `jsx.ts` are the extension point that
 * replaces MDX for this content pipeline. Posts travel between the API, two
 * sites, and the editor as plain Markdown strings, so a construct that needs a
 * component scope to resolve against — which is what an MDX `<TwoCol>` needs —
 * can never be evaluated on the consuming side. A container directive is
 * ordinary block Markdown: the body is handed back to the normal block
 * tokenizer, so every existing renderer rule (headings, fences, mermaid,
 * callouts, task lists) applies inside a column with no extra work.
 *
 *     ::::cols{ratio="2:1"}
 *     :::col
 *     left
 *     :::
 *     :::col
 *     right
 *     :::
 *     ::::
 *
 * Which components exist, and what attributes they take, is not decided here —
 * `components.ts` owns that. This module only knows how to find the fences.
 *
 * Written here rather than pulled from `markdown-it-container` for two reasons:
 * the nesting rules below have to be exact (a column directive sits inside a
 * grid directive), and the module is vendored into three build roots, so every
 * avoided dependency is one less thing to keep in step.
 */

import { type ComponentSpec, findByDirective } from './components'

export {
  CALLOUT_NAMES,
  COLUMN_RATIOS,
  COMPONENT_NAMES,
  DIRECTIVE_NAMES,
  type CalloutName,
  type ColumnRatio,
  isCalloutName,
} from './components'

const MARKER = ':'
export const MIN_MARKERS = 3

const INFO_PATTERN = /^([a-z][a-z0-9-]*)\s*([\s\S]*)$/i
const ATTR_PATTERN =
  /([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s}'"]+))/gi

export type DirectiveInfo = {
  /** Canonical component name, e.g. `Cols`. */
  name: string
  /** The spelling the author used, for error messages. */
  raw: string
  spec: ComponentSpec
  /** Raw `{key="value"}` attributes, before coercion. */
  attrs: Record<string, string>
}

/**
 * Parse the text after the opening colons.
 *
 * Returns `null` for anything that is not a known component, which leaves the
 * line to be parsed as ordinary Markdown rather than silently swallowed.
 */
export function parseDirectiveInfo(info: string): DirectiveInfo | null {
  const match = INFO_PATTERN.exec(info.trim())
  if (!match) return null

  const raw = match[1].toLowerCase()
  const spec = findByDirective(raw)
  if (!spec) return null

  const rest = match[2].trim()
  if (!rest) return { name: spec.name, raw, spec, attrs: {} }

  if (rest.startsWith('{')) {
    if (!rest.endsWith('}')) return null
    const attrs: Record<string, string> = {}
    for (const attr of rest.slice(1, -1).matchAll(ATTR_PATTERN)) {
      attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? ''
    }
    return { name: spec.name, raw, spec, attrs }
  }

  if (!spec.positional) return null
  return { name: spec.name, raw, spec, attrs: { [spec.positional]: rest } }
}

/** Number of leading colons on a line, ignoring indentation. */
export function leadingMarkers(line: string): number {
  const trimmed = line.trimStart()
  let count = 0
  while (count < trimmed.length && trimmed[count] === MARKER) count++
  return count
}

/** A code fence opener/closer, so directive scanning can skip a fenced body. */
export function codeFenceMarker(line: string): string | null {
  const match = /^(`{3,}|~{3,})/.exec(line.trim())
  return match ? match[1][0] : null
}

/**
 * Locate the fence that closes the directive opened on `openLine`.
 *
 * Returns `-1` when the directive is never closed, which the caller treats as
 * running to the end of the block — the same forgiving behaviour markdown-it
 * gives an unterminated code fence.
 */
function findClosingFence(
  lines: readonly string[],
  openLine: number,
  markerCount: number,
  endLine: number,
): number {
  let depth = 1
  let codeMarker: string | null = null

  for (let index = openLine + 1; index < endLine; index++) {
    const line = lines[index]

    // A fenced code block may legitimately contain `:::`, so its body is
    // skipped rather than scanned for fences.
    const fence = codeFenceMarker(line)
    if (fence) {
      if (codeMarker === null) codeMarker = fence
      else if (codeMarker === fence) codeMarker = null
      continue
    }
    if (codeMarker !== null) continue

    const run = leadingMarkers(line)
    // A shorter run belongs to a nested directive and cannot close this one,
    // which is what lets `::::cols` wrap `:::col` unambiguously.
    if (run < MIN_MARKERS || run < markerCount) continue

    const rest = line.trimStart().slice(run).trim()
    if (rest === '') {
      depth--
      if (depth === 0) return index
      continue
    }
    // An equal-length opener nests, so `:::cols` can also wrap `:::col`.
    if (parseDirectiveInfo(rest)) depth++
  }

  return -1
}

/**
 * markdown-it block rule. Emits `directive_open` / `directive_close` tokens
 * carrying the parsed info on `meta`, and tokenizes the body as normal
 * Markdown in between.
 */
function directiveRule(
  state: any,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  // Four spaces of indent means an indented code block, not a directive.
  if (state.sCount[startLine] - state.blkIndent >= 4) return false

  const start = state.bMarks[startLine] + state.tShift[startLine]
  const max = state.eMarks[startLine]
  if (state.src[start] !== MARKER) return false

  let pos = start
  while (pos < max && state.src[pos] === MARKER) pos++
  const markerCount = pos - start
  if (markerCount < MIN_MARKERS) return false

  const info = state.src.slice(pos, max)
  const directive = parseDirectiveInfo(info)
  if (!directive) return false

  // `silent` means the caller is only probing whether the line terminates a
  // paragraph, so no tokens may be produced.
  if (silent) return true

  const lines: string[] = []
  for (let index = startLine; index < endLine; index++) {
    lines.push(
      state.src.slice(
        state.bMarks[index] + state.tShift[index],
        state.eMarks[index],
      ),
    )
  }
  // `findClosingFence` indexes the slice, so shift back into document lines.
  const relativeClose = findClosingFence(
    lines,
    0,
    markerCount,
    endLine - startLine,
  )
  const closeLine = relativeClose === -1 ? -1 : startLine + relativeClose
  const bodyEnd = closeLine === -1 ? endLine : closeLine

  const oldParentType = state.parentType
  const oldLineMax = state.lineMax
  state.parentType = 'directive'
  state.lineMax = bodyEnd

  const markup = MARKER.repeat(markerCount)

  const open = state.push('directive_open', 'div', 1)
  open.markup = markup
  open.block = true
  open.info = info.trim()
  open.meta = directive
  open.map = [startLine, bodyEnd]

  state.line = startLine + 1
  state.md.block.tokenize(state, state.line, bodyEnd)

  const close = state.push('directive_close', 'div', -1)
  close.markup = markup
  close.block = true
  // The same object as the opener's, which is what lets the close rule read
  // back the closing HTML the open rule computed.
  close.meta = directive

  state.parentType = oldParentType
  state.lineMax = oldLineMax
  state.line = closeLine === -1 ? endLine : closeLine + 1
  return true
}

export function directivesPlugin(md: any): void {
  md.block.ruler.before('fence', 'directive', directiveRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
}
