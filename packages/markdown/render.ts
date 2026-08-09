/**
 * The one Markdown renderer.
 *
 * Blog posts are authored once and rendered in three places — blog.tashif.codes,
 * tashif.codes, and the editor's reading pane. Before this module each of those
 * had its own parser, so the same post produced three different documents and a
 * construct like a callout worked in one of them. Structure and behaviour live
 * here; only class names differ per site, through `MarkdownTheme`.
 *
 * All render state is carried on markdown-it's `env`, so a single parser
 * instance is safe to reuse across concurrent renders.
 */

import MarkdownIt from 'markdown-it'

import { calloutsPlugin } from './callouts'
import {
  COMPONENTS,
  escapeHtml,
  type HeadingEntry,
  type RenderCtx,
  resolveAttrs,
} from './components'
import { type DirectiveInfo, directivesPlugin } from './directives'
import { CHECK_ICON, COPY_ICON, TERMINAL_ICON } from './icons'
import { jsxPlugin } from './jsx'
import { parseImageAlt, sizeAttributes } from './images'
import { taskListsPlugin } from './tasklists'
import { cx, type MarkdownTheme } from './theme'
import {
  convertRelativeUrl,
  postProcessHtml,
  preProcessFileLinks,
  type UrlOptions,
} from './urls'

export type ResolvedImage = { src: string; missing?: boolean }

export type RenderOptions = UrlOptions & {
  theme?: MarkdownTheme
  /**
   * Emit mermaid placeholders for a client script to hydrate. Sites without the
   * mermaid bundle pass `false` and get a normal, readable code block.
   */
  mermaid?: boolean
  /** Rewrite an image source, e.g. the editor's `asset:` draft placeholders. */
  resolveImage?: (src: string) => ResolvedImage
}

type RenderEnv = {
  theme: MarkdownTheme
  urls: UrlOptions
  mermaid: boolean
  resolveImage?: (src: string) => ResolvedImage
  /** Heading slug -> times seen, for GitHub-style `usage`, `usage-1` anchors. */
  slugs: Map<string, number>
  listStack: Array<'ul' | 'ol'>
  itemStack: Array<{ task: boolean }>
  /**
   * Populated only when the document uses a component that reads it, so an
   * ordinary post does not pay for the extra parse a table of contents needs.
   */
  headings: readonly HeadingEntry[]
}

/**
 * Fenced blocks whose body is a diagram even when the info string does not say
 * so — the docs generator emits plenty of unlabelled `graph TD` blocks.
 */
const MERMAID_STARTERS = [
  'graph ',
  'graph\n',
  'flowchart ',
  'flowchart\n',
  'sequencediagram',
  'classdiagram',
  'statediagram',
  'erdiagram',
  'gantt',
  'pie',
  'gitgraph',
  'journey',
  'mindmap',
  'timeline',
  'sankey',
  'quadrantchart',
  'requirementdiagram',
  'c4context',
  'block-beta',
  'xychart-beta',
  'packet-beta',
]

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

/**
 * Pandoc/kramdown explicit heading id: `## Title {#custom-id}`.
 * Strips the marker from the visible title and returns the custom id when set.
 */
