/**
 * GitHub-flavoured alert blockquotes (`> [!NOTE]`).
 *
 * These are rewritten into the same `directive_open` / `directive_close` tokens
 * the `:::note` directive produces, so both spellings render through one code
 * path and share one set of styles. Keeping the blockquote form working matters
 * because posts and project READMEs are also read on GitHub, where `:::note`
 * would show as literal colons.
 */

import { CALLOUT_NAMES, findByDirective } from './components'
import { type DirectiveInfo } from './directives'

const ALERT_PATTERN = new RegExp(
  `^\\[!(${CALLOUT_NAMES.join('|')})\\]\\s*`,
  'i',
)

/** The matching `blockquote_close` for the open token at `openIndex`. */
function findBlockquoteClose(tokens: any[], openIndex: number): number {
  let depth = 0
  for (let index = openIndex; index < tokens.length; index++) {
    const type = tokens[index].type
    if (type === 'blockquote_open') depth++
    else if (type === 'blockquote_close') {
      depth--
      if (depth === 0) return index
    }
  }
  return -1
}

export function calloutsPlugin(md: any): void {
  md.core.ruler.after('block', 'gfm_alerts', (state: any) => {
    const tokens: any[] = state.tokens

    for (let index = 0; index < tokens.length; index++) {
      if (tokens[index].type !== 'blockquote_open') continue

      const paragraphOpen = tokens[index + 1]
      const inline = tokens[index + 2]
      if (
        paragraphOpen?.type !== 'paragraph_open' ||
        inline?.type !== 'inline'
      ) {
        continue
      }

      const match = ALERT_PATTERN.exec(inline.content)
      if (!match) continue

      const closeIndex = findBlockquoteClose(tokens, index)
      if (closeIndex === -1) continue

      const name = match[1].toLowerCase()
      const spec = findByDirective(name)
      if (!spec) continue

      // The same shape the `:::` rule produces, so both spellings reach the
      // renderer as one kind of token.
      const meta: DirectiveInfo = {
        name: spec.name,
        raw: name,
        spec,
        attrs: {},
      }

      // Strip the marker from both the inline token and its first child; the
      // renderer reads children, but `inline.content` is what other core rules
      // and the anchor logic see.
      inline.content = inline.content.replace(ALERT_PATTERN, '')
      if (inline.children?.[0]) {
        inline.children[0].content = inline.children[0].content.replace(
          ALERT_PATTERN,
          '',
        )
      }

      // If the marker was the whole first line, the leading paragraph is now
      // empty and would render as a blank gap above the body.
      let adjustedClose = closeIndex
      if (!inline.content.trim()) {
        tokens.splice(index + 1, 3)
        adjustedClose -= 3
      }

      const open = tokens[index]
      open.type = 'directive_open'
      open.tag = 'div'
      open.meta = meta
      open.attrs = null

      // `findBlockquoteClose` already resolved nesting, so this is the close
      // that belongs to this blockquote rather than the first one after it.
      const close = tokens[adjustedClose]
      close.type = 'directive_close'
      close.tag = 'div'
      close.meta = meta
    }

    return true
  })
}
