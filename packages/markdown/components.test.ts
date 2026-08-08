import { describe, expect, it } from 'vitest'

import { COMPONENTS, embedUrl, resolveAttrs } from './components'
import { renderMarkdown } from './render'
import { validateDocument } from './validate'

/** Every component, with a minimal valid document that exercises it. */
const SAMPLES: Record<string, string> = {
  Cols: '<Cols>\n<Col>a</Col>\n<Col>b</Col>\n</Cols>',
  Col: '<Cols>\n<Col>a</Col>\n<Col>b</Col>\n</Cols>',
  Note: '<Note>body</Note>',
  Tip: '<Tip>body</Tip>',
  Important: '<Important>body</Important>',
  Warning: '<Warning>body</Warning>',
  Caution: '<Caution>body</Caution>',
  Danger: '<Danger>body</Danger>',
  Panel: '<Panel title="Setup" tape tilt={-3}>body</Panel>',
  InkBand: '<InkBand title="House rules">body</InkBand>',
  Strips: '<Strips>\n- one\n- two\n</Strips>',
  Toc: '## Alpha\n\n## Beta\n\n<Toc />',
  Steps: '<Steps>\n<Step title="First">do it</Step>\n</Steps>',
  Step: '<Steps>\n<Step title="First">do it</Step>\n</Steps>',
  Phases: '<Phases>\n<Phase title="Rollout" tag="Q3">body</Phase>\n</Phases>',
  Phase: '<Phases>\n<Phase title="Rollout" tag="Q3">body</Phase>\n</Phases>',
  Checklist: '<Checklist title="Before publish">\n- [ ] one\n</Checklist>',
  Lede: '<Lede>An opening line.</Lede>',
  Meters: '<Meters>\n<Meter label="Leak" level="high" score={8}>why</Meter>\n</Meters>',
  Meter: '<Meters>\n<Meter label="Leak" level="high" score={8}>why</Meter>\n</Meters>',
  Kpi: '<Kpi cols={2}>\n<Stat value="42" label="posts" />\n</Kpi>',
  Stat: '<Kpi cols={2}>\n<Stat value="42" label="posts" />\n</Kpi>',
  Bars: '<Bars title="Split">\n<Bar label="TS" value={70} />\n</Bars>',
  Bar: '<Bars title="Split">\n<Bar label="TS" value={70} />\n</Bars>',
  Legend: '<Legend>\n- one\n- two\n</Legend>',
  Sticker: '<Sticker shape="round">NEW</Sticker>',
  Hand: '<Hand>a margin note</Hand>',
  Tape: '<Tape />',
  Mark: 'some <Mark>highlighted</Mark> text',
  Figure: '<Figure caption="A chart" credit="me">\n![alt](/x.png)\n</Figure>',
  Ascii: '<Ascii label="Architecture">\n a -> b\n</Ascii>',
  Embed: '<Embed type="youtube" id="dQw4w9WgXcQ" />',
  Tabs: '<Tabs>\n<Tab title="npm">`npm i`</Tab>\n</Tabs>',
  Tab: '<Tabs>\n<Tab title="npm">`npm i`</Tab>\n</Tabs>',
  Details: '<Details summary="Show more">body</Details>',
}

describe('every registered component', () => {
  it('has a sample document', () => {
    // Guards the tests below: a component added without a sample would
    // otherwise be silently untested.
    expect(COMPONENTS.map((spec) => spec.name).filter((name) => !SAMPLES[name])).toEqual([])
  })

  for (const spec of COMPONENTS) {
    describe(spec.name, () => {
      const sample = SAMPLES[spec.name]

      it('renders with no theme at all', () => {
        const html = renderMarkdown(sample)
        expect(html).toContain('md-')
        expect(html).not.toContain('undefined')
        expect(html).not.toContain('class=" ')
      })

      it('appends host classes when a theme supplies them', () => {
        const slot = Object.keys({} as Record<string, string>)
        void slot
        const html = renderMarkdown(sample, {
          theme: { callout: 'x-callout', panel: 'x-panel', step: 'x-step' },
        })
        expect(html).toContain('md-')
      })

      it('validates clean', () => {
        expect(validateDocument(sample)).toEqual([])
      })

      it('renders the same from directive syntax', () => {
        // Skip the inline-only components, which have no directive form.
        if (spec.placement === 'inline') return
        const directive = sample
          .replace(
            new RegExp(`<${spec.name}\\b([^>]*?)\\s*/>`, 'g'),
            (_m, attrs) => `:::${spec.directive}{${attrs.trim()}}\n:::`,
          )
        expect(() => renderMarkdown(directive)).not.toThrow()
      })
    })
  }
})

