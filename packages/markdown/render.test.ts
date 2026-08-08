import { describe, expect, it } from 'vitest'

import { extractHeadings, renderMarkdown } from './render'

describe('headings', () => {
  it('gives repeated headings unique anchors', () => {
    const html = renderMarkdown('## Usage\n\n## Usage\n\n## Usage')
    expect(html).toContain('id="usage"')
    expect(html).toContain('id="usage-1"')
    expect(html).toContain('id="usage-2"')
  })

  it('does not leak slug counts between renders', () => {
    renderMarkdown('## Usage')
    const html = renderMarkdown('## Usage')
    expect(html).toContain('id="usage"')
    expect(html).not.toContain('id="usage-1"')
  })

  it('extracts a table of contents matching the rendered anchors', () => {
    const source = '# Top\n\n## Usage\n\n## Usage'
    const headings = extractHeadings(source)
    expect(headings).toEqual([
      { depth: 1, text: 'Top', slug: 'top' },
      { depth: 2, text: 'Usage', slug: 'usage' },
      { depth: 2, text: 'Usage', slug: 'usage-1' },
    ])

    const html = renderMarkdown(source)
    for (const heading of headings) {
      expect(html).toContain(`id="${heading.slug}"`)
    }
  })

  it('honours Pandoc-style explicit heading ids and hides the marker', () => {
    const source =
      '## The Foundation: Understanding Basic Web Architecture {#foundation}\n\n' +
      '### Nested Topic {#nested-topic}'
    const html = renderMarkdown(source)

    expect(html).toContain('id="foundation"')
    expect(html).toContain('id="nested-topic"')
    expect(html).toContain('The Foundation: Understanding Basic Web Architecture')
    expect(html).toContain('Nested Topic')
    expect(html).not.toContain('{#foundation}')
    expect(html).not.toContain('{#nested-topic}')

    expect(extractHeadings(source)).toEqual([
      {
        depth: 2,
        text: 'The Foundation: Understanding Basic Web Architecture',
        slug: 'foundation',
      },
      { depth: 3, text: 'Nested Topic', slug: 'nested-topic' },
    ])
  })

  it('still dedupes when the same explicit id is used twice', () => {
    const html = renderMarkdown('## One {#same}\n\n## Two {#same}')
    expect(html).toContain('id="same"')
    expect(html).toContain('id="same-1"')
    expect(html).not.toContain('{#same}')
  })
})

describe('code blocks', () => {
  it('labels the language and carries the source for the copy button', () => {
    const html = renderMarkdown('```python\nprint("hi")\n```')
    expect(html).toContain('language-python')
    expect(html).toContain('md-code-copy')
    expect(html).toContain('data-code="print(&quot;hi&quot;)')
  })

  it('detects an unlabelled mermaid diagram', () => {
    const html = renderMarkdown('```\ngraph TD\n  A --> B\n```')
    expect(html).toContain('md-mermaid')
    expect(html).toContain('md-mermaid-source')
  })

  it('renders diagrams as plain code when mermaid is disabled', () => {
    const html = renderMarkdown('```mermaid\ngraph TD\n  A --> B\n```', {
      mermaid: false,
    })
    expect(html).not.toContain('md-mermaid')
    expect(html).toContain('md-code')
  })
})

describe('lists', () => {
  it('keeps an ordered list ordered inside a bullet list', () => {
    const html = renderMarkdown('- outer\n  1. first\n  2. second')
    // The previous single boolean flag made the inner list render as bullets.
    expect(html).toContain('<ol')
    expect(html).toContain('md-li--ordered')
  })

  it('renders task list items with a checkbox and no decorative bullet', () => {
    const html = renderMarkdown('- [x] done\n- [ ] todo')
    expect(html).toContain('md-task-list')
    expect(html).toContain('md-task-checkbox')
    expect(html).toContain('checked')
    expect(html).not.toContain('md-li-bullet')
  })
})

