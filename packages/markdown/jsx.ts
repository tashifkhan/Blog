/**
 * JSX-style component tags: `<Steps>`, `<Meter level="high" score={8} />`.
 *
 * This is sugar over `directives.ts`. Both spellings resolve against the same
 * registry and emit the same `directive_open` / `directive_close` tokens, so
 * `render.ts` has exactly one code path and a post can mix the two freely.
 *
 * The point is authoring ergonomics. `::::cols` wrapping `:::col` asks an author
 * to count colons to express nesting; `<Cols>` wrapping `<Col>` does not. What
 * this deliberately is *not* is MDX: there is no import, no expression
 * evaluation, and no component scope. A tag resolves against a closed registry
 * or it is not a tag, which is what keeps a post a portable string that the API
 * can ship and the editor can lint.
 *
 * Three rules, in the order markdown-it runs them:
 *
 *   1. `jsx_normalize` (core, before `block`) rewrites a single-line paired
 *      block tag onto three lines, so the block rule only ever has to handle a
 *      tag that sits alone on its line.
 *   2. `jsx_component` (block, before `html_block`) claims a tag on its own
 *      line and tokenizes the body between it and its closing tag.
 *   3. `jsx_inline` (inline, before `html_inline`) claims tags inside a
 *      paragraph, for components that are allowed to appear there.
 *
 * Rules 2 and 3 must run before their `html_*` counterparts: the parser is
 * built with `html: true`, so without that ordering markdown-it would pass
 * `<Steps>` straight through as raw HTML.
 */

import { type ComponentSpec, findByTag } from './components'
import { codeFenceMarker, type DirectiveInfo, rawBody } from './directives'

/** `<Name`, the cheap test before doing real work. */
const TAG_START = /^<([A-Za-z][A-Za-z0-9]*)/

/** A closing tag alone on its line. */
const CLOSE_LINE = /^<\/([A-Za-z][A-Za-z0-9]*)\s*>$/