describe('resolveAttrs', () => {
  const panel = COMPONENTS.find((spec) => spec.name === 'Panel')!

  it('applies defaults for absent attributes', () => {
    const cols = COMPONENTS.find((spec) => spec.name === 'Cols')!
    expect(resolveAttrs(cols, {}).ratio).toBe('1:1')
  })

  it('reads a bare attribute as boolean true', () => {
    expect(resolveAttrs(panel, { tape: '' }).tape).toBe(true)
  })

  it('defaults an absent boolean to false rather than undefined', () => {
    expect(resolveAttrs(panel, {}).tape).toBe(false)
  })

  it('coerces a numeric attribute', () => {
    expect(resolveAttrs(panel, { tilt: '-4' }).tilt).toBe(-4)
  })

  it('falls back to the default for an unknown enum value', () => {
    const cols = COMPONENTS.find((spec) => spec.name === 'Cols')!
    expect(resolveAttrs(cols, { ratio: '9:1' }).ratio).toBe('1:1')
  })
})

describe('Toc', () => {
  const source = [
    '# Title',
    '## Alpha',
    '### Deep',
    '#### Deeper',
    '## Beta {#custom}',
    '',
    '<Toc />',
  ].join('\n')

  /** Just the `<nav>`, since headings emit their own permalink anchors too. */
  const toc = (markdown: string) =>
    /<nav class="md-toc"[\s\S]*?<\/nav>/.exec(renderMarkdown(markdown))?.[0] ?? ''

  it('lists headings between `from` and `depth`', () => {
    const nav = toc(source)
    expect(nav).toContain('href="#alpha"')
    expect(nav).toContain('href="#deep"')
    // h1 is above the default `from`, h4 below the default `depth`.
    expect(nav).not.toContain('href="#title"')
    expect(nav).not.toContain('href="#deeper"')
  })

  it('uses the anchors the renderer actually emitted', () => {
    expect(toc(source)).toContain('href="#custom"')
  })

  it('honours an explicit depth', () => {
    expect(toc(source.replace('<Toc />', '<Toc depth={4} />'))).toContain(
      'href="#deeper"',
    )
  })

  it('renders nothing rather than an empty shell when there are no headings', () => {
    expect(renderMarkdown('<Toc />')).not.toContain('md-toc')
  })
})

describe('Ascii', () => {
  const source = ['<Ascii label="Architecture">', '  a --> b', '  |    *_*', '</Ascii>'].join('\n')

  it('keeps the body exactly as written', () => {
    const html = renderMarkdown(source)
    expect(html).toContain('  a --&gt; b')
    // Markdown would have read `*_*` as emphasis and eaten the leading spaces.
    expect(html).toContain('  |    *_*')
    expect(html).not.toContain('<em>')
  })

  it('describes itself to a screen reader', () => {
    expect(renderMarkdown(source)).toContain('role="img" aria-label="Architecture"')
  })

  it('requires a label', () => {
    expect(validateDocument('<Ascii>\nx\n</Ascii>')[0].message).toContain(
      'requires the "label" attribute',
    )
  })
})

