import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
import { describe, expect, it } from 'vitest'

import { directiveSyntax } from './directive-syntax'
import {
  computeDecorations,
  describeDirectiveFence,
  livePreview,
  setAssets,
} from './live-preview'

function stateFor(doc: string, cursor?: number) {
  const state = EditorState.create({
    doc,
    // Matches MarkdownEditor: the directive extension has to be present or
    // `:::` blocks parse as paragraphs and their contents never decorate.
    extensions: [markdown({ extensions: [directiveSyntax] }), livePreview()],
    selection: cursor === undefined ? undefined : { anchor: cursor },
  })
  return state
}

/** Ranges the decorations cover, tagged with how they render. */
function describeDecorations(doc: string, cursor?: number) {
  const state = stateFor(doc, cursor)
  const set = computeDecorations(state, [{ from: 0, to: doc.length }])
  const out: Array<{ from: number; to: number; kind: string; text: string }> = []

  const iterator = set.iter()
  while (iterator.value) {
    const spec = iterator.value.spec as {
      class?: string
      widget?: { constructor: { name: string } }
    }
    out.push({
      from: iterator.from,
      to: iterator.to,
      kind:
        spec.class ??
        (spec.widget ? `widget:${spec.widget.constructor.name}` : 'hidden'),
      text: doc.slice(iterator.from, iterator.to),
    })
    iterator.next()
  }
  return out
}

const hiddenText = (doc: string, cursor?: number) =>
  describeDecorations(doc, cursor)
    .filter((entry) => entry.kind === 'hidden')
    .map((entry) => entry.text)

const classesOn = (doc: string, cursor?: number) =>
  describeDecorations(doc, cursor)
    .filter((entry) => entry.kind !== 'hidden')
    .map((entry) => entry.kind)

describe('live preview rendering', () => {
  it('styles a heading and hides its hash marks', () => {
    const doc = '## The bridge\n\ncaret away'
    expect(classesOn(doc, doc.length)).toContain('cm-md-heading cm-md-h2')
    expect(hiddenText(doc, doc.length)).toContain('##')
  })

  it('hides emphasis markers and styles the content', () => {
    const doc = 'an **important** word'
    expect(classesOn(doc, 0)).toContain('cm-md-strong')
    expect(hiddenText(doc, 0)).toEqual(['**', '**'])
  })

  it('hides the code fence ticks of inline code', () => {
    const doc = 'call `useRef` here'
    expect(classesOn(doc, 0)).toContain('cm-md-code')
    expect(hiddenText(doc, 0)).toEqual(['`', '`'])
  })

  it('hides link plumbing but keeps the label', () => {
    const doc = 'see [the docs](https://example.com) now'
    const hidden = hiddenText(doc, 0)
    expect(hidden).toContain('https://example.com')
    expect(hidden.filter((text) => text === '[')).toHaveLength(1)
    expect(classesOn(doc, 0)).toContain('cm-md-link')
  })

  it('replaces a horizontal rule with a widget', () => {
    const doc = '---\n\ncaret away'
    expect(classesOn(doc, doc.length)).toContain('widget:RuleWidget')
  })

  it('replaces an image with a widget', () => {
    const doc = '![Cover](asset:cover.png)\n\ncaret away'
    expect(classesOn(doc, doc.length)).toContain(
      'widget:ImageWidget',
    )
  })

  it('renders an attached image and flags a detached one', () => {
    const doc = '![Cover](asset:cover.png)\n\ncaret away'
    const attached = EditorState.create({
      doc,
      extensions: [markdown(), livePreview()],
      selection: { anchor: doc.length },
    }).update({
      effects: setAssets.of(new Map([['cover.png', 'blob:fake']])),
    }).state

    const decoration = computeDecorations(attached, [
      { from: 0, to: doc.length },
    ]).iter().value?.spec as { widget?: { missing?: boolean } }
    expect(decoration.widget).toMatchObject({ missing: false })

    const detached = computeDecorations(stateFor(doc, doc.length), [
      { from: 0, to: doc.length },
    ]).iter().value?.spec as { widget?: { missing?: boolean } }
    expect(detached.widget).toMatchObject({ missing: true })
  })
})