const ATTR_PATTERN =
  /([A-Za-z][A-Za-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}|([^\s/>'"]+)))?/g

export type ParsedTag = {
  spec: ComponentSpec
  attrs: Record<string, string>
  selfClosing: boolean
  /** Index just past the tag's `>`. */
  end: number
}

/**
 * Strip the braces from a JSX expression attribute.
 *
 * `score={8}` and `title={"Hi"}` are accepted for familiarity, but the contents
 * are read as a literal, never evaluated — `{count + 1}` is the string
 * `count + 1`, and the validator rejects it where a number is required.
 */
function unwrapExpression(value: string): string {
  const trimmed = value.trim()
  const quoted = /^(["'])([\s\S]*)\1$/.exec(trimmed)
  return quoted ? quoted[2] : trimmed
}

/**
 * Parse an opening tag starting at `pos`.
 *
 * Returns `null` when the name is not a registered component or the tag never
 * closes, which leaves the text to be handled as ordinary Markdown or raw HTML
 * rather than swallowed.
 */
export function parseOpenTag(src: string, pos: number): ParsedTag | null {
  const head = TAG_START.exec(src.slice(pos))
  if (!head) return null

  const spec = findByTag(head[1])
  if (!spec) return null

  // Find the `>` that ends the tag, ignoring any inside a quoted value.
  let index = pos + head[0].length
  let quote: string | null = null
  while (index < src.length) {
    const char = src[index]
    if (quote) {
      if (char === quote) quote = null
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '>') {
      break
    } else if (char === '\n') {
      // An opening tag has to sit on one line; a stray `<` in prose otherwise
      // swallows the rest of the document looking for a `>`.
      return null
    }
    index++
  }
  if (index >= src.length) return null

  const rawAttrs = src.slice(pos + head[0].length, index)
  const selfClosing = rawAttrs.trimEnd().endsWith('/')
  const attrSource = selfClosing
    ? rawAttrs.trimEnd().slice(0, -1)
    : rawAttrs

  const attrs: Record<string, string> = {}
  for (const match of attrSource.matchAll(ATTR_PATTERN)) {
    const name = match[1].toLowerCase()
    const value =
      match[2] ??
      match[3] ??
      (match[4] !== undefined ? unwrapExpression(match[4]) : undefined) ??
      match[5]
    // A bare attribute (`<Panel tilt>`) records the empty string, which
    // `resolveAttrs` reads as a boolean true.
    attrs[name] = value ?? ''
  }

  return { spec, attrs, selfClosing, end: index + 1 }
}

function infoFor(tag: ParsedTag): DirectiveInfo {
  return {
    name: tag.spec.name,
    raw: tag.spec.name,
    spec: tag.spec,
    attrs: tag.attrs,
  }
}

/** Is this whole line a single opening tag, and if so what does it open? */
function openTagLine(line: string): ParsedTag | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('<') || trimmed.startsWith('</')) return null
  const tag = parseOpenTag(trimmed, 0)
  if (!tag) return null
  // Anything after the tag means this is prose containing a tag, not a block.
  return tag.end === trimmed.length ? tag : null
}

// ---------------------------------------------------------------------------
// 1. Normalize single-line paired block tags
// ---------------------------------------------------------------------------

/**
 * Rewrite `<Note>text</Note>` into three lines.
 *
 * Without this the block rule would not claim the line (the tag is not alone on
 * it) and the inline rule would not either (a callout may not sit inside a
 * paragraph), so a perfectly reasonable thing to write would render as literal
 * HTML. Expanding it here means the block rule only ever handles one shape.
 */
function normalizeSingleLineTags(source: string): string {
  if (!source.includes('</')) return source

  const lines = source.split('\n')
  const out: string[] = []
  let codeMarker: string | null = null

  for (const line of lines) {
    const fence = codeFenceMarker(line)
    if (fence) {
      if (codeMarker === null) codeMarker = fence
      else if (codeMarker === fence) codeMarker = null
      out.push(line)
      continue
    }
    if (codeMarker !== null) {
      out.push(line)
      continue
    }

    const trimmed = line.trim()
    if (!trimmed.startsWith('<') || trimmed.startsWith('</')) {
      out.push(line)
      continue
    }

    const tag = parseOpenTag(trimmed, 0)
    if (!tag || tag.selfClosing || tag.spec.placement === 'inline') {
      out.push(line)
      continue
    }

    const closing = `</${tag.spec.name}>`
    const rest = trimmed.slice(tag.end)
    if (!rest.toLowerCase().endsWith(closing.toLowerCase())) {
      out.push(line)
      continue
    }

    const body = rest.slice(0, -closing.length)
    // An empty body would produce a blank line and split the block in two.
    if (!body.trim()) {
      out.push(line)
      continue
    }

    out.push(trimmed.slice(0, tag.end), body.trim(), closing)
  }

  return out.join('\n')
}

// ---------------------------------------------------------------------------
// 2. Block rule
// ---------------------------------------------------------------------------

/**
 * Line index of the `</Name>` that closes the tag opened on `openLine`.
 *
 * Returns `-1` when it is never closed, matching how an unterminated code fence
 * and an unterminated `:::` directive both behave: run to the end of the block
 * rather than reject the document.
 */
function findClosingTag(
  lines: readonly string[],
  openLine: number,
  name: string,
  endLine: number,
): number {
  const lowered = name.toLowerCase()
  let depth = 1
  let codeMarker: string | null = null

  for (let index = openLine + 1; index < endLine; index++) {
    const line = lines[index]

    const fence = codeFenceMarker(line)
    if (fence) {
      if (codeMarker === null) codeMarker = fence
      else if (codeMarker === fence) codeMarker = null
      continue
    }
    if (codeMarker !== null) continue

    const trimmed = line.trim()
    const close = CLOSE_LINE.exec(trimmed)
    if (close) {
      if (close[1].toLowerCase() !== lowered) continue
      depth--
      if (depth === 0) return index
      continue
    }

    // Only a same-named opener nests. A `<Col>` inside a `<Cols>` must not make
    // the `</Cols>` look like it belongs to something else.
    const open = openTagLine(trimmed)
    if (open && !open.selfClosing && open.spec.name.toLowerCase() === lowered) {
      depth++
    }
  }

  return -1
}

function jsxBlockRule(
  state: any,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false

  const start = state.bMarks[startLine] + state.tShift[startLine]
  if (state.src[start] !== '<') return false

  const lineText = state.src.slice(start, state.eMarks[startLine])
  const tag = openTagLine(lineText)
  if (!tag) return false
  if (tag.spec.placement === 'inline') return false

  if (silent) return true

  const info = infoFor(tag)

  // A self-closing tag has no body: open and close land back to back.
  if (tag.selfClosing || tag.spec.body === 'none') {
    const open = state.push('directive_open', 'div', 1)
    open.block = true
    open.meta = info
    open.map = [startLine, startLine + 1]

    const close = state.push('directive_close', 'div', -1)
    close.block = true
    close.meta = info

    state.line = startLine + 1
    return true
  }

  const lines: string[] = []
  for (let index = startLine; index < endLine; index++) {
    lines.push(
      state.src.slice(
        state.bMarks[index] + state.tShift[index],
        state.eMarks[index],
      ),
    )
  }

  const relativeClose = findClosingTag(
    lines,
    0,
    tag.spec.name,
    endLine - startLine,
  )
  const closeLine = relativeClose === -1 ? -1 : startLine + relativeClose
  const bodyEnd = closeLine === -1 ? endLine : closeLine

  const oldParentType = state.parentType
  const oldLineMax = state.lineMax
  state.parentType = 'directive'
  state.lineMax = bodyEnd

  const open = state.push('directive_open', 'div', 1)
  open.block = true
  open.meta = info
  open.map = [startLine, bodyEnd]

  state.line = startLine + 1
  if (tag.spec.body === 'raw') {
    // See the matching branch in `directives.ts`: a raw body is captured
    // verbatim rather than re-tokenized.
    const raw = state.push('component_raw', '', 0)
    raw.content = rawBody(state, startLine, bodyEnd)
    raw.block = true
    state.line = bodyEnd
  } else {
    state.md.block.tokenize(state, state.line, bodyEnd)
  }

  const close = state.push('directive_close', 'div', -1)
  close.block = true
  close.meta = info

  state.parentType = oldParentType
  state.lineMax = oldLineMax
  state.line = closeLine === -1 ? endLine : closeLine + 1
  return true
}

// ---------------------------------------------------------------------------
// 3. Inline rule
// ---------------------------------------------------------------------------

/**
 * Claim component tags inside a paragraph.
 *
 * Open and close are emitted as they are met, rather than by scanning ahead for
 * a match, so the text between them is parsed as ordinary inline Markdown —
 * `<Mark>**bold**</Mark>` keeps its emphasis. Balance is not enforced here; the
 * validator reports an unclosed inline tag at publish time, which is the same
 * bargain markdown-it makes for raw inline HTML.
 */
function jsxInlineRule(state: any, silent: boolean): boolean {
  const src: string = state.src
  const pos: number = state.pos
  if (src.charCodeAt(pos) !== 0x3c /* < */) return false

  // Closing tag.
  if (src[pos + 1] === '/') {
    const end = src.indexOf('>', pos)
    if (end === -1) return false
    const match = CLOSE_LINE.exec(src.slice(pos, end + 1))
    if (!match) return false
    const spec = findByTag(match[1])
    if (!spec || spec.placement === 'block') return false

    if (!silent) {
      const token = state.push('directive_close', 'div', -1)
      token.block = false
      token.meta = { name: spec.name, raw: spec.name, spec, attrs: {} }
    }
    state.pos = end + 1
    return true
  }

  const tag = parseOpenTag(src, pos)
  if (!tag) return false
  if (tag.spec.placement === 'block') return false

  if (!silent) {
    const info = infoFor(tag)
    const open = state.push('directive_open', 'div', 1)
    open.block = false
    open.meta = info

    if (tag.selfClosing || tag.spec.body === 'none') {
      const close = state.push('directive_close', 'div', -1)
      close.block = false
      close.meta = info
    }
  }

  state.pos = tag.end
  return true
}

// ---------------------------------------------------------------------------

export function jsxPlugin(md: any): void {
  md.core.ruler.before('block', 'jsx_normalize', (state: any) => {
    if (state.inlineMode) return true
    state.src = normalizeSingleLineTags(state.src)
    return true
  })

  md.block.ruler.before('html_block', 'jsx_component', jsxBlockRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  md.inline.ruler.before('html_inline', 'jsx_inline', jsxInlineRule)
}

/** Exported for the outline scanner, which needs the same normalization. */
export { normalizeSingleLineTags }
