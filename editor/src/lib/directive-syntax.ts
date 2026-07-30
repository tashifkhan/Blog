import type { BlockContext, Line, MarkdownConfig } from '@lezer/markdown'

import { MIN_MARKERS, parseDirectiveInfo } from '../markdown/directives'

/**
 * Teaches CodeMirror's Markdown parser about `:::` container directives.
 *
 * Without this, Lezer folds a directive and everything between its fences into
 * a single paragraph through lazy continuation, so a heading or list inside a
 * column would show as raw source in Live mode — which is exactly the content a
 * two-column block exists to hold. Registering a real composite block means the
 * body is parsed as ordinary Markdown and every existing live-preview decoration
 * applies inside a column.
 *
 * What counts as a directive comes from the same module the renderer uses, so
 * the editor cannot disagree with the published page about whether something is
 * a directive.
 */

export type DirectiveFence = {
  markers: number
  /** Text after the colons; empty for a closing fence. */
  info: string
}

/** Read a directive fence at the line's current parse position. */
export function directiveFenceAt(line: Line): DirectiveFence | null {
  const rest = line.text.slice(line.pos)

  let markers = 0
  while (markers < rest.length && rest[markers] === ':') markers++
  if (markers < MIN_MARKERS) return null

  const info = rest.slice(markers).trim()
  // A closing fence is bare colons; an opening fence has to name a directive
  // we know, so a stray `::::::` in prose is left as text.
  if (info !== '' && !parseDirectiveInfo(info)) return null

  return { markers, info }
}

export const directiveSyntax: MarkdownConfig = {
  defineNodes: [
    { name: 'DirectiveBlock', block: true, composite: continueDirective },
    { name: 'DirectiveMark' },
  ],
  parseBlock: [
    {
      name: 'Directive',
      before: 'FencedCode',
      parse(cx: BlockContext, line: Line) {
        const fence = directiveFenceAt(line)
        if (!fence) return false

        const from = cx.lineStart + line.pos
        const to = cx.lineStart + line.text.length

        if (fence.info === '') {
          // The closing fence. `continueDirective` ends the block just before
          // this line, so it arrives here to be consumed as a marker rather
          // than left behind as a stray paragraph.
          cx.addElement(cx.elt('DirectiveMark', from, to))
          cx.nextLine()
          return true
        }

        cx.startComposite('DirectiveBlock', line.pos, fence.markers)
        // `addMarker` is for continuation lines and drops the element here, so
        // the opening fence is added as the block's first child instead.
        cx.addElement(cx.elt('DirectiveMark', from, to))
        // Consume the rest of the opening line so it is not also parsed as the
        // block's first paragraph.
        line.moveBase(line.text.length)
        return null
      },
      // A directive can interrupt a paragraph, the way a code fence can.
      endLeaf(_cx: BlockContext, line: Line) {
        return directiveFenceAt(line) !== null
      },
    },
  ],
}

/**
 * Decide whether an open directive continues on this line.
 *
 * `value` is the opening fence's colon count, so a shorter run belongs to a
 * nested directive and leaves the outer block open — which is what lets
 * `::::two-col` wrap `:::col`.
 */
function continueDirective(_cx: BlockContext, line: Line, value: number): boolean {
  const fence = directiveFenceAt(line)
  if (!fence) return true
  return !(fence.info === '' && fence.markers >= value)
}
