import { describe, expect, it } from 'vitest'

import { validateDirectives } from './validate'

const messages = (source: string) =>
  validateDirectives(source).map((issue) => issue.message)

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
      'Closing ":::" with no directive open.',
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
    expect(issues[0].message).toContain('exactly two ":::col" blocks, found 1')
  })

  it('rejects a column outside a grid', () => {
    const issues = validateDirectives(':::col\nstray\n:::')
    expect(issues[0].message).toContain('must sit directly inside')
  })

  it('rejects non-column content directly inside a grid', () => {
    const issues = validateDirectives(
      '::::two-col\n:::note\nx\n:::\n:::col\na\n:::\n:::col\nb\n:::\n::::',
    )
    expect(issues[0].message).toContain('may only contain ":::col"')
  })

  it('rejects an unsupported ratio', () => {
    const issues = validateDirectives(
      '::::two-col{ratio="3:1"}\n:::col\na\n:::\n:::col\nb\n:::\n::::',
    )
    expect(issues[0].message).toContain('Unsupported ratio "3:1"')
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