const EXPLICIT_HEADING_ID_RE = /\s*\{#([^\s{}]+)\}\s*$/

export function parseExplicitHeadingId(text: string): {
  text: string
  id?: string
} {
  const match = text.match(EXPLICIT_HEADING_ID_RE)
  if (!match || match.index === undefined) return { text }
  return {
    text: text.slice(0, match.index).replace(/\s+$/, ''),
    id: match[1],
  }
}

/**
 * Remove a trailing `{#id}` from an inline heading token so it never renders,
 * and return the custom id when present.
 */
function consumeExplicitHeadingId(inline: {
  content: string
  children?: Array<{ type: string; content: string }> | null
}): string | undefined {
  const match = inline.content.match(EXPLICIT_HEADING_ID_RE)
  if (!match || match.index === undefined) return undefined

  const id = match[1]
  inline.content = inline.content.slice(0, match.index).replace(/\s+$/, '')

  const children = inline.children
  if (!children?.length) return id

  // The marker sits at the end of the heading; nibble it off trailing text
  // tokens so bold/code earlier in the title is left alone.
  let remaining = match[0]
  for (let i = children.length - 1; i >= 0 && remaining.length > 0; i--) {
    const child = children[i]
    if (child.type !== 'text') break

    const text = child.content
    if (remaining.endsWith(text) && text.length > 0) {
      remaining = remaining.slice(0, -text.length)
      children.splice(i, 1)
      continue
    }

    if (text.endsWith(remaining)) {
      child.content = text.slice(0, -remaining.length)
      if (child.content.length === 0) children.splice(i, 1)
      remaining = ''
      break
    }

    const local = text.match(EXPLICIT_HEADING_ID_RE)
    if (local && local.index !== undefined) {
      child.content = text.slice(0, local.index).replace(/\s+$/, '')
      if (child.content.length === 0) children.splice(i, 1)
      remaining = ''
    }
    break
  }

  for (let i = children.length - 1; i >= 0; i--) {
    if (children[i].type !== 'text') break
    children[i].content = children[i].content.replace(/\s+$/, '')
    if (children[i].content.length === 0) children.splice(i, 1)
    else break
  }

  return id
}

/** Resolve the final anchor id for a heading, honouring `{#custom}` when set. */
function resolveHeadingSlug(
  inline: {
    content: string
    children?: Array<{ type: string; content: string }> | null
  },
  slugs: Map<string, number>,
): string {
  const explicit = consumeExplicitHeadingId(inline)
  const base = explicit ?? (slugifyHeading(inline.content) || 'section')
  const seen = slugs.get(base) ?? 0
  slugs.set(base, seen + 1)
  return seen === 0 ? base : `${base}-${seen}`
}

function env(rawEnv: unknown): RenderEnv {
  return rawEnv as RenderEnv
}

/**
 * Does this paragraph hold nothing but images?
 *
 * Whitespace and line breaks between them still count, so two images on
 * consecutive lines are treated as a figure group rather than prose.
 */
function isImageOnlyParagraph(tokens: any[], idx: number): boolean {
  const inline = tokens[idx + 1]
  if (inline?.type !== 'inline') return false

  const children = inline.children ?? []
  if (!children.some((child: any) => child.type === 'image')) return false

  const alone = children.every(
    (child: any) =>
      child.type === 'image' ||
      child.type === 'softbreak' ||
      child.type === 'hardbreak' ||
      (child.type === 'text' && child.content.trim() === ''),
  )
  if (!alone) return false

  // Tag the images so the image rule knows it may emit block-level `<figure>`.
  // An image sitting in a sentence stays a bare `<img>`: a caption under an
  // inline icon reads as nonsense, and `<figure>` inside `<p>` is invalid.
  for (const child of children) {
    if (child.type === 'image') {
      child.meta = { ...(child.meta || {}), figure: true }
    }
  }
  return true
}

function isMermaid(lang: string, code: string): boolean {
  if (lang === 'mermaid') return true
  const lowered = code.trimStart().toLowerCase()
  return MERMAID_STARTERS.some((starter) => lowered.startsWith(starter))
}

/**
 * Build the render context for a component occurrence.
 *
 * Called from both the open and the close rule. `spec.render` is a pure
 * function of this context, so the close rule recomputes rather than reading
 * back state stashed on a token — one less piece of mutable parse state, at the
 * cost of building two short strings instead of one.
 */
function directiveCtx(
  token: any,
  info: DirectiveInfo,
  renderEnv: RenderEnv,
): RenderCtx {
  return {
    attrs: resolveAttrs(info.spec, info.attrs),
    theme: renderEnv.theme,
    headings: renderEnv.headings,
    inline: token.block === false,
  }
}

function createParser(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  })

  md.use(directivesPlugin)
  md.use(jsxPlugin)
  md.use(calloutsPlugin)
  md.use(taskListsPlugin)

  const rules = md.renderer.rules as Record<string, any>

  // ---- components, from either `:::name` or `<Name>` ----
  rules.directive_open = (tokens: any[], idx: number, _opts: any, rawEnv: any) => {
    const info = tokens[idx].meta as DirectiveInfo
    return info.spec.render(directiveCtx(tokens[idx], info, env(rawEnv))).open
  }

  rules.directive_close = (tokens: any[], idx: number, _opts: any, rawEnv: any) => {
    const info = tokens[idx].meta as DirectiveInfo
    return info.spec.render(directiveCtx(tokens[idx], info, env(rawEnv))).close
  }

  // A `body: 'raw'` component's contents, escaped but otherwise untouched.
  rules.component_raw = (tokens: any[], idx: number) =>
    md.utils.escapeHtml(tokens[idx].content)

  // ---- code fences and diagrams ----
  rules.fence = (tokens: any[], idx: number, _opts: any, rawEnv: any) => {
    const { theme, mermaid } = env(rawEnv)
    const lang = tokens[idx].info.trim() || 'text'
    const rawCode = tokens[idx].content
    const escaped = md.utils.escapeHtml(rawCode)

    if (mermaid && isMermaid(lang, rawCode)) {
      // The docs generator emits broken bidirectional arrows.
      const normalized = rawCode.replace(/<-\s+-->/g, '<-->').trim()
      // The source stays in a hidden <pre> and the client reads it back through
      // textContent, so a diagram that fails to parse degrades to its source
      // instead of mermaid's error glyph.
      return `<div class="${cx('md-mermaid', theme.mermaid)}"><pre class="md-mermaid-source" hidden>${md.utils.escapeHtml(normalized)}</pre><div class="${cx('md-mermaid-render', theme.mermaidRender)}"></div></div>`
    }

    return (
      `<div class="${cx('md-code', theme.codeBlock)}">` +
      `<div class="${cx('md-code-bar', theme.codeBar)}">` +
      `<div class="md-code-meta">${TERMINAL_ICON}<span class="${cx('md-code-lang', theme.codeLang)}">${md.utils.escapeHtml(lang)}</span></div>` +
      `<button class="${cx('md-code-copy', theme.codeCopy)}" type="button" aria-label="Copy code" data-haptic data-code="${escaped}">${COPY_ICON}${CHECK_ICON}</button>` +
      `</div>` +
      `<pre class="${cx('md-code-pre', theme.codePre)}"><code class="${cx(`language-${lang}`, theme.codeTag)}">${escaped}</code></pre>` +
      `</div>`
    )
  }

  // ---- headings ----
  rules.heading_open = (tokens: any[], idx: number, _opts: any, rawEnv: any) => {
    const { theme, slugs } = env(rawEnv)
    const tag = tokens[idx].tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    const inline = tokens[idx + 1]

    // Honour Pandoc/kramdown `{#id}` and strip it from the visible title.
    const id = resolveHeadingSlug(inline, slugs)
    // Stash the resolved id so heading_close reuses it rather than recounting.
    inline.meta = { ...(inline.meta || {}), headingSlug: id }

    const themeClass = theme[tag]
    const bar =
      tag === 'h2' || tag === 'h3' || tag === 'h4'
        ? `<span class="${cx(`md-heading-bar md-heading-bar--${tag}`, theme.headingBar)}" aria-hidden="true"></span>`
        : ''
    const heading = `<${tag} id="${id}" class="${cx(`md-heading md-${tag}`, themeClass)}">${bar}`

    if (tag === 'h1' || tag === 'h2') {
      return (
        `<div class="${cx('md-heading-wrap', theme.headingWrap)}">` +
        `<a href="#${id}" class="${cx('md-anchor md-anchor--lead', theme.anchor)}" aria-hidden="true" tabindex="-1">#</a>` +
        heading
      )
    }
    return heading
  }

  rules.heading_close = (tokens: any[], idx: number, _opts: any, rawEnv: any) => {
    const { theme } = env(rawEnv)
    const tag = tokens[idx].tag
    const inline = tokens[idx - 1]
    const id = inline.meta?.headingSlug ?? slugifyHeading(inline.content)
    const link = `<a href="#${id}" class="${cx('md-anchor md-anchor--trail', theme.anchorTrailing)}" aria-label="Permalink">#</a>`
    return tag === 'h1' || tag === 'h2'
      ? `${link}</${tag}></div>`
      : `${link}</${tag}>`
  }

  // ---- text-level blocks ----
  rules.paragraph_open = (tokens: any[], idx: number, _opts: any, rawEnv: any) => {
    // markdown-it marks paragraphs in a tight list as hidden and relies on
    // `renderToken` to skip them. A custom rule is called regardless, so
    // without this check the opening tag is emitted while `paragraph_close`
    // still skips, leaving every tight list item with an unclosed `<p>`.
    if (tokens[idx].hidden) return ''

    // markdown-it wraps a standalone image in a paragraph, but this renderer
    // emits a `<figure>` for it, and `<figure>` is not allowed inside `<p>`.
    // The browser would silently close the paragraph early, stranding an empty
    // `<p></p>` before every captioned image. Drop the wrapper instead.
    if (isImageOnlyParagraph(tokens, idx)) {
      tokens[idx].meta = { ...(tokens[idx].meta || {}), imageOnly: true }
      return ''
    }

    const { theme, itemStack } = env(rawEnv)
    return itemStack.length > 0
      ? `<p class="${cx('md-p md-p--tight', theme.paragraphTight)}">`
      : `<p class="${cx('md-p', theme.paragraph)}">`
  }

  rules.paragraph_close = (tokens: any[], idx: number) => {
    if (tokens[idx].hidden) return ''
    // open, inline, close — so the matching open sits two tokens back.
    const open = tokens[idx - 2]
    if (open?.type === 'paragraph_open' && open.meta?.imageOnly) return ''
    return '</p>'
  }

  rules.code_inline = (tokens: any[], idx: number, _opts: any, rawEnv: any) =>
    `<code class="${cx('md-code-inline', env(rawEnv).theme.codeInline)}">${md.utils.escapeHtml(tokens[idx].content)}</code>`

  rules.blockquote_open = (_tokens: any[], _idx: number, _opts: any, rawEnv: any) =>
    `<blockquote class="${cx('md-quote', env(rawEnv).theme.quote)}">`

  rules.strong_open = (_tokens: any[], _idx: number, _opts: any, rawEnv: any) =>
    `<strong class="${cx('md-strong', env(rawEnv).theme.strong)}">`

  rules.em_open = (_tokens: any[], _idx: number, _opts: any, rawEnv: any) =>
    `<em class="${cx('md-em', env(rawEnv).theme.em)}">`

  rules.hr = (_tokens: any[], _idx: number, _opts: any, rawEnv: any) =>
    `<hr class="${cx('md-hr', env(rawEnv).theme.hr)}" />`

  // ---- tables ----
  rules.table_open = (_tokens: any[], _idx: number, _opts: any, rawEnv: any) => {
    const { theme } = env(rawEnv)
    return `<div class="${cx('md-table-wrap', theme.tableWrap)}"><table class="${cx('md-table', theme.table)}">`
  }
  rules.table_close = () => '</table></div>'
  rules.thead_open = (_t: any[], _i: number, _o: any, rawEnv: any) =>
    `<thead class="${cx('md-thead', env(rawEnv).theme.thead)}">`
  rules.th_open = (_t: any[], _i: number, _o: any, rawEnv: any) =>
    `<th class="${cx('md-th', env(rawEnv).theme.th)}">`
  rules.td_open = (_t: any[], _i: number, _o: any, rawEnv: any) =>
    `<td class="${cx('md-td', env(rawEnv).theme.td)}">`
  rules.tr_open = (_t: any[], _i: number, _o: any, rawEnv: any) =>
    `<tr class="${cx('md-tr', env(rawEnv).theme.tr)}">`

  // ---- lists ----
  // A stack rather than a boolean: nested lists mix types, and the previous
  // single flag made an ordered list inside a bullet list render as bullets.
  rules.bullet_list_open = (tokens: any[], idx: number, _o: any, rawEnv: any) => {
    const { theme, listStack } = env(rawEnv)
    listStack.push('ul')
    const extra = tokens[idx].attrGet('class')
    return `<ul class="${cx('md-ul', [theme.bulletList, extra].filter(Boolean).join(' '))}">`
  }
  rules.bullet_list_close = (_t: any[], _i: number, _o: any, rawEnv: any) => {
    env(rawEnv).listStack.pop()
    return '</ul>'
  }
  rules.ordered_list_open = (tokens: any[], idx: number, _o: any, rawEnv: any) => {
    const { theme, listStack } = env(rawEnv)
    listStack.push('ol')
    const start = tokens[idx].attrGet('start')
    const startAttr = start && start !== '1' ? ` start="${start}"` : ''
    const extra = tokens[idx].attrGet('class')
    return `<ol class="${cx('md-ol', [theme.orderedList, extra].filter(Boolean).join(' '))}"${startAttr}>`
  }
  rules.ordered_list_close = (_t: any[], _i: number, _o: any, rawEnv: any) => {
    env(rawEnv).listStack.pop()
    return '</ol>'
  }

  rules.list_item_open = (tokens: any[], idx: number, _o: any, rawEnv: any) => {
    const { theme, listStack, itemStack } = env(rawEnv)
    const classes = tokens[idx].attrGet('class') ?? ''
    const task = classes.includes('md-task-item')
    itemStack.push({ task })

    const ordered = listStack[listStack.length - 1] === 'ol'
    const li = `<li class="${cx(['md-li', task ? 'md-li--task' : '', ordered ? 'md-li--ordered' : ''].filter(Boolean).join(' '), theme.listItem)}">`

    // A task item already has a checkbox marker, and an ordered item has its
    // number, so neither gets the decorative bullet.
    if (ordered || task) return li
    return (
      li +
      `<span class="${cx('md-li-bullet', theme.listItemBullet)}" aria-hidden="true"></span>` +
      `<span class="${cx('md-li-body', theme.listItemBody)}">`
    )
  }

  rules.list_item_close = (_t: any[], _i: number, _o: any, rawEnv: any) => {
    const { listStack, itemStack } = env(rawEnv)
    const item = itemStack.pop()
    const ordered = listStack[listStack.length - 1] === 'ol'
    return ordered || item?.task ? '</li>' : '</span></li>'
  }

  // ---- images and links ----
  rules.image = (tokens: any[], idx: number, _o: any, rawEnv: any) => {
    const { theme, urls, resolveImage } = env(rawEnv)
    const token = tokens[idx]
    const rawSrc = token.attrGet('src') || ''
    const parsed = parseImageAlt(token.content || '')
    const alt = parsed.alt

    const resolved = resolveImage?.(rawSrc)
    if (resolved?.missing) {
      return `<span class="md-image-missing">${md.utils.escapeHtml(alt || rawSrc)}</span>`
    }

    const src = convertRelativeUrl(resolved?.src ?? rawSrc, urls)
    const asFigure = token.meta?.figure === true
    const image =
      `<img src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(alt)}"` +
      `${sizeAttributes(parsed)} loading="lazy" decoding="async" ` +
      `class="${cx(asFigure ? 'md-image' : 'md-image md-image--inline', theme.image)}" />`

    if (!asFigure) return image

    const caption = alt
      ? `<figcaption class="md-image-caption">${md.utils.escapeHtml(alt)}</figcaption>`
      : ''
    return `<figure class="${cx('md-figure', theme.imageWrap)}">${image}${caption}</figure>`
  }

  rules.link_open = (
    tokens: any[],
    idx: number,
    opts: any,
    rawEnv: any,
    self: any,
  ) => {
    const { theme, urls } = env(rawEnv)
    const token = tokens[idx]
    const href = convertRelativeUrl(token.attrGet('href') || '', urls)
    token.attrSet('href', href)

    // Only absolute links leave the site. The blog previously sent in-page
    // anchors to a new tab as well, which broke its table of contents.
    if (/^https?:\/\//i.test(href)) {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
    }

    const existing = token.attrGet('class')
    token.attrSet('class', cx('md-link', [theme.link, existing].filter(Boolean).join(' ')))
    return self.renderToken(tokens, idx, opts)
  }

  return md
}

