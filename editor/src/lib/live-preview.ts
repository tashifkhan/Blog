import { syntaxTree } from '@codemirror/language'
import {
  type EditorState,
  type Extension,
  type Range,
  StateEffect,
  StateField,
} from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type ViewUpdate,
  ViewPlugin,
  WidgetType,
} from '@codemirror/view'

import type { ComponentSpec } from '../markdown/components'
import { parseDirectiveInfo } from '../markdown/directives'
import { parseImageAlt } from '../markdown/images'
import { parseOpenTag } from '../markdown/jsx'
import { publicImageUrl } from './publishing-rules'

/**
 * Obsidian-style live preview.
 *
 * Markdown renders inline in the editing surface, and the raw syntax for a
 * construct is revealed only while the selection is inside it — inline nodes
 * reveal on the node, block nodes reveal on the whole line, which is what
 * Obsidian does and what makes the caret feel like it is editing the source
 * rather than the render.
 */

/** filename -> object URL for images currently attached to the draft. */
export type AssetMap = ReadonlyMap<string, string>

export const setAssets = StateEffect.define<AssetMap>()
export const setSlug = StateEffect.define<string>()

const assetField = StateField.define<AssetMap>({
  create: () => new Map(),
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setAssets)) return effect.value
    }
    return value
  },
})

const slugField = StateField.define<string>({
  create: () => '',
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setSlug)) return effect.value
    }
    return value
  },
})

/** Marks that are hidden when the construct is not being edited. */
const HIDDEN_MARKS = new Set([
  'CodeMark',
  'EmphasisMark',
  'HeaderMark',
  'LinkMark',
  'QuoteMark',
  'StrikethroughMark',
])

const HEADING_NODES: Record<string, number> = {
  ATXHeading1: 1,
  ATXHeading2: 2,
  ATXHeading3: 3,
  ATXHeading4: 4,
  ATXHeading5: 5,
  ATXHeading6: 6,
  SetextHeading1: 1,
  SetextHeading2: 2,
}

/** Block constructs reveal their syntax for the whole line, not just the node. */
const BLOCK_NODES = new Set([
  ...Object.keys(HEADING_NODES),
  'Blockquote',
  'DirectiveMark',
  'FencedCode',
  'HorizontalRule',
  'ListItem',
  'DirectiveBlock',
  'ComponentBlock',
])

/** Callout directives get their accent from the directive name. */
const CALLOUT_DIRECTIVES = new Set([
  'note',
  'tip',
  'important',
  'warning',
  'caution',
  'danger',
])

class ImageWidget extends WidgetType {
  constructor(
    private readonly src: string,
    private readonly alt: string,
    private readonly missing: boolean,
    private readonly width?: number,
    private readonly height?: number,
  ) {
    super()
  }

  eq(other: ImageWidget): boolean {
    return (
      other.src === this.src &&
      other.alt === this.alt &&
      other.missing === this.missing &&
      other.width === this.width &&
      other.height === this.height
    )
  }

  toDOM(): HTMLElement {
    const figure = document.createElement('span')
    figure.className = 'cm-inline-image'

    if (this.missing) {
      figure.classList.add('cm-inline-image-missing')
      figure.textContent = `Missing image “${this.alt || this.src}”`
      return figure
    }

    const image = document.createElement('img')
    image.src = this.src
    image.alt = this.alt
    // Mirror the published size so `|400` is judged at the width it will ship
    // at rather than at whatever the pane happens to be.
    if (this.width) {
      image.width = this.width
      figure.style.maxWidth = `${this.width}px`
    }
    if (this.height) image.height = this.height
    figure.appendChild(image)

    if (this.alt) {
      const caption = document.createElement('span')
      caption.className = 'cm-inline-image-caption'
      caption.textContent = this.alt
      figure.appendChild(caption)
    }
    return figure
  }

  /** Let a click place the caret next to the widget so it can be edited. */
  ignoreEvent(): boolean {
    return false
  }
}

class RuleWidget extends WidgetType {
  eq(): boolean {
    return true
  }

  toDOM(): HTMLElement {
    const rule = document.createElement('span')
    rule.className = 'cm-inline-rule'
    return rule
  }
}

/**
 * Stands in for a `:::` fence line.
 *
 * The fences carry the structure of the block, so hiding them outright would
 * leave the columns of a grid indistinguishable from each other. A chip keeps
 * the boundary visible without showing the colons.
 */
class DirectiveWidget extends WidgetType {
  constructor(
    private readonly label: string,
    private readonly kind: string,
  ) {
    super()
  }

  eq(other: DirectiveWidget): boolean {
    return other.label === this.label && other.kind === this.kind
  }

  toDOM(): HTMLElement {
    const chip = document.createElement('span')
    chip.className = `cm-directive-chip cm-directive-chip-${this.kind}`
    chip.textContent = this.label
    return chip
  }

  ignoreEvent(): boolean {
    return false
  }
}

