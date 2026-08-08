import { describe, expect, it } from 'vitest'

import { parseOpenTag } from './jsx'
import { renderMarkdown } from './render'

describe('parseOpenTag', () => {
  it('resolves a registered component and reads quoted attributes', () => {
    const tag = parseOpenTag('<Note title="Heads up">', 0)
    expect(tag?.spec.name).toBe('Note')
    expect(tag?.attrs).toEqual({ title: 'Heads up' })
    expect(tag?.selfClosing).toBe(false)
  })

  it('reads a JSX expression attribute as a literal', () => {
    expect(parseOpenTag('<Cols ratio={"2:1"}>', 0)?.attrs).toEqual({
      ratio: '2:1',
    })
  })

  it('records a bare attribute as the empty string', () => {
    // `resolveAttrs` is what turns this into a boolean true.
    expect(parseOpenTag('<Cols tilt>', 0)?.attrs).toEqual({ tilt: '' })
  })

  it('marks a self-closing tag and reports where it ends', () => {
    const tag = parseOpenTag('<Col />rest', 0)
    expect(tag?.selfClosing).toBe(true)
    expect(tag?.end).toBe('<Col />'.length)
  })

  it('is case-insensitive on the tag name', () => {
    expect(parseOpenTag('<cols>', 0)?.spec.name).toBe('Cols')
  })

  it('rejects an unregistered name so it stays ordinary HTML', () => {
    expect(parseOpenTag('<Div>', 0)).toBeNull()
    expect(parseOpenTag('<Steppes>', 0)).toBeNull()
  })

  it('does not let an unterminated tag swallow the document', () => {
    expect(parseOpenTag('<Note title="x\nmore text', 0)).toBeNull()
  })

  it('ignores a `>` inside a quoted attribute value', () => {
    expect(parseOpenTag('<Note title="a > b">', 0)?.attrs).toEqual({
      title: 'a > b',
    })
  })
})

describe('tag syntax renders identically to directive syntax', () => {
  const cases: Array<[string, string, string]> = [
    [
      'callout with a title',
      ':::tip Performance\nMeasure first.\n:::',
      '<Tip title="Performance">\nMeasure first.\n</Tip>',
    ],
    [
      'callout with the default title',
      ':::warning\nCareful.\n:::',
      '<Warning>\nCareful.\n</Warning>',
    ],
    [
      'two-column grid',
      '::::cols{ratio="2:1"}\n:::col\n### Left\n:::\n:::col\n### Right\n:::\n::::',
      '<Cols ratio="2:1">\n<Col>\n### Left\n</Col>\n<Col>\n### Right\n</Col>\n</Cols>',
    ],
    [
      'markdown inside a column',
      '::::cols\n:::col\n- one\n- two\n:::\n:::col\n`code`\n:::\n::::',
      '<Cols>\n<Col>\n- one\n- two\n</Col>\n<Col>\n`code`\n</Col>\n</Cols>',
    ],
  ]

  for (const [label, directive, tag] of cases) {
    it(label, () => {
      expect(renderMarkdown(tag)).toBe(renderMarkdown(directive))
    })
  }

  it('lets the two spellings nest inside each other', () => {
    const mixed = renderMarkdown('<Cols>\n:::col\na\n:::\n:::col\nb\n:::\n</Cols>')
    const pure = renderMarkdown('<Cols>\n<Col>\na\n</Col>\n<Col>\nb\n</Col>\n</Cols>')
    expect(mixed).toBe(pure)
  })
})

describe('single-line paired tags', () => {
  it('expands a block component written on one line', () => {
    expect(renderMarkdown('<Note>Heads up</Note>')).toBe(
      renderMarkdown(':::note\nHeads up\n:::'),
    )
  })

  it('does not strand a paragraph around the expanded block', () => {
    const html = renderMarkdown('<Note>Heads up</Note>')
    expect(html).not.toContain('<p class="md-p"><div')
    expect(html).toContain('md-callout')
  })
})

describe('tags the parser must not claim', () => {
  it('leaves an unregistered tag as raw HTML', () => {
    expect(renderMarkdown('<Aside>text</Aside>')).toContain('<Aside>')
  })

  it('leaves a component tag inside a fenced code block alone', () => {
    const html = renderMarkdown('```html\n<Cols ratio="2:1">\n```')
    expect(html).toContain('&lt;Cols ratio=&quot;2:1&quot;&gt;')
    expect(html).not.toContain('md-two-col')
  })

  it('does not treat a lone angle bracket in prose as a tag', () => {
    expect(renderMarkdown('a < b and c > d')).toContain('a &lt; b and c &gt; d')
  })

  it('runs to the end of the block when a tag is never closed', () => {
    // Same forgiving behaviour as an unterminated code fence.
    const html = renderMarkdown('<Note>\nstill rendered')
    expect(html).toContain('md-callout')
    expect(html).toContain('still rendered')
  })
})