// One parser for the process. Every mutable render value lives on `env`.
let parser: MarkdownIt | null = null

function getParser(): MarkdownIt {
  if (!parser) parser = createParser()
  return parser
}

/** Render Markdown to an HTML string. */
export function renderMarkdown(
  content: string,
  options: RenderOptions = {},
): string {
  if (!content) return ''

  const {
    theme = {},
    mermaid = true,
    resolveImage,
    ...urls
  } = options

  const renderEnv: RenderEnv = {
    theme,
    urls,
    mermaid,
    resolveImage,
    slugs: new Map(),
    listStack: [],
    itemStack: [],
    headings: needsHeadings(content) ? extractHeadings(content) : [],
  }

  const source = preProcessFileLinks(content, urls.githubBaseUrl)
  const html = getParser().render(source, renderEnv)
  return postProcessHtml(html, urls, theme)
}

/**
 * Do any of the components in this source read `ctx.headings`?
 *
 * Cheap string test rather than a parse: getting a false positive costs one
 * extra parse of a document that was about to be parsed anyway, and there is no
 * false negative as long as a heading-reading component names itself in its own
 * tag, which every spelling of it does.
 */
function needsHeadings(source: string): boolean {
  for (const spec of COMPONENTS) {
    if (!spec.needsHeadings) continue
    if (
      source.includes(`<${spec.name}`) ||
      source.includes(`:::${spec.directive}`)
    ) {
      return true
    }
  }
  return false
}

