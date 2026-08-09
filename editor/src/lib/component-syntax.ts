import type { BlockContext, Line, MarkdownConfig } from '@lezer/markdown'

import { COMPONENTS } from '../markdown/components'
import { parseOpenTag } from '../markdown/jsx'

/**
 * Teaches CodeMirror's Markdown parser about `<Component>` tags.
 *
 * The sibling of `directive-syntax.ts`, for the other spelling. Without it
 * Lezer folds a tag and everything between it and its closing tag into one
 * paragraph through lazy continuation, so a heading or list inside a `<Col>`
 * would show as raw source in Live mode — exactly the content the component
 * exists to hold.
 *
 * What counts as a component comes from the shared registry, so the editor
 * cannot disagree with the published page about whether something is a tag.
 */

const CLOSE_TAG = /^<\/([A-Za-z][A-Za-z0-9]*)\s*>\s*$/

export type ComponentTag =
  | { kind: 'open' | 'self'; name: string; index: number; raw: string }
  | { kind: 'close'; name: string; index: number }

/** Index into `COMPONENTS`, which is what a composite block can carry. */
function indexOf(name: string): number {
  return COMPONENTS.findIndex(
    (spec) => spec.name.toLowerCase() === name.toLowerCase(),
  )
}

/** Read a component tag at the line's current parse position. */
export function componentTagAt(line: Line): ComponentTag | null {
  const rest = line.text.slice(line.pos)
  if (!rest.startsWith('<')) return null

  const closing = CLOSE_TAG.exec(rest)
  if (closing) {
    const index = indexOf(closing[1])
    return index === -1
      ? null
      : { kind: 'close', name: COMPONENTS[index].name, index }
  }

  const tag = parseOpenTag(rest, 0)
  if (!tag) return null
  // The tag has to be the whole line; a tag inside prose is inline content.
  //
  // That also leaves the single-line paired form — `<Note>text</Note>` — as
  // plain text in Live mode, even though the renderer expands and renders it.
  // Deliberate: collapsing it would hide the body behind a chip, and on one
  // line the source is short enough to read as written.
  if (rest.slice(tag.end).trim() !== '') return null

  const index = indexOf(tag.spec.name)
  if (index === -1) return null

  return {
    kind: tag.selfClosing || tag.spec.body === 'none' ? 'self' : 'open',
    name: tag.spec.name,
    index,
    raw: rest.slice(0, tag.end),
  }
}

export const componentSyntax: MarkdownConfig = {
  defineNodes: [
    { name: 'ComponentBlock', block: true, composite: continueComponent },
    { name: 'ComponentMark' },
  ],
  parseBlock: [
    {
      name: 'Component',
      before: 'FencedCode',
      parse(cx: BlockContext, line: Line) {
        const tag = componentTagAt(line)
        if (!tag) return false

        const from = cx.lineStart + line.pos
        const to = cx.lineStart + line.text.length

        if (tag.kind !== 'open') {
          // A closing or self-closing tag is a marker on its own. For a closing
          // one, `continueComponent` has already ended the block just before
          // this line, so it arrives here rather than being left as a stray
          // paragraph.
          cx.addElement(cx.elt('ComponentMark', from, to))
          cx.nextLine()
          return true
        }

        cx.startComposite('ComponentBlock', line.pos, tag.index)
        // `addMarker` is for continuation lines and would drop the element, so
        // the opening tag becomes the block's first child instead.
        cx.addElement(cx.elt('ComponentMark', from, to))
        line.moveBase(line.text.length)
        return null
      },
      // A component can interrupt a paragraph, the way a code fence can.
      endLeaf(_cx: BlockContext, line: Line) {
        return componentTagAt(line) !== null
      },
    },
  ],
}

/**
 * Decide whether an open component continues on this line.
 *
 * `value` is the registry index of the tag that opened the block, so only the
 * matching `</Name>` closes it and a `<Col>` inside a `<Cols>` leaves the outer
 * block open.
 *
 * A component nested directly inside another of the *same* name closes at the
 * first matching close tag, because a composite can only carry one number and
 * the depth is not known when the block starts. That is a live-preview
 * cosmetic limit only — the renderer counts depth properly, so the published
 * page is unaffected, and the shape does not occur in practice.
 */
function continueComponent(_cx: BlockContext, line: Line, value: number): boolean {
  const tag = componentTagAt(line)
  if (!tag) return true
  return !(tag.kind === 'close' && tag.index === value)
}