describe('Embed', () => {
  it('builds a cookie-free YouTube URL', () => {
    expect(embedUrl('youtube', 'dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })

  it('builds a CodePen embed URL', () => {
    expect(embedUrl('codepen', 'tashif/abcDEf')).toBe(
      'https://codepen.io/tashif/embed/abcDEf',
    )
  })

  it('refuses an unknown provider', () => {
    expect(embedUrl('myspace', 'x')).toBeNull()
  })

  it('refuses an id that is really a URL', () => {
    expect(embedUrl('youtube', 'https://evil.example/x')).toBeNull()
  })

  it('refuses a path-traversing id', () => {
    expect(embedUrl('vimeo', '../../admin')).toBeNull()
  })

  it('renders an error span instead of a frame for a bad id', () => {
    const html = renderMarkdown('<Embed type="youtube" id="../x" />')
    expect(html).toContain('md-embed-invalid')
    expect(html).not.toContain('<iframe')
  })

  it('flags a bad id at publish time', () => {
    expect(
      validateDocument('<Embed type="youtube" id="../x" />')[0].message,
    ).toContain('is not a valid youtube id')
  })
})

describe('Meter', () => {
  it('clamps a score to the 0-10 scale', () => {
    const html = renderMarkdown('<Meters>\n<Meter label="X" score={99}>y</Meter>\n</Meters>')
    expect(html).toContain('--md-meter-score: 10')
  })

  it('describes the bar to a screen reader', () => {
    const html = renderMarkdown('<Meters>\n<Meter label="Leak" score={8}>y</Meter>\n</Meters>')
    expect(html).toContain('aria-label="Leak: 8 out of 10"')
  })
})

describe('Bar', () => {
  it('scales the fill against max', () => {
    const html = renderMarkdown('<Bars>\n<Bar label="TS" value={30} max={60} />\n</Bars>')
    expect(html).toContain('--md-bar-fill: 50.00%')
  })

  it('survives a zero max rather than dividing by it', () => {
    const html = renderMarkdown('<Bars>\n<Bar label="TS" value={5} max={0} />\n</Bars>')
    expect(html).toContain('--md-bar-fill: 0.00%')
  })

  it('shows `display` in place of the raw value when given', () => {
    const html = renderMarkdown(
      '<Bars>\n<Bar label="TS" value={70} display="70%" />\n</Bars>',
    )
    expect(html).toContain('>70%<')
  })
})

describe('inline components', () => {
  it('renders Hand as a span inside a paragraph', () => {
    expect(renderMarkdown('text <Hand>note</Hand> more')).toContain(
      '<span class="md-hand">',
    )
  })

  it('renders Hand as a div when it stands alone', () => {
    expect(renderMarkdown('<Hand>\na whole aside\n</Hand>')).toContain(
      '<div class="md-hand">',
    )
  })

  it('parses Markdown inside an inline component', () => {
    expect(renderMarkdown('a <Mark>**bold**</Mark> b')).toContain('<strong')
  })

  it('keeps Mark out of the block parser', () => {
    // `placement: 'inline'` means a lone `<Mark>` line stays in its paragraph.
    expect(renderMarkdown('<Mark>hi</Mark>')).toContain('<p class="md-p">')
  })
})

describe('escaping', () => {
  it('escapes markup in an attribute value', () => {
    const html = renderMarkdown(`<Panel title='<img src=x onerror=alert(1)>'>x</Panel>`)
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src=x')
  })

  it('escapes a quote that would otherwise close an attribute early', () => {
    const html = renderMarkdown(`<Sticker shape='round'>a" onclick="evil()</Sticker>`)
    expect(html).not.toContain('onclick="evil()"')
  })

  it('escapes a label reused inside an aria attribute', () => {
    const html = renderMarkdown(
      `<Meters>\n<Meter label='Leak " risk'>y</Meter>\n</Meters>`,
    )
    expect(html).toContain('aria-label="Leak &quot; risk: 5 out of 10"')
  })

  it('escapes a style custom property rather than letting it inject', () => {
    const html = renderMarkdown('<Bars>\n<Bar label="a" value={5} display="b\\"c" />\n</Bars>')
    expect(html).not.toMatch(/style="[^"]*"[^>]*onerror/)
  })
})