describe('revealing source at the caret', () => {
  it('reveals emphasis markers only while the caret is inside the node', () => {
    // Caret parked far away: markers hidden.
    expect(hiddenText('an **important** word', 0)).toEqual(['**', '**'])
    // Caret inside "important": markers shown.
    expect(hiddenText('an **important** word', 8)).toEqual([])
  })

  it('reveals a heading mark from anywhere on its line', () => {
    const doc = '## The bridge'
    expect(hiddenText(doc, doc.length)).toEqual([])
  })

  it('keeps other lines rendered while one line is being edited', () => {
    const doc = '## One\n\n## Two'
    // Caret on the first heading only.
    expect(hiddenText(doc, 3)).toEqual(['##'])
  })

  it('shows the raw image source while the caret is on it', () => {
    const doc = '![Cover](asset:cover.png)'
    expect(classesOn(doc, 4)).not.toContain('widget:ImageWidget')
  })
})

describe('directives', () => {
  const grid = [
    '::::two-col{ratio="2:1"}',
    ':::col',
    '## Left',
    ':::',
    ':::col',
    'right',
    ':::',
    '::::',
  ].join('\n')

  it('replaces each fence with a chip', () => {
    // The caret defaults to position 0, which sits on the opening fence and
    // would correctly reveal it, so park it past the block.
    const doc = `${grid}\n\ncaret away`
    const chips = describeDecorations(doc, doc.length)
      .filter((entry) => entry.kind === 'widget:DirectiveWidget')
      .map((entry) => entry.text)

    expect(chips).toEqual([
      '::::two-col{ratio="2:1"}',
      ':::col',
      ':::',
      ':::col',
      ':::',
      '::::',
    ])
  })

  it('parses Markdown inside a column rather than as raw text', () => {
    // The whole point of the Lezer extension: without it the block folds into
    // one paragraph and this heading never gets decorated.
    expect(classesOn(grid)).toContain('cm-md-heading cm-md-h2')
    expect(hiddenText(grid)).toContain('##')
  })

  it('marks the block so it can be outlined', () => {
    expect(classesOn(grid)).toContain('cm-md-directive')
  })

  it('reveals the fence source while the caret is on it', () => {
    const chips = describeDecorations(grid, 2).filter(
      (entry) => entry.kind === 'widget:DirectiveWidget',
    )
    expect(chips.map((entry) => entry.text)).not.toContain(
      '::::two-col{ratio="2:1"}',
    )
  })

  it('leaves a stray colon run as ordinary text', () => {
    const doc = 'ratio ::: something'
    expect(
      describeDecorations(doc).filter(
        (entry) => entry.kind === 'widget:DirectiveWidget',
      ),
    ).toEqual([])
  })

  it('does not treat an unknown directive name as a fence', () => {
    const doc = ':::waring\nbody\n:::'
    const chips = describeDecorations(doc)
      .filter((entry) => entry.kind === 'widget:DirectiveWidget')
      .map((entry) => entry.text)
    // The closing fence is still a fence; the misspelled opener is not.
    expect(chips).not.toContain(':::waring')
  })
})

describe('describeDirectiveFence', () => {
  it('labels a grid with its ratio', () => {
    expect(describeDirectiveFence('::::two-col{ratio="2:1"}')).toEqual({
      label: 'columns 2:1',
      kind: 'grid',
    })
  })

  it('defaults a grid without a ratio to 1:1', () => {
    expect(describeDirectiveFence(':::two-col')).toEqual({
      label: 'columns 1:1',
      kind: 'grid',
    })
  })

  it('prefers a callout title over its name', () => {
    expect(describeDirectiveFence(':::tip{title="Go faster"}')).toEqual({
      label: 'Go faster',
      kind: 'tip',
    })
    expect(describeDirectiveFence(':::tip Go faster')).toEqual({
      label: 'Go faster',
      kind: 'tip',
    })
    expect(describeDirectiveFence(':::warning')).toEqual({
      label: 'warning',
      kind: 'warning',
    })
  })

  it('labels a closing fence', () => {
    expect(describeDirectiveFence(':::')).toEqual({ label: 'end', kind: 'end' })
  })
})

describe('image sizing in live preview', () => {
  it('previews at the size the post will publish at', () => {
    const doc = '![Cover|400x260](asset:cover.png)\n\ncaret away'
    const spec = computeDecorations(stateFor(doc, doc.length), [
      { from: 0, to: doc.length },
    ]).iter().value?.spec as {
      widget?: { alt?: string; width?: number; height?: number }
    }
    expect(spec.widget).toMatchObject({
      alt: 'Cover',
      width: 400,
      height: 260,
    })
  })

  it('leaves an unsized image unsized', () => {
    const doc = '![Cover](asset:cover.png)\n\ncaret away'
    const spec = computeDecorations(stateFor(doc, doc.length), [
      { from: 0, to: doc.length },
    ]).iter().value?.spec as { widget?: { width?: number } }
    expect(spec.widget?.width).toBeUndefined()
  })
})
