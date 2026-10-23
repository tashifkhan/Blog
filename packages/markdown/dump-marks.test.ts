import { describe, expect, it } from 'vitest'

import { parseImageAlt } from './images'
import { renderMarkdown } from './render'
import { validateDocument } from './validate'

/** Rendered HTML with the inline SVG icons collapsed, so assertions stay short. */
function render(source: string): string {
  return renderMarkdown(source, { mermaid: false }).replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>')
}

describe('callout extras', () => {
  it('maps an alias type to its colour family with the alias label', () => {
    const html = render('> [!BUG]\n> Broke on Tuesday.')
    expect(html).toContain('<div class="md-callout md-callout--danger">')
    expect(html).toContain('<span>Bug</span>')
    expect(html).toContain('Broke on Tuesday.')
    expect(html).not.toContain('[!BUG]')
  })

  it('reads text after the marker as the title', () => {
    const html = render('> [!TIP] Re-dump with **Pyodide**\n> Same data.')
    expect(html).toContain('<span>Re-dump with **Pyodide**</span>')
    expect(html).toContain('<p class="md-p">Same data.</p>')
  })

  it('renders a title-only callout with an empty body', () => {
    const html = render('> [!IMPORTANT] Ship it')
    expect(html).toContain('<span>Ship it</span>')
    expect(html).not.toContain('<p class="md-p">')
  })

  it('gives quote aliases the quote variant', () => {
    const html = render('> [!QUOTE] Pyodide docs\n> Loaded from the CDN.')
    expect(html).toContain('class="md-callout md-callout--note md-callout--quote"')
    expect(html).toContain('<span>Pyodide docs</span>')
  })

  it('folds closed with `-` and open with `+` as a native details', () => {
    const closed = render('> [!NOTE]- Traceback\n> AttributeError')
    expect(closed).toContain(
      '<details class="md-callout md-callout--note md-callout--fold">' +
        '<summary class="md-callout-title"><svg/><span>Traceback</span></summary>' +
        '<div class="md-callout-body">',
    )
    expect(closed).toContain('</div></details>')

    const open = render('> [!FAQ]+\n> Answer.')
    expect(open).toContain('<details class="md-callout md-callout--important md-callout--fold" open>')
    expect(open).toContain('<span>FAQ</span>')
  })

  it('folds from the tag spelling too', () => {
    const html = render('<Warning title="Heads up" fold="closed">body</Warning>')
    expect(html).toContain('<details class="md-callout md-callout--warning md-callout--fold">')
    expect(validateDocument('<Warning title="Heads up" fold="closed">body</Warning>')).toEqual([])
  })

  it('leaves an unknown type as a plain quote', () => {
    const html = render('> [!NOPE]\n> body')
    expect(html).toContain('<blockquote class="md-quote">')
  })
})

describe('==highlight==', () => {
  it('renders a mark', () => {
    expect(render('a ==highlighted phrase== here')).toContain(
      'a <mark class="md-mark">highlighted phrase</mark> here',
    )
  })

  it('nests with bold', () => {
    expect(render('==with **bold** inside==')).toContain(
      '<mark class="md-mark">with <strong class="md-strong">bold</strong> inside</mark>',
    )
  })

  it('takes the theme mark class', () => {
    expect(renderMarkdown('==x==', { theme: { mark: 'hl' } })).toContain('<mark class="md-mark hl">x</mark>')
  })

  it('leaves a lone pair of equals alone', () => {
    expect(render('a == b')).not.toContain('<mark')
    expect(render('`==code==`')).not.toContain('<mark')
  })
})

describe('LaTeX arrows', () => {
  it('turns commands into labelled glyphs', () => {
    const html = render('load \\to parse, $\\Rightarrow$ done, \\nearrow up')
    expect(html).toContain('<span class="md-arrow" role="img" aria-label="to">→</span>')
    expect(html).toContain('<span class="md-arrow" role="img" aria-label="implies">⇒</span>')
    expect(html).toContain('<span class="md-arrow" role="img" aria-label="north-east arrow">↗</span>')
    expect(html).not.toContain('$')
  })

  it('skips code spans and fences', () => {
    const html = render('inline `\\to` stays\n\n```tex\na \\to b\n```')
    expect(html).toContain('<code class="md-code-inline">\\to</code>')
    expect(html).toContain('a \\to b')
    expect(html).not.toContain('md-arrow')
  })

  it('does not match inside a longer word', () => {
    expect(render('\\total')).not.toContain('md-arrow')
  })
})

