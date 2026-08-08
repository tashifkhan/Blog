import { describe, expect, it } from 'vitest'

import { validateDirectives, validateDocument } from './validate'

const messages = (source: string) =>
  validateDirectives(source).map((issue) => issue.message)

const messagesFor = (source: string) =>
  validateDocument(source).map((issue) => issue.message)

describe('validateDirectives', () => {
  it('accepts a well-formed two-column block', () => {
    expect(
      validateDirectives(
        [
          '::::two-col{ratio="2:1"}',
          ':::col',
          'left',
          ':::',
          ':::col',
          'right',
          ':::',
          '::::',
        ].join('\n'),
      ),
    ).toEqual([])
  })

  it('accepts callouts in either spelling', () => {
    expect(
      validateDirectives(':::tip Fast\nbody\n:::\n\n> [!NOTE]\n> body'),
    ).toEqual([])
  })

  it('flags an unclosed directive with the opening line', () => {
    const issues = validateDirectives(':::note\nbody')
    expect(issues).toHaveLength(1)
    expect(issues[0].line).toBe(1)
    expect(issues[0].message).toContain('never closed')
  })

  it('flags a closing fence with nothing open', () => {
    expect(messages('text\n\n:::')).toEqual([
      'Closing ":::" with no component open.',
    ])
  })

  it('catches a misspelled directive that would render as prose', () => {
    const issues = validateDirectives(':::waring\nbody\n:::')
    expect(issues[0].message).toContain('Unknown directive ":::waring"')
  })

  it('catches malformed attributes on a known directive', () => {
    const issues = validateDirectives(':::note{title="x"\nbody\n:::')
    expect(issues[0].message).toContain('Malformed attributes')
  })

  it('requires exactly two columns', () => {
    const issues = validateDirectives(
      '::::two-col\n:::col\nonly one\n:::\n::::',
    )
    expect(issues[0].message).toContain('exactly 2 "Col" blocks, found 1')
  })

  it('rejects a column outside a grid', () => {
    const issues = validateDirectives(':::col\nstray\n:::')
    expect(issues[0].message).toContain('must sit directly inside')
  })

  it('rejects non-column content directly inside a grid', () => {
    const issues = validateDirectives(
      '::::two-col\n:::note\nx\n:::\n:::col\na\n:::\n:::col\nb\n:::\n::::',
    )
    expect(issues[0].message).toContain('may only contain "Col", found "Note"')
  })

  it('rejects an unsupported ratio', () => {
    const issues = validateDirectives(
      '::::two-col{ratio="3:1"}\n:::col\na\n:::\n:::col\nb\n:::\n::::',
    )
    expect(issues[0].message).toContain(
      '"ratio" on "Cols" must be one of 1:1, 2:1, 1:2, found "3:1"',
    )
  })

  it('rejects an attribute the component does not have', () => {
    const issues = validateDirectives(':::note{titel="typo"}\nx\n:::')
    expect(issues[0].message).toContain('"Note" has no attribute "titel"')
  })

  it('ignores colons inside fenced code', () => {
    expect(
      validateDirectives(['```yaml', 'key: value', ':::', '```'].join('\n')),
    ).toEqual([])
  })

  it('ignores frontmatter', () => {
    expect(
      validateDirectives(['---', 'excerpt: ":::"', '---', 'body'].join('\n')),
    ).toEqual([])
  })
})

describe('validateDocument on tag syntax', () => {
  it('accepts a well-formed tag document', () => {
    expect(
      validateDocument(
        [
          '<Cols ratio="2:1">',
          '<Col>',
          'left',
          '</Col>',
          '<Col>',
          'right',
          '</Col>',
          '</Cols>',
        ].join('\n'),
      ),
    ).toEqual([])
  })

  it('accepts the single-line paired form', () => {
    expect(validateDocument('<Note>Heads up</Note>')).toEqual([])
  })

  it('flags an unclosed tag with the opening line', () => {
    const issues = validateDocument('intro\n\n<Note>\nbody')
    expect(issues).toEqual([
      { line: 3, message: '"<Note>" is never closed. Add "</Note>".' },
    ])
  })

  it('flags a closing tag with nothing open', () => {
    expect(messagesFor('</Note>')[0]).toContain(
      '"</Note>" with no matching opening tag',
    )
  })

  it('flags a crossed pair', () => {
    const issues = validateDocument(
      '<Cols>\n<Col>\na\n</Cols>\n</Col>',
    )
    expect(issues[0].message).toContain('"</Cols>" closes "<Col>"')
  })

  it('flags a directive closed with a tag', () => {
    expect(messagesFor(':::note\nx\n</Note>')[0]).toContain(
      'was opened as a directive',
    )
  })

  it('flags a tag closed with a directive', () => {
    expect(messagesFor('<Note>\nx\n:::')[0]).toContain('was opened as a tag')
  })

  it('rejects a bad enum value on a tag', () => {
    expect(messagesFor('<Cols ratio="3:1">\n<Col>a</Col>\n<Col>b</Col>\n</Cols>')[0]).toContain(
      '"ratio" on "Cols" must be one of',
    )
  })

  it('rejects a misspelled attribute on a tag', () => {
    expect(messagesFor('<Note titel="x">y</Note>')[0]).toContain(
      '"Note" has no attribute "titel"',
    )
  })

  it('enforces the parent rule across both spellings', () => {
    expect(messagesFor('<Col>\nstray\n</Col>')[0]).toContain(
      '"Col" must sit directly inside "Cols"',
    )
  })

  it('catches a block component buried mid-line, which would render as raw HTML', () => {
    expect(messagesFor('some prose <Note>hi</Note> more prose')[0]).toContain(
      'must start its own line',
    )
  })

  it('ignores tags inside fenced code', () => {
    expect(
      validateDocument(['```html', '<Cols>', '<Col>', '```'].join('\n')),
    ).toEqual([])
  })

  it('ignores tags that are not registered components', () => {
    expect(validateDocument('<Aside>\nnot ours\n</Aside>')).toEqual([])
  })

  // A post that documents the components is the case most likely to trip the
  // linter, and it is also the post most likely to exist.
  it('ignores a component named inside an inline code span', () => {
    expect(
      validateDocument('Write `<Steps>` or `:::steps` to open a sequence.'),
    ).toEqual([])
  })

  it('ignores a directive named inside an inline code span at line start', () => {
    expect(validateDocument('`:::note` opens a callout.')).toEqual([])
  })

  it('still sees a real tag alongside a quoted one', () => {
    // The quoted `<Note>` is ignored; the bare one is reported both for
    // sitting mid-line and for never being closed.
    expect(messagesFor('`<Note>` is written like <Note>this')).toEqual([
      expect.stringContaining('must start its own line'),
      expect.stringContaining('is never closed'),
    ])
  })

  it('does not treat an unterminated backtick as a code span', () => {
    expect(messagesFor('a ` b <Col>c</Col>')).toEqual([
      expect.stringContaining('must start its own line'),
      expect.stringContaining('must sit directly inside'),
    ])
  })
})