/**
 * The chip label and styling kind for a component occurrence.
 *
 * Driven by the registry rather than a hand-written switch, so a component
 * added to `components.ts` gets a live-preview chip without this file changing.
 * The label prefers whatever the author actually wrote — a callout's title, a
 * step's name, a meter's label — because that is what identifies the block when
 * the tag itself is hidden.
 */
function describeComponent(
  spec: ComponentSpec,
  attrs: Record<string, string>,
): { label: string; kind: string } {
  if (spec.name === 'Cols') {
    return { label: `columns ${attrs.ratio ?? '1:1'}`, kind: 'grid' }
  }
  if (spec.name === 'Col') return { label: 'column', kind: 'col' }

  // The attribute that most identifies this particular block, since the tag
  // itself is hidden behind the chip.
  const named =
    attrs.title ?? attrs.label ?? attrs.summary ?? attrs.caption ?? attrs.value

  // A callout's chip is already colour-coded by kind, so repeating the name
  // beside the title is noise. Everything else needs the name to be legible.
  if (CALLOUT_DIRECTIVES.has(spec.directive)) {
    return { label: named || spec.directive, kind: spec.directive }
  }

  return {
    label: named ? `${spec.directive} · ${named}` : spec.directive,
    kind: spec.directive,
  }
}

/** Turn a fence's raw text into the chip label and its styling kind. */
export function describeDirectiveFence(raw: string): {
  label: string
  kind: string
} {
  const info = raw.trim().replace(/^:+/, '').trim()
  if (!info) return { label: 'end', kind: 'end' }

  const directive = parseDirectiveInfo(info)
  if (!directive) return { label: info, kind: 'end' }

  return describeComponent(directive.spec, directive.attrs)
}

/** The same, for a `<Component>` tag line. */
export function describeComponentTag(raw: string): {
  label: string
  kind: string
} {
  const text = raw.trim()

  const closing = /^<\/([A-Za-z][A-Za-z0-9]*)\s*>$/.exec(text)
  if (closing) return { label: 'end', kind: 'end' }

  const tag = parseOpenTag(text, 0)
  if (!tag) return { label: text, kind: 'end' }

  const { label, kind } = describeComponent(tag.spec, tag.attrs)
  // A self-closing tag has no body, so there is no "end" chip to pair with it;
  // the marker says so rather than looking like an unclosed block.
  return tag.selfClosing || tag.spec.body === 'none'
    ? { label: `${label} ⁄`, kind }
    : { label, kind }
}

class BulletWidget extends WidgetType {
  constructor(private readonly marker: string) {
    super()
  }

  eq(other: BulletWidget): boolean {
    return other.marker === this.marker
  }

  toDOM(): HTMLElement {
    const bullet = document.createElement('span')
    bullet.className = 'cm-inline-bullet'
    bullet.textContent = this.marker
    return bullet
  }
}

const hidden = Decoration.replace({})

/**
 * Decorations for the given ranges. Takes an `EditorState` rather than a view
 * so the rendering rules can be exercised without a DOM.
 */
