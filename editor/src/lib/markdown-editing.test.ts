import { describe, expect, it } from 'vitest'

import { COMPONENTS } from '../markdown/components'
import { validateDocument } from '../markdown/validate'

import { validateDirectives } from '../markdown/validate'
import {
  CALLOUT_TEMPLATE,
  CARET,
  TWO_COL_TEMPLATE,
  componentPalette,
  componentSnippet,
  insertBlock,
  insertLink,
  insertTemplate,
  normalizeLinkDestination,
  prefixLines,
  wrapSelection,
} from './markdown-editing'

describe('wrapSelection', () => {
  it('wraps the selection and keeps it selected', () => {
    const result = wrapSelection('**', '**')('make bold now', 5, 9)
    expect(result.body).toBe('make **bold** now')
    expect(result.body.slice(result.selectionStart, result.selectionEnd)).toBe(
      'bold',
    )
  })

  it('unwraps a selection that already carries the markers', () => {
    const result = wrapSelection('**', '**')('make **bold** now', 5, 13)
    expect(result.body).toBe('make bold now')
  })
})

describe('prefixLines', () => {
  it('applies the prefix at the line start, not at the caret', () => {
    const result = prefixLines('## ')('a heading', 4, 4)
    expect(result.body).toBe('## a heading')
  })

  it('covers every line the selection touches', () => {
    const result = prefixLines('- ')('one\ntwo\nthree', 1, 9)
    expect(result.body).toBe('- one\n- two\n- three')
  })

  it('toggles the prefix back off', () => {
    const result = prefixLines('> ')('> quoted', 0, 8)
    expect(result.body).toBe('quoted')
  })
})

describe('insertBlock', () => {
  it('pads the block so it stands alone', () => {
    const result = insertBlock('![alt](asset:a.png)')('Body text.', 10, 10)
    expect(result.body).toBe('Body text.\n\n![alt](asset:a.png)\n\n')
  })

  it('does not add blank lines that are already there', () => {
    const result = insertBlock('X')('Body.\n\n', 7, 7)
    expect(result.body).toBe('Body.\n\nX\n\n')
  })

  it('leaves the caret after the inserted block', () => {
    const result = insertBlock('X')('', 0, 0)
    expect(result.body.slice(0, result.selectionStart)).toBe('X')
  })
})

describe('links', () => {
  it('normalizes bare domains without changing relative links', () => {
    expect(normalizeLinkDestination('search.taf.sh')).toBe(
      'https://search.taf.sh',
    )
    expect(normalizeLinkDestination('/about')).toBe('/about')
    expect(normalizeLinkDestination('#details')).toBe('#details')
  })

  it('rejects malformed and executable destinations', () => {
    expect(normalizeLinkDestination('not a destination')).toBeNull()
    expect(normalizeLinkDestination('javascript:alert(1)')).toBeNull()
  })

  it('writes label first and destination second', () => {
    const result = insertLink(
      'this is cool',
      'https://search.taf.sh',
    )('Read more', 0, 9)
    expect(result.body).toBe('[this is cool](https://search.taf.sh)')
  })
})

describe('insertTemplate', () => {
  it('lands the caret at the marker instead of after the block', () => {
    const result = insertTemplate(CALLOUT_TEMPLATE)('', 0, 0)
    expect(result.body.trimEnd()).toBe(':::note\n\n:::')
    // Directly after the opening fence's newline, ready to type.
    expect(result.body.slice(0, result.selectionStart)).toBe(':::note\n')
    expect(result.selectionEnd).toBe(result.selectionStart)
  })

  it('opens the caret in the first column of a grid', () => {
    const result = insertTemplate(TWO_COL_TEMPLATE)('', 0, 0)
    expect(result.body).toContain('::::two-col{ratio="1:1"}')
    expect(result.body.slice(0, result.selectionStart)).toBe(
      '::::two-col{ratio="1:1"}\n:::col\n',
    )
  })

  it('pads the block away from surrounding prose', () => {
    const result = insertTemplate(CALLOUT_TEMPLATE)('text', 4, 4)
    expect(result.body).toBe('text\n\n:::note\n\n:::\n\n')
  })

  it('produces templates the validator accepts', () => {
    for (const template of [CALLOUT_TEMPLATE, TWO_COL_TEMPLATE]) {
      const { body } = insertTemplate(template)('', 0, 0)
      expect(validateDirectives(body)).toEqual([])
    }
  })
})

describe('componentSnippet', () => {
  const spec = (name: string) =>
    COMPONENTS.find((entry) => entry.name === name)!

  it('emits exactly one caret marker per snippet', () => {
    // `insertTemplate` replaces only the first, so a second would ship as the
    // literal text `$0` into the author's document.
    for (const entry of componentPalette()) {
      expect(
        (entry.snippet.match(/\$0/g) ?? []).length,
        `${entry.name} snippet`,
      ).toBe(1)
    }
  })

  it('covers every registered component', () => {
    expect(componentPalette()).toHaveLength(COMPONENTS.length)
  })

  it('self-closes a component with no body', () => {
    expect(componentSnippet(spec('Tape'))).toBe(`<Tape />${CARET}`)
  })

  it('includes required attributes and omits optional ones', () => {
    // `label` is required; `level` and `score` have defaults.
    expect(componentSnippet(spec('Meter'))).toBe(
      [`<Meter label="">`, CARET, '</Meter>'].join('\n'),
    )
  })

  it('pre-fills a required enum with a valid value', () => {
    expect(componentSnippet(spec('Embed'))).toContain('type="youtube"')
  })

  it('writes a required child rather than an empty shell', () => {
    expect(componentSnippet(spec('Steps'))).toBe(
      ['<Steps>', '<Step>', CARET, '</Step>', '</Steps>'].join('\n'),
    )
  })

  it('emits the minimum number of required children', () => {
    const snippet = componentSnippet(spec('Cols'))
    expect(snippet.match(/<Col>/g)).toHaveLength(2)
  })

  it('produces a structurally valid snippet', () => {
    for (const entry of componentPalette()) {
      const spec = COMPONENTS.find((item) => item.name === entry.name)!
      let body = entry.snippet.split(CARET).join('body')

      // A component that declares a parent is meant to be inserted inside one —
      // adding a third column, say — so it is checked in that context. On its
      // own the validator correctly rejects it, which is the point of the rule.
      if (spec.parents?.length) {
        const parent = spec.parents[0]
        body = [`<${parent}>`, body, `</${parent}>`].join('\n')
      }

      // Required string attributes are left empty for the author to fill, so a
      // fresh snippet can legitimately fail an id or enum check. What must not
      // happen is a structural error: an unclosed or misplaced tag.
      const structural = validateDocument(body).filter(
        (issue) =>
          issue.message.includes('never closed') ||
          issue.message.includes('must sit directly inside') ||
          issue.message.includes('must start its own line') ||
          issue.message.includes('may only contain'),
      )
      expect(structural, `${entry.name}: ${JSON.stringify(structural)}`).toEqual(
        [],
      )
    }
  })
})