describe('links', () => {
  it('opens absolute links in a new tab', () => {
    const html = renderMarkdown('[x](https://example.com)')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('keeps in-page anchors in the same tab', () => {
    const html = renderMarkdown('[jump](#usage)')
    expect(html).not.toContain('target="_blank"')
  })
})

describe('image and link URLs', () => {
  it('leaves root-relative post images alone by default', () => {
    const html = renderMarkdown('![cover](/images/blog/post/cover.webp)', {
      githubBaseUrl: 'https://github.com/tashifkhan/Blog',
    })
    expect(html).toContain('src="/images/blog/post/cover.webp"')
    expect(html).not.toContain('raw.githubusercontent')
  })

  it('points root-relative post images at another origin when asked', () => {
    const html = renderMarkdown('![cover](/images/blog/post/cover.webp)', {
      assetBaseUrl: 'https://blog.tashif.codes',
    })
    expect(html).toContain(
      'src="https://blog.tashif.codes/images/blog/post/cover.webp"',
    )
  })

  it('treats root-relative README paths as repository paths', () => {
    const html = renderMarkdown('![logo](/docs/logo.png)', {
      githubBaseUrl: 'https://github.com/tashifkhan/thing',
      rootRelative: 'repo',
    })
    expect(html).toContain(
      'src="https://raw.githubusercontent.com/tashifkhan/thing/HEAD/docs/logo.png"',
    )
  })

  it('resolves relative README paths against raw content', () => {
    const html = renderMarkdown('![logo](./assets/logo.png)', {
      githubBaseUrl: 'https://github.com/tashifkhan/thing',
    })
    expect(html).toContain(
      'src="https://raw.githubusercontent.com/tashifkhan/thing/HEAD/assets/logo.png"',
    )
  })

  it('serves bundled docs images from the site', () => {
    const html = renderMarkdown('![shot](images/shot.png)', {
      githubBaseUrl: 'https://github.com/tashifkhan/thing',
      project: 'jportal',
    })
    expect(html).toContain('src="/docs-assets/jportal/images/shot.png"')
  })

  it('turns file:// links into GitHub blob links', () => {
    const html = renderMarkdown('[src](file://src/main.py)', {
      githubBaseUrl: 'https://github.com/tashifkhan/thing',
    })
    expect(html).toContain(
      'href="https://github.com/tashifkhan/thing/blob/HEAD/src/main.py"',
    )
  })

  it('reports a missing editor asset instead of a broken image', () => {
    const html = renderMarkdown('![cover](asset:cover.webp)', {
      resolveImage: (src) =>
        src.startsWith('asset:') ? { src, missing: true } : { src },
    })
    expect(html).toContain('md-image-missing')
    expect(html).not.toContain('<img')
  })
})

describe('theme classes', () => {
  it('appends host classes alongside the structural ones', () => {
    const html = renderMarkdown('## Hi', {
      theme: { h2: 'text-2xl font-semibold' },
    })
    expect(html).toContain('class="md-heading md-h2 text-2xl font-semibold"')
  })

  it('renders structured HTML with no theme at all', () => {
    const html = renderMarkdown('## Hi')
    expect(html).toContain('class="md-heading md-h2"')
  })
})

describe('tag balance', () => {
  /** Count opening vs closing tags for one element name. */
  const balance = (html: string, tag: string) => ({
    open: html.match(new RegExp(`<${tag}[\\s>]`, 'g'))?.length ?? 0,
    close: html.match(new RegExp(`</${tag}>`, 'g'))?.length ?? 0,
  })

  it('closes every paragraph in a tight list', () => {
    // markdown-it hides these paragraphs and skips their closing tag, so a
    // custom `paragraph_open` rule that ignores `hidden` leaks an open `<p>`.
    const html = renderMarkdown('- one\n- two')
    expect(balance(html, 'p')).toEqual({ open: 0, close: 0 })
    expect(balance(html, 'span').open).toBe(balance(html, 'span').close)
  })

  it('closes every paragraph in a loose list', () => {
    const html = renderMarkdown('- one\n\n- two')
    const paragraphs = balance(html, 'p')
    expect(paragraphs.open).toBe(2)
    expect(paragraphs.open).toBe(paragraphs.close)
  })

  it('balances the tags of a full two-column document', () => {
    const html = renderMarkdown(
      [
        '::::two-col{ratio="2:1"}',
        ':::col',
        '#### Left',
        '',
        '- a',
        '- b',
        '',
        ':::tip Nested',
        'inner',
        ':::',
        ':::',
        ':::col',
        '```python',
        'x = 1',
        '```',
        ':::',
        '::::',
      ].join('\n'),
    )

    const counts = Object.fromEntries(
      ['div', 'p', 'span', 'ul', 'li', 'pre', 'code'].map((tag) => [
        tag,
        balance(html, tag),
      ]),
    )
    for (const [tag, { open, close }] of Object.entries(counts)) {
      expect({ tag, open }).toEqual({ tag, open: close })
    }
  })
})

/**
 * Both sites render the same post bodies, so their option sets have to agree on
 * everything except where the assets are hosted. These are the options each
 * call site passes today:
 *
 *   blog.tashif.codes  src/components/MarkdownRenderer.astro
 *   tashif.codes       src/pages/blog/[slug].astro
 *
 * A relative image, a `file://` link, and a `<cite>` block all need
 * `githubBaseUrl`. It was missing on the portfolio, so those three rendered
 * broken there while working on the blog.
 */
describe('cross-site parity for post bodies', () => {
  const REPO = 'https://github.com/tashifkhan/Blog'
  const BLOG = { githubBaseUrl: REPO, rootRelative: 'site' as const, mermaid: true }
  const PORTFOLIO = {
    githubBaseUrl: REPO,
    rootRelative: 'site' as const,
    assetBaseUrl: 'https://blog.tashif.codes',
    mermaid: true,
  }

  const POST = [
    '# Title', '', 'Text with `code`, **bold**, [a link](https://x.com).', '',
    '- bullet', '', '- [x] task', '', '> [!NOTE]', '> callout', '',
    ':::tip Heads up', 'directive', ':::', '',
    '::::two-col{ratio="2:1"}', ':::col', '### Left', ':::', ':::col', 'right', ':::', '::::', '',
    '| a | b |', '| --- | --- |', '| 1 | 2 |', '',
    '```python', 'x = 1', '```', '', '```mermaid', 'graph TD', '  A --> B', '```', '',
    '![Sized|300](./rel.png)', '', '[src](file://src/main.py)',
  ].join('\n')

  it('produces identical markup apart from the asset origin', () => {
    const blog = renderMarkdown(POST, BLOG)
    const portfolio = renderMarkdown(POST, PORTFOLIO)
    // The portfolio prefixes root-relative assets because they are served by
    // the blog's origin; nothing else may differ.
    expect(portfolio.replaceAll('https://blog.tashif.codes/', '/')).toBe(blog)
  })

  it('resolves relative images against the repository on both sites', () => {
    for (const options of [BLOG, PORTFOLIO]) {
      expect(renderMarkdown('![a](./rel.png)', options)).toContain(
        'https://raw.githubusercontent.com/tashifkhan/Blog/HEAD/rel.png',
      )
    }
  })

  it('renders cite blocks as reference cards on both sites', () => {
    for (const options of [BLOG, PORTFOLIO]) {
      const html = renderMarkdown('<cite>[main.py](file://src/main.py)</cite>', options)
      expect(html).toContain('md-cite')
      expect(html).toContain(`${REPO}/blob/HEAD/src/main.py`)
    }
  })

  it('renders diagrams as diagrams on both sites', () => {
    for (const options of [BLOG, PORTFOLIO]) {
      expect(renderMarkdown('```mermaid\ngraph TD\n```', options)).toContain(
        'md-mermaid',
      )
    }
  })
})
