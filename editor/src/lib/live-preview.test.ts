import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
import { describe, expect, it } from 'vitest'

import { computeDecorations, livePreview, setAssets } from './live-preview'

function stateFor(doc: string, cursor?: number) {
  const state = EditorState.create({
    doc,
    extensions: [markdown(), livePreview()],
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
    const doc = '## The bridge'
    expect(classesOn(doc, 999)).toContain('cm-md-heading cm-md-h2')
    expect(hiddenText(doc, 999)).toContain('##')
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
    expect(classesOn('---', 999)).toContain('widget:RuleWidget')
  })

  it('replaces an image with a widget', () => {
    expect(classesOn('![Cover](asset:cover.png)', 999)).toContain(
      'widget:ImageWidget',
    )
  })

  it('renders an attached image and flags a detached one', () => {
    const doc = '![Cover](asset:cover.png)'
    const attached = EditorState.create({
      doc,
      extensions: [markdown(), livePreview()],
      selection: { anchor: 999 },
    }).update({
      effects: setAssets.of(new Map([['cover.png', 'blob:fake']])),
    }).state

    const decoration = computeDecorations(attached, [
      { from: 0, to: doc.length },
    ]).iter().value?.spec as { widget?: { missing?: boolean } }
    expect(decoration.widget).toMatchObject({ missing: false })

    const detached = computeDecorations(stateFor(doc, 999), [
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
