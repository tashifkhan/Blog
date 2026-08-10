import { describe, expect, it } from 'vitest'

import { parseDirectiveInfo } from './directives'
import { renderMarkdown } from './render'

/** The parsed shape, minus the spec object, which is compared by name. */
function parsed(info: string) {
  const result = parseDirectiveInfo(info)
  if (!result) return null
  return { name: result.name, raw: result.raw, attrs: result.attrs }
}

describe('parseDirectiveInfo', () => {
  it('accepts a bare directive', () => {
    expect(parsed('col')).toEqual({ name: 'Col', raw: 'col', attrs: {} })
  })

  it('resolves a directive to its component spec', () => {
    expect(parseDirectiveInfo('col')?.spec.name).toBe('Col')
    expect(parseDirectiveInfo('note')?.spec.directive).toBe('note')
  })

  it('reads braced attributes with either quoting style', () => {
    expect(parsed('cols{ratio="2:1"}')).toEqual({
      name: 'Cols',
      raw: 'cols',
      attrs: { ratio: '2:1' },
    })
    expect(parsed("note{title='Heads up'}")).toEqual({
      name: 'Note',
      raw: 'note',
      attrs: { title: 'Heads up' },
    })
  })

  it('maps a bare value onto the directive’s primary attribute', () => {
    expect(parsed('cols 2:1')).toEqual({
      name: 'Cols',
      raw: 'cols',
      attrs: { ratio: '2:1' },
    })
    expect(parsed('tip Performance note')).toEqual({
      name: 'Tip',
      raw: 'tip',
      attrs: { title: 'Performance note' },
    })
  })

  it('keeps the published `two-col` spelling working as an alias', () => {
    expect(parsed('two-col 2:1')).toEqual({
      name: 'Cols',
      raw: 'two-col',
      attrs: { ratio: '2:1' },
    })
  })

  it('rejects unknown names and unterminated attributes', () => {
    expect(parseDirectiveInfo('waring')).toBeNull()
    expect(parseDirectiveInfo('note{title="x"')).toBeNull()
    // `col` takes no positional value, so a stray one is not a directive.
    expect(parseDirectiveInfo('col left')).toBeNull()
  })
})

describe('two-col rendering', () => {
  const source = [
    '::::two-col{ratio="2:1"}',
    ':::col',
    '### Left',
    '',
    '- one',
    ':::',
    ':::col',
    'Right side',
    ':::',
    '::::',
  ].join('\n')

  it('emits a grid with the requested tracks', () => {
    const html = renderMarkdown(source)
    expect(html).toContain('md-two-col')
    expect(html).toContain('md-cols')
    expect(html).toContain('--md-grid-cols: 2fr 1fr')
    expect(html.match(/class="md-col"/g)).toHaveLength(2)
  })

  it('parses column bodies as Markdown rather than raw text', () => {
    const html = renderMarkdown(source)
    expect(html).toContain('<h3')
    expect(html).toContain('Left')
    expect(html).toContain('<ul')
    expect(html).not.toContain('### Left')
  })

  it('falls back to equal columns for an unsupported ratio', () => {
    // Unknown ratio is discarded; equal columns from the default `cols={2}` apply.
    const html = renderMarkdown('::::two-col{ratio="9:1"}\n:::col\na\n:::\n::::')
    expect(html).toContain('--md-grid-cols: 1fr 1fr')
  })

  it('nests with equal-length fences', () => {
    const html = renderMarkdown(
      [':::two-col', ':::col', 'a', ':::', ':::col', 'b', ':::', ':::'].join('\n'),
    )
    expect(html.match(/class="md-col"/g)).toHaveLength(2)
    expect(html).toContain('md-two-col')
  })

  it('leaves a fenced code block containing colons alone', () => {
    const html = renderMarkdown(
      [
        '::::two-col',
        ':::col',
        '```yaml',
        'key: value',
        ':::',
        '```',
        ':::',
        ':::col',
        'right',
        ':::',
        '::::',
      ].join('\n'),
    )
    // The `:::` inside the fence must not close the column early, so both
    // columns still exist and the code block survives intact.
    expect(html.match(/class="md-col"/g)).toHaveLength(2)
    expect(html).toContain('key: value')
  })
})

describe('callouts', () => {
  it('renders a directive callout with its title', () => {
    const html = renderMarkdown(':::warning Careful\nBody text\n:::')
    expect(html).toContain('md-callout md-callout--warning')
    expect(html).toContain('Careful')
    expect(html).toContain('Body text')
  })

  it('defaults the title to the callout name', () => {
    const html = renderMarkdown(':::note\nBody\n:::')
    expect(html).toContain('<span>Note</span>')
  })

  it('escapes a title', () => {
    const html = renderMarkdown(':::note{title="<script>x</script>"}\nBody\n:::')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('renders GitHub alert blockquotes through the same markup', () => {
    const html = renderMarkdown('> [!TIP]\n> Use a directive instead.')
    expect(html).toContain('md-callout md-callout--tip')
    expect(html).toContain('Use a directive instead.')
    expect(html).not.toContain('[!TIP]')
    expect(html).not.toContain('<blockquote')
  })

  it('leaves an ordinary blockquote as a blockquote', () => {
    const html = renderMarkdown('> Just a quote')
    expect(html).toContain('md-quote')
    expect(html).not.toContain('md-callout')
  })
})