describe('image placement', () => {
  it('parses placement and percentage in any order', () => {
    expect(parseImageAlt('Chart|right|40%')).toEqual({ alt: 'Chart', placement: 'right', percent: 40 })
    expect(parseImageAlt('Chart|40%|right')).toEqual({ alt: 'Chart', placement: 'right', percent: 40 })
    expect(parseImageAlt('Chart|400x260|center')).toEqual({
      alt: 'Chart',
      width: 400,
      height: 260,
      placement: 'center',
    })
    expect(parseImageAlt('Rock|Paper')).toEqual({ alt: 'Rock|Paper' })
  })

  it('floats a figure and sets its width', () => {
    const html = render('![Chart|right|40%](/x.png)')
    expect(html).toContain('<figure class="md-figure md-figure--right" style="--md-fig-w: 40%">')
    expect(html).toContain('alt="Chart"')
    expect(html).toContain('<figcaption class="md-image-caption">Chart</figcaption>')
  })

  it('prefers the quoted title as the caption', () => {
    const html = render('![Chart|center](/x.png "The real caption")')
    expect(html).toContain('<figure class="md-figure md-figure--center">')
    expect(html).toContain('<figcaption class="md-image-caption">The real caption</figcaption>')
  })
})

describe('dump components', () => {
  it('Banner', () => {
    expect(render('<Banner title="Read this first.">The verdict.</Banner>')).toBe(
      '<div class="md-banner md-banner--danger" role="note">' +
        '<div class="md-banner-title">Read this first.</div>' +
        '<div class="md-banner-body"><p class="md-p">The verdict.</p></div></div>',
    )
    expect(render(':::risk-banner{tone="ok"}\nFine.\n:::')).toContain('class="md-banner md-banner--ok"')
  })

  it('Quote', () => {
    expect(render('<Quote tone="ok" cite="Docs &amp; more">Copy it.</Quote>')).toBe(
      '<figure class="md-quote-block md-quote-block--ok">' +
        '<blockquote class="md-quote-block-body"><p class="md-p">Copy it.</p></blockquote>' +
        '<figcaption class="md-quote-block-cite">Docs &amp;amp; more</figcaption></figure>',
    )
    expect(render('<Quote pull>Line.</Quote>')).toContain('class="md-quote-block md-quote-block--pull"')
  })

  it('Ticks', () => {
    const html = render('<Ticks>\n- one\n- two\n</Ticks>')
    expect(html).toMatch(/^<div class="md-ticks"><ul class="md-ul">/)
    expect(html).toContain('<span class="md-li-bullet" aria-hidden="true"></span>')
  })

  it('Pill', () => {
    expect(render('x <Pill kind="no">drop</Pill> <Pill>info</Pill>')).toBe(
      '<p class="md-p">x <span class="md-pill md-pill--no">drop</span> ' +
        '<span class="md-pill md-pill--info">info</span></p>',
    )
  })

  it('Stamp, inline and block', () => {
    expect(render('a <Stamp tone="bad">NO</Stamp>')).toContain(
      '<span class="md-stamp md-stamp--bad" style="--md-stamp-rotate: -4deg"><span class="md-stamp-ink">NO</span></span>',
    )
    const block = render('<Stamp rotate={40}>SHIPPED</Stamp>')
    expect(block).toMatch(
      /^<div class="md-stamp md-stamp--ink md-stamp--block" style="--md-stamp-rotate: 15deg"><span class="md-stamp-ink">/,
    )
    expect(render('<Stamp rotate={0}>FLAT</Stamp>')).not.toContain('style=')
  })

  it('Kbd, with a key name or a literal body', () => {
    expect(render('hit <Kbd k="cmd" />')).toContain(
      '<kbd class="md-kbd md-kbd--mod" title="Command">⌘</kbd>',
    )
    expect(render('hit <Kbd k="enter" platform="win" />')).toContain(
      '<kbd class="md-kbd" title="Enter">Enter</kbd>',
    )
    expect(render('Literal: <Kbd>|</Kbd>.')).toContain('<kbd class="md-kbd">|</kbd>')
  })

  it('Keys', () => {
    expect(render('hit <Keys keys="cmd shift p" />')).toContain(
      '<span class="md-keys">' +
        '<kbd class="md-kbd md-kbd--mod" title="Command">⌘</kbd>' +
        '<span class="md-keys-sep" aria-hidden="true">+</span>' +
        '<kbd class="md-kbd md-kbd--mod" title="Shift">⇧</kbd>' +
        '<span class="md-keys-sep" aria-hidden="true">+</span>' +
        '<kbd class="md-kbd" title="p">p</kbd></span>',
    )
    expect(render('hit <Keys keys="prefix d" sep="" />')).toContain(
      '<kbd class="md-kbd" title="PREFIX">PREFIX</kbd><kbd class="md-kbd" title="d">d</kbd>',
    )
    expect(render('hit <Keys keys="<b>" />')).toContain('title="&lt;b&gt;">&lt;b&gt;</kbd>')
  })

  it('Col card and pick', () => {
    const html = render('<Cols>\n<Col card>a</Col>\n<Col pick>b</Col>\n</Cols>')
    expect(html).toContain('<div class="md-col md-col--card">')
    expect(html).toContain('<div class="md-col md-col--card md-col--pick">')
  })
})