/** Resolve Markdown backslash escapes, which only ever precede punctuation. */
function unescapeMarkdown(text: string): string {
  return text.replace(/\\([!-/:-@[-`{-~])/g, '$1')
}

/** Heading anchors for a table of contents, in document order. */
export function extractHeadings(
  content: string,
): Array<{ depth: number; text: string; slug: string }> {
  const md = getParser()
  const tokens = md.parse(content, {
    theme: {},
    urls: {},
    mermaid: false,
    slugs: new Map(),
    listStack: [],
    itemStack: [],
    headings: [],
  } satisfies RenderEnv)

  const slugs = new Map<string, number>()
  const headings: Array<{ depth: number; text: string; slug: string }> = []

  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].type !== 'heading_open') continue
    const raw = tokens[index + 1]?.content ?? ''
    const { text, id: explicit } = parseExplicitHeadingId(raw)
    // The inline token carries the heading's *source*, so a backslash-escaped
    // character is still escaped here while the rendered heading shows the
    // character itself. Without this a `\*` in a title reaches a table of
    // contents as a stray backslash.
    const plain = unescapeMarkdown(text)
    const base = explicit ?? (slugifyHeading(plain) || 'section')
    const seen = slugs.get(base) ?? 0
    slugs.set(base, seen + 1)
    headings.push({
      depth: Number(tokens[index].tag.slice(1)),
      text: plain,
      slug: seen === 0 ? base : `${base}-${seen}`,
    })
  }

  return headings
}
