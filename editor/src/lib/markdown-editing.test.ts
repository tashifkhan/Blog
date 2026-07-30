import { describe, expect, it } from 'vitest'

import { validateDirectives } from '../markdown/validate'
import {
  CALLOUT_TEMPLATE,
  TWO_COL_TEMPLATE,
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
