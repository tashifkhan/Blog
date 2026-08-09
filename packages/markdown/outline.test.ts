import { describe, expect, it } from 'vitest'

import {
  countWords,
  extractOutline,
  RENDERER_VERSION,
  usedComponents,
} from './outline'

describe('countWords', () => {
  it('counts prose', () => {
    expect(countWords('one two three')).toBe(3)
  })

  it('ignores frontmatter', () => {
    expect(countWords('---\ntitle: "A long descriptive title"\n---\nbody')).toBe(1)
  })

  it('ignores fenced code, so a config listing is not a long read', () => {
    expect(countWords('intro\n\n```js\nconst a = 1\nconst b = 2\n```\n\nend')).toBe(2)
  })

  it('ignores component tags but keeps their body text', () => {
    expect(countWords('<Note title="Ignored heading">real body text</Note>')).toBe(3)
  })

  it('ignores directive fences', () => {
    expect(countWords(':::tip Some title\nbody here\n:::')).toBe(2)
  })

  it('keeps link text but drops the URL', () => {
    expect(countWords('see [the docs](https://example.com/a/b/c)')).toBe(3)
  })

  it('drops image markup entirely', () => {
    expect(countWords('![a diagram of things](/images/x.png)')).toBe(0)
  })
})

describe('usedComponents', () => {
  it('finds tag syntax', () => {
    expect(usedComponents('<Cols>\n<Col>a</Col>\n<Col>b</Col>\n</Cols>')).toEqual([
      'Cols',
      'Col',
    ])
  })

  it('finds directive syntax including published aliases', () => {
    expect(usedComponents('::::two-col\n:::col\na\n:::\n::::')).toEqual([
      'Cols',
      'Col',
    ])
  })

  it('reports each component once', () => {
    expect(usedComponents(':::note\na\n:::\n:::note\nb\n:::')).toEqual(['Note'])
  })

  it('finds the GitHub alert spelling of a callout', () => {
    // `callouts.ts` rewrites this into the same tokens, so a post using only
    // this form still uses the component.
    expect(usedComponents('> [!WARNING]\n> careful')).toEqual(['Warning'])
  })

  it('does not invent a callout from an unrelated blockquote', () => {
    expect(usedComponents('> just a quote')).toEqual([])
  })

  it('does not match a component name appearing as prose', () => {
    expect(usedComponents('I wrote some Notes about Cols today.')).toEqual([])
  })

  it('returns nothing for a plain post', () => {
    expect(usedComponents('# Title\n\nJust prose.')).toEqual([])
  })
})

describe('extractOutline', () => {
  const source = [
    '---',
    'title: "Ignored"',
    '---',
    '# Intro',
    '',
    'Some words here.',
    '',
    '## Details {#deep-dive}',
    '',
    ':::note',
    'A callout.',
    ':::',
  ].join('\n')

  it('reports the renderer version', () => {
    expect(extractOutline(source).renderer).toBe(RENDERER_VERSION)
  })

  it('reports headings with the anchors the renderer emits', () => {
    expect(extractOutline(source).headings).toEqual([
      { depth: 1, text: 'Intro', slug: 'intro' },
      { depth: 2, text: 'Details', slug: 'deep-dive' },
    ])
  })

  it('reports the components used', () => {
    expect(extractOutline(source).components).toEqual(['Note'])
  })

  it('never reports a reading time below one minute', () => {
    expect(extractOutline('hi').readingTimeMinutes).toBe(1)
  })

  it('rounds reading time from the word count', () => {
    const words = Array.from({ length: 1000 }, () => 'word').join(' ')
    const outline = extractOutline(words)
    expect(outline.wordCount).toBe(1000)
    expect(outline.readingTimeMinutes).toBe(5)
  })
})