export function computeDecorations(
  state: EditorState,
  ranges: readonly { from: number; to: number }[],
): DecorationSet {
  const assets = state.field(assetField)
  const slug = state.field(slugField)
  const decorations: Range<Decoration>[] = []

  /** Is any selection range touching [from, to]? */
  const touched = (from: number, to: number) =>
    state.selection.ranges.some((range) => range.from <= to && range.to >= from)

  /** Block nodes reveal across the whole line the construct sits on. */
  const editing = (node: { from: number; to: number; name: string }) => {
    if (!BLOCK_NODES.has(node.name)) return touched(node.from, node.to)
    const first = state.doc.lineAt(node.from)
    const last = state.doc.lineAt(node.to)
    return touched(first.from, last.to)
  }

  for (const { from, to } of ranges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        const heading = HEADING_NODES[node.name]
        if (heading) {
          decorations.push(
            Decoration.mark({ class: `cm-md-heading cm-md-h${heading}` }).range(
              node.from,
              node.to,
            ),
          )
          return
        }

        switch (node.name) {
          case 'StrongEmphasis':
            decorations.push(
              Decoration.mark({ class: 'cm-md-strong' }).range(
                node.from,
                node.to,
              ),
            )
            return
          case 'Emphasis':
            decorations.push(
              Decoration.mark({ class: 'cm-md-emphasis' }).range(
                node.from,
                node.to,
              ),
            )
            return
          case 'Strikethrough':
            decorations.push(
              Decoration.mark({ class: 'cm-md-strike' }).range(
                node.from,
                node.to,
              ),
            )
            return
          case 'InlineCode':
            decorations.push(
              Decoration.mark({ class: 'cm-md-code' }).range(node.from, node.to),
            )
            return
          case 'Blockquote':
            decorations.push(
              Decoration.mark({ class: 'cm-md-quote' }).range(
                node.from,
                node.to,
              ),
            )
            return
          case 'FencedCode':
          case 'CodeBlock':
            decorations.push(
              Decoration.mark({ class: 'cm-md-codeblock' }).range(
                node.from,
                node.to,
              ),
            )
            return

          case 'DirectiveBlock':
          case 'ComponentBlock': {
            decorations.push(
              Decoration.mark({ class: 'cm-md-directive' }).range(
                node.from,
                node.to,
              ),
            )
            return
          }

          case 'DirectiveMark':
          case 'ComponentMark': {
            if (editing(node)) return
            const raw = state.doc.sliceString(node.from, node.to)
            const { label, kind } =
              node.name === 'ComponentMark'
                ? describeComponentTag(raw)
                : describeDirectiveFence(raw)
            decorations.push(
              Decoration.replace({
                widget: new DirectiveWidget(label, kind),
              }).range(node.from, node.to),
            )
            return
          }

          case 'HorizontalRule': {
            if (editing(node)) return
            decorations.push(
              Decoration.replace({ widget: new RuleWidget() }).range(
                node.from,
                node.to,
              ),
            )
            return
          }

          case 'ListMark': {
            const parent = node.node.parent
            // TreeNode exposes `from` and `to` through prototype getters, so
            // spreading it drops both values. Passing that partial object to
            // `editing` used to crash the whole live-preview plugin as soon as
            // a document contained a list, which also prevented images later
            // in the document from rendering.
            if (
              parent &&
              editing({
                from: parent.from,
                to: parent.to,
                name: 'ListItem',
              })
            ) {
              return
            }
            const marker = state.doc.sliceString(node.from, node.to)
            // Ordered markers stay legible as-is; bullets get a real glyph.
            if (!/^[-*+]$/.test(marker)) return
            decorations.push(
              Decoration.replace({ widget: new BulletWidget('•') }).range(
                node.from,
                node.to,
              ),
            )
            return
          }

          case 'Image': {
            if (editing(node)) return
            const raw = state.doc.sliceString(node.from, node.to)
            const match = /^!\[([^\]]*)\]\(([^)]*)\)$/.exec(raw)
            if (!match) return
            const [, rawAlt, target] = match
            // Same parser the renderer uses, so `![Shot|400](…)` previews at
            // the size it publishes at.
            const { alt, width, height } = parseImageAlt(rawAlt)

            let src = target
            let missing = false
            if (target.startsWith('asset:')) {
              const filename = target.slice('asset:'.length)
              const objectUrl = assets.get(filename)
              if (objectUrl) {
                src = objectUrl
              } else {
                missing = true
                src = slug ? publicImageUrl(slug, filename) : filename
              }
            }

            decorations.push(
              Decoration.replace({
                widget: new ImageWidget(src, alt, missing, width, height),
              }).range(node.from, node.to),
            )
            return
          }

          case 'URL':
          case 'LinkTitle': {
            const parent = node.node.parent
            // The image case already replaced the whole node.
            if (!parent || parent.name === 'Image') return
            if (editing(parent)) return
            decorations.push(hidden.range(node.from, node.to))
            return
          }

          case 'Link': {
            decorations.push(
              Decoration.mark({ class: 'cm-md-link' }).range(
                node.from,
                node.to,
              ),
            )
            return
          }

          default: {
            if (!HIDDEN_MARKS.has(node.name)) return
            const parent = node.node.parent
            if (!parent || parent.name === 'Image') return
            if (editing(parent)) return

            // A fenced code block keeps its fences visible; hiding them would
            // make the block's language and extent guesswork.
            if (parent.name === 'FencedCode') return

            decorations.push(hidden.range(node.from, node.to))
          }
        }
      },
    })
  }

  return Decoration.set(decorations, true)
}

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = computeDecorations(view.state, view.visibleRanges)
    }

    update(update: ViewUpdate) {
      const assetsChanged =
        update.state.field(assetField) !== update.startState.field(assetField)
      const slugChanged =
        update.state.field(slugField) !== update.startState.field(slugField)
      // The Markdown parse runs incrementally, so the tree is often still
      // empty on the transaction that set the document. Without this the
      // first render would show raw Markdown until the next keystroke.
      const treeChanged =
        syntaxTree(update.state) !== syntaxTree(update.startState)

      if (
        update.docChanged ||
        update.viewportChanged ||
        update.selectionSet ||
        assetsChanged ||
        slugChanged ||
        treeChanged
      ) {
        this.decorations = computeDecorations(update.view.state, update.view.visibleRanges)
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
    // Replaced ranges must stay atomic so arrow keys step over a rendered
    // image rather than landing inside hidden text.
    provide: (plugin) =>
      EditorView.atomicRanges.of(
        (view) => view.plugin(plugin)?.decorations ?? Decoration.none,
      ),
  },
)

export function livePreview(): Extension {
  return [assetField, slugField, livePreviewPlugin]
}
