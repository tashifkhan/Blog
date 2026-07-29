import { describe, expect, it } from 'vitest'

import { insertBlock, prefixLines, wrapSelection } from './markdown-editing'

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
