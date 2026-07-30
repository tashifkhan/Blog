import { describe, expect, it } from 'vitest'

import { parseImageAlt } from './images'
import { renderMarkdown } from './render'

describe('parseImageAlt', () => {
  it('reads a width-only suffix', () => {
    expect(parseImageAlt('A diagram|400')).toEqual({
      alt: 'A diagram',
      width: 400,
    })
  })

  it('reads a width and height suffix', () => {
    expect(parseImageAlt('A diagram|400x260')).toEqual({
      alt: 'A diagram',
      width: 400,
      height: 260,
    })
    // Obsidian also writes the multiplication sign.
    expect(parseImageAlt('A diagram|400×260')).toEqual({
      alt: 'A diagram',
      width: 400,
      height: 260,
    })
  })

  it('leaves a non-numeric pipe in the alt text alone', () => {
    expect(parseImageAlt('Rock|Paper')).toEqual({ alt: 'Rock|Paper' })
    expect(parseImageAlt('Chart|v2 final')).toEqual({ alt: 'Chart|v2 final' })
  })

  it('treats a zero width as a typo rather than a size', () => {
    expect(parseImageAlt('thing|0')).toEqual({ alt: 'thing|0' })
  })

  it('handles an empty alt with a size', () => {
    expect(parseImageAlt('|320')).toEqual({ alt: '', width: 320 })
  })
})

describe('image rendering', () => {
  it('emits width and height attributes', () => {
    const html = renderMarkdown('![Shot|400x260](/img/s.png)')
    expect(html).toContain('width="400"')
    expect(html).toContain('height="260"')
    expect(html).toContain('alt="Shot"')
    // The size suffix must not leak into the caption.
    expect(html).not.toContain('Shot|400')
  })

  it('omits size attributes when none are given', () => {
    const html = renderMarkdown('![Shot](/img/s.png)')
    expect(html).not.toContain('width=')
    expect(html).not.toContain('height=')
  })

  it('does not nest a figure inside a paragraph', () => {
    // `<figure>` is not valid inside `<p>`; a browser closes the paragraph
    // early and strands an empty one before every captioned image.
    const html = renderMarkdown('![Shot](/img/s.png)')
    expect(html).toContain('<figure')
    expect(html).not.toMatch(/<p[^>]*>\s*<figure/)
  })

  it('keeps an image inside a sentence inline and uncaptioned', () => {
    const html = renderMarkdown('See ![icon|24](/img/i.png) inline.')
    expect(html).toContain('md-image--inline')
    expect(html).not.toContain('<figure')
    expect(html).not.toContain('figcaption')
    expect(html).toContain('width="24"')
  })

  it('groups consecutive images on their own lines into one figure block', () => {
    const html = renderMarkdown('![One](/a.png)\n![Two](/b.png)')
    expect(html).not.toMatch(/<p[^>]*>\s*<figure/)
    expect(html.match(/<figure/g)).toHaveLength(2)
  })

  it('renders a sized image inside a column', () => {
    const html = renderMarkdown(
      [
        '::::two-col{ratio="1:1"}',
        ':::col',
        '![Shot|300](/img/s.png)',
        ':::',
        ':::col',
        'notes',
        ':::',
        '::::',
      ].join('\n'),
    )
    expect(html).toContain('md-two-col')
    expect(html).toContain('width="300"')
    expect(html).toMatch(/<div class="md-col"><figure/)
  })
})
