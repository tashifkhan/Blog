/**
 * Inline marks shared with dump.taf.sh, so a note moved between the two keeps
 * rendering the same:
 *
 *   - `==text==` is the highlighter (Obsidian's syntax). It can wrap other
 *     marks: `==see **this**==`.
 *   - LaTeX arrow commands in prose (`\to`, `$\rightarrow$`, `\Rightarrow`, …)
 *     become arrow glyphs with an accessible label. Code spans are separate
 *     tokens, so a command that contains `\to` stays literal there.
 *
 * The highlight rule is the delimiter algorithm from markdown-it-mark, trimmed
 * to this renderer: `==` pairs are balanced by markdown-it's own `balance_pairs`
 * pass, which is what lets them nest with emphasis.
 */

const EQUALS = 0x3d

function highlightTokenize(state: any, silent: boolean): boolean {
  const start = state.pos
  if (silent || state.src.charCodeAt(start) !== EQUALS) return false

  const scanned = state.scanDelims(state.pos, true)
  let length = scanned.length
  if (length < 2) return false

  const marker = String.fromCharCode(EQUALS)
  if (length % 2) {
    const token = state.push('text', '', 0)
    token.content = marker
    length--
  }

  for (let index = 0; index < length; index += 2) {
    const token = state.push('text', '', 0)
    token.content = marker + marker
    if (!scanned.can_open && !scanned.can_close) continue

    state.delimiters.push({
      marker: EQUALS,
      length: 0,
      token: state.tokens.length - 1,
      end: -1,
      open: scanned.can_open,
      close: scanned.can_close,
    })
  }

  state.pos += scanned.length
  return true
}

function postProcess(state: any, delimiters: any[]): void {
  const loneMarkers: number[] = []

  for (const startDelim of delimiters) {
    if (startDelim.marker !== EQUALS || startDelim.end === -1) continue
    const endDelim = delimiters[startDelim.end]

    const open = state.tokens[startDelim.token]
    open.type = 'mark_open'
    open.tag = 'mark'
    open.nesting = 1
    open.markup = '=='
    open.content = ''

    const close = state.tokens[endDelim.token]
    close.type = 'mark_close'
    close.tag = 'mark'
    close.nesting = -1
    close.markup = '=='
    close.content = ''

    const previous = state.tokens[endDelim.token - 1]
    if (previous?.type === 'text' && previous.content === '=') {
      loneMarkers.push(endDelim.token - 1)
    }
  }

  // A run like `===` leaves a single `=` text token next to a close; move it
  // outside the mark so the highlight ends where the author meant.
  while (loneMarkers.length) {
    const index = loneMarkers.pop() as number
    let cursor = index + 1
    while (cursor < state.tokens.length && state.tokens[cursor].type === 'mark_close') {
      cursor++
    }
    cursor--
    if (index !== cursor) {
      const token = state.tokens[cursor]
      state.tokens[cursor] = state.tokens[index]
      state.tokens[index] = token
    }
  }
}

function highlightPostProcess(state: any): boolean {
  postProcess(state, state.delimiters)
  for (const meta of state.tokens_meta ?? []) {
    if (meta?.delimiters) postProcess(state, meta.delimiters)
  }
  return true
}

// ---------------------------------------------------------------------------

const ARROWS: Record<string, [glyph: string, label: string]> = {
  to: ['→', 'to'],
  rightarrow: ['→', 'right arrow'],
  longrightarrow: ['⟶', 'right arrow'],
  leftarrow: ['←', 'left arrow'],
  gets: ['←', 'left arrow'],
  longleftarrow: ['⟵', 'left arrow'],
  leftrightarrow: ['↔', 'left-right arrow'],
  Rightarrow: ['⇒', 'implies'],
  implies: ['⇒', 'implies'],
  Leftarrow: ['⇐', 'implied by'],
  Leftrightarrow: ['⇔', 'if and only if'],
  iff: ['⇔', 'if and only if'],
  mapsto: ['↦', 'maps to'],
  uparrow: ['↑', 'up arrow'],
  downarrow: ['↓', 'down arrow'],
  updownarrow: ['↕', 'up-down arrow'],
  nearrow: ['↗', 'north-east arrow'],
  nwarrow: ['↖', 'north-west arrow'],
  searrow: ['↘', 'south-east arrow'],
  swarrow: ['↙', 'south-west arrow'],
}

// Longest names first so `\longrightarrow` is not read as `\long` + junk, and a
// trailing letter guard so `\total` is not `\to` + `tal`.
const ARROW_PATTERN = new RegExp(
  `\\$?\\\\(${Object.keys(ARROWS)
    .sort((a, b) => b.length - a.length)
    .join('|')})(?![A-Za-z])\\$?`,
  'g',
)

function arrowsRule(state: any): boolean {
  for (const block of state.tokens) {
    if (block.type !== 'inline' || !block.children?.length) continue
    if (!block.content.includes('\\')) continue

    const next: any[] = []
    let changed = false

    for (const token of block.children) {
      if (token.type !== 'text' || !token.content.includes('\\')) {
        next.push(token)
        continue
      }

      const text: string = token.content
      let last = 0
      ARROW_PATTERN.lastIndex = 0
      for (let match; (match = ARROW_PATTERN.exec(text)); ) {
        changed = true
        if (match.index > last) {
          const before = new state.Token('text', '', 0)
          before.content = text.slice(last, match.index)
          next.push(before)
        }
        const [glyph, label] = ARROWS[match[1]]
        const arrow = new state.Token('html_inline', '', 0)
        arrow.content = `<span class="md-arrow" role="img" aria-label="${label}">${glyph}</span>`
        next.push(arrow)
        last = match.index + match[0].length
      }

      if (last === 0) {
        next.push(token)
      } else if (last < text.length) {
        const after = new state.Token('text', '', 0)
        after.content = text.slice(last)
        next.push(after)
      }
    }

    if (changed) block.children = next
  }
  return true
}

export function marksPlugin(md: any): void {
  md.inline.ruler.before('emphasis', 'highlight', highlightTokenize)
  md.inline.ruler2.before('emphasis', 'highlight', highlightPostProcess)
  // After `text_join`, so escape sequences are already plain text again.
  md.core.ruler.after('text_join', 'latex_arrows', arrowsRule)
}
