/**
 * Browser-side behaviour for rendered Markdown: copy buttons and diagrams.
 *
 * `mermaid` is passed in rather than imported so a site that has no diagrams —
 * the blog posts have none — does not pull the bundle into its client build.
 */

export type MermaidLike = {
  initialize: (config: Record<string, unknown>) => void
  render: (id: string, source: string) => Promise<{ svg: string }>
}

let copyDelegateInstalled = false

async function writeToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // Falls through: insecure contexts and older Safari reject the async API.
  }

  const fallback = document.createElement('textarea')
  fallback.value = text
  fallback.style.position = 'fixed'
  fallback.style.opacity = '0'
  document.body.appendChild(fallback)
  fallback.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(fallback)
  }
}

/**
 * Install the copy-button handler.
 *
 * One delegated listener on the document rather than a listener per button:
 * the blog renders posts inside a `client:only` React island, so the buttons do
 * not exist yet when this module first runs, and the portfolio swaps the whole
 * article on view transitions. Delegation covers both without re-binding, and
 * the guard keeps repeat calls from stacking handlers.
 */
export function initCopyButtons(): void {
  if (copyDelegateInstalled) return
  copyDelegateInstalled = true

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest<HTMLButtonElement>('.md-code-copy')
    if (!button) return

    const encoded = button.getAttribute('data-code')
    if (!encoded) return

    // `data-code` holds HTML-escaped source; decode it through the parser
    // rather than a hand-rolled entity table.
    const decoder = document.createElement('textarea')
    decoder.innerHTML = encoded

    void writeToClipboard(decoder.value).then(() => {
      button.dataset.copied = 'true'
      window.setTimeout(() => {
        delete button.dataset.copied
      }, 2000)
    })
  })
}

let tabsDelegateInstalled = false
let tabSequence = 0

/** The panels of one `<Tabs>` group, in document order. */
function tabPanels(group: Element): HTMLElement[] {
  return Array.from(group.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains('md-tab'),
  )
}

function selectTab(group: HTMLElement, index: number): void {
  const panels = tabPanels(group)
  const buttons = group.querySelectorAll<HTMLButtonElement>('.md-tab-button')

  panels.forEach((panel, position) => {
    panel.hidden = position !== index
  })
  buttons.forEach((button, position) => {
    const selected = position === index
    button.setAttribute('aria-selected', String(selected))
    // Roving tabindex: only the selected tab is a tab stop, so Tab moves past
    // the strip rather than through every label in it.
    button.tabIndex = selected ? 0 : -1
  })
}

/**
 * Build the tab strip for every `<Tabs>` group under `root`.
 *
 * The strip is generated here rather than rendered server-side because a
 * component's `render` sees only its own attributes, and the buttons have to
 * carry the titles of siblings that have not been rendered yet. Building it
 * client-side also means the no-JS fallback is the honest one: every panel
 * visible under its own heading, which reads as a document rather than as a
 * widget that failed to load.
 *
 * Groups are marked once built, so this is safe to call repeatedly alongside
 * `watchForContent`.
 */
export function initTabs(root: ParentNode = document): void {
  const groups = root.querySelectorAll<HTMLElement>(
    '[data-md-tabs]:not([data-md-tabs-ready])',
  )

  for (const group of groups) {
    const panels = tabPanels(group)
    if (!panels.length) continue

    const groupId = `md-tabs-${++tabSequence}`
    const strip = document.createElement('div')
    strip.className = 'md-tab-strip'
    strip.setAttribute('role', 'tablist')

    panels.forEach((panel, index) => {
      const title = panel.dataset.mdTabTitle ?? `Tab ${index + 1}`
      const panelId = `${groupId}-panel-${index}`
      const buttonId = `${groupId}-tab-${index}`

      panel.id = panelId
      panel.setAttribute('role', 'tabpanel')
      panel.setAttribute('aria-labelledby', buttonId)

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'md-tab-button'
      button.id = buttonId
      button.textContent = title
      button.setAttribute('role', 'tab')
      button.setAttribute('aria-controls', panelId)
      strip.appendChild(button)
    })

    group.prepend(strip)
    group.dataset.mdTabsReady = 'true'
    selectTab(group, 0)
  }

  if (tabsDelegateInstalled) return
  tabsDelegateInstalled = true

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest<HTMLButtonElement>('.md-tab-button')
    const group = button?.closest<HTMLElement>('[data-md-tabs]')
    if (!button || !group) return

    const buttons = Array.from(group.querySelectorAll('.md-tab-button'))
    selectTab(group, buttons.indexOf(button))
  })

  // Left/right to move between tabs, Home/End to jump to the ends, as the
  // WAI-ARIA tabs pattern expects.
  document.addEventListener('keydown', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest<HTMLButtonElement>('.md-tab-button')
    const group = button?.closest<HTMLElement>('[data-md-tabs]')
    if (!button || !group) return

    const buttons = Array.from(
      group.querySelectorAll<HTMLButtonElement>('.md-tab-button'),
    )
    const current = buttons.indexOf(button)
    const last = buttons.length - 1

    let next = current
    if (event.key === 'ArrowRight') next = current === last ? 0 : current + 1
    else if (event.key === 'ArrowLeft') next = current === 0 ? last : current - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else return

    event.preventDefault()
    selectTab(group, next)
    buttons[next].focus()
  })
}

export const MERMAID_DARK: Record<string, unknown> = {
  darkMode: true,
  background: '#0d0e15',
  mainBkg: '#11131c',
  primaryColor: '#11131c',
  primaryTextColor: '#dce1ec',
  primaryBorderColor: '#2a2f42',
  nodeTextColor: '#dce1ec',
  lineColor: '#6c7590',
  secondaryColor: '#1a1d2a',
  tertiaryColor: '#151827',
  clusterBkg: '#0b0c12',
  clusterBorder: '#1a1d2a',
  edgeLabelBackground: '#11131c',
  noteBkgColor: '#1a1d2a',
  noteTextColor: '#dce1ec',
  noteBorderColor: '#2a2f42',
  defaultLinkColor: '#6c7590',
  fontFamily: "var(--font-sans, 'Lexend', sans-serif)",
}

export const MERMAID_LIGHT: Record<string, unknown> = {
  darkMode: false,
  background: '#ffffff',
  mainBkg: '#f8fafc',
  primaryColor: '#f1f5f9',
  primaryTextColor: '#1e293b',
  primaryBorderColor: '#cbd5e1',
  nodeTextColor: '#1e293b',
  lineColor: '#64748b',
  secondaryColor: '#e2e8f0',
  tertiaryColor: '#f8fafc',
  clusterBkg: '#f8fafc',
  clusterBorder: '#e2e8f0',
  edgeLabelBackground: '#ffffff',
  noteBkgColor: '#fff7ed',
  noteTextColor: '#7c2d12',
  noteBorderColor: '#fed7aa',
  defaultLinkColor: '#64748b',
  fontFamily: "var(--font-sans, 'Lexend', sans-serif)",
}

const WARN_ICON =
  '<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>'

let diagramSequence = 0

export function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark')
}

/**
 * Record the diagram's own width on the wrapper as `--md-diagram-width`.
 *
 * `useMaxWidth` makes mermaid scale an SVG down to whatever box it lands in,
 * which reads fine in an article column and turns into unreadable four-pixel
 * type on a phone. Stylesheets use this custom property to hold the diagram at
 * its natural size on narrow screens and scroll it instead.
 */
function publishDiagramWidth(target: HTMLElement): void {
  const svg = target.querySelector('svg')
  const width = svg?.viewBox?.baseVal?.width
  if (!width) return
  target.style.setProperty('--md-diagram-width', `${Math.round(width)}px`)
}

/**
 * Render every `.md-mermaid` block under `root`.
 *
 * Blocks are marked once drawn so this is safe to call repeatedly — the blog
 * watches for content appearing inside a React island and would otherwise
 * redraw every diagram on each mutation. Pass `force` when the theme flips and
 * the diagrams genuinely need regenerating.
 */
export async function renderMermaidBlocks(
  mermaid: MermaidLike,
  options: { dark?: boolean; root?: ParentNode; force?: boolean } = {},
): Promise<void> {
  const root = options.root ?? document
  const selector = options.force
    ? '.md-mermaid'
    : '.md-mermaid:not([data-md-diagram])'
  const blocks = root.querySelectorAll<HTMLElement>(selector)
  if (!blocks.length) return

  const dark = options.dark ?? isDarkTheme()

  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: dark ? MERMAID_DARK : MERMAID_LIGHT,
    sequence: { useMaxWidth: false, diagramMarginX: 16, diagramMarginY: 16 },
    // Keep subgraph titles under ~22 characters. mermaid hard-caps a cluster
    // label at 200px and lays the cluster out as if the title were one line, so
    // a title that wraps prints straight over the first node inside it — and
    // neither `wrappingWidth` nor `subGraphTitleMargin` moves that box.
    flowchart: { useMaxWidth: true },
    er: { useMaxWidth: true, diagramPadding: 20 },
  })

  for (const block of blocks) {
    const source = block
      .querySelector('.md-mermaid-source')
      ?.textContent?.trim()
    const target = block.querySelector<HTMLElement>('.md-mermaid-render')
    if (!source || !target) continue

    const id = `md-mermaid-${++diagramSequence}`
    block.dataset.mdDiagram = 'done'
    try {
      const { svg } = await mermaid.render(id, source)
      target.innerHTML = svg
      publishDiagramWidth(target)
    } catch {
      // mermaid leaves orphaned nodes behind when a parse fails.
      document.getElementById(id)?.remove()
      document.getElementById(`d${id}`)?.remove()

      target.innerHTML = `<div class="md-mermaid-fallback">${WARN_ICON}<span>Diagram preview unavailable — showing source</span></div><pre class="md-code-pre"><code></code></pre>`
      const code = target.querySelector('code')
      if (code) code.textContent = source
    }
  }
}

/**
 * Run `draw` once now, then again whenever new content appears.
 *
 * The blog renders posts inside a `client:only` React island, so the markup
 * does not exist yet when this module first runs and neither `DOMContentLoaded`
 * nor a one-shot call would find anything. Watching the document covers that
 * without the caller having to know how the page is hydrated.
 */
export function watchForContent(draw: () => void): () => void {
  draw()

  let queued = false
  const observer = new MutationObserver(() => {
    if (queued) return
    queued = true
    // Coalesce the burst of mutations a framework emits while mounting.
    window.requestAnimationFrame(() => {
      queued = false
      draw()
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

/**
 * Call `onChange` when the document's light/dark class flips, so diagrams can be
 * re-rendered with matching theme variables.
 */
export function watchThemeChanges(onChange: (dark: boolean) => void): () => void {
  let last = isDarkTheme()
  const observer = new MutationObserver(() => {
    const dark = isDarkTheme()
    if (dark === last) return
    last = dark
    onChange(dark)
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

/**
 * Upgrade YouTube video links from their id to the video's title.
 *
 * A `yt:ID`, `youtu.be/ID` or `youtube.com/watch?v=ID` link renders with the
 * id as its label; this swaps that text for the title from YouTube's oEmbed
 * endpoint, which needs no API key. The brand icon and href are left alone, and
 * a failed fetch (offline, blocked) keeps the id as the fallback.
 */
export async function initYtTitles(root: ParentNode = document): Promise<void> {
  const links = [
    ...root.querySelectorAll<HTMLAnchorElement>('a[data-md-yt]'),
  ]
  if (!links.length) return

  const titles = new Map<string, string>()
  await Promise.all(
    [...new Set(links.map((link) => link.dataset.mdYt || '').filter(Boolean))].map(
      async (id) => {
        try {
          const res = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
          )
          if (!res.ok) return
          const data = await res.json()
          if (typeof data.title === 'string' && data.title.trim()) {
            titles.set(id, data.title.trim())
          }
        } catch {
          // Offline or blocked — keep the id label.
        }
      },
    ),
  )

  for (const link of links) {
    const title = titles.get(link.dataset.mdYt || '')
    if (!title) continue
    const text = [...link.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE,
    )
    if (text) text.textContent = title
  }
}
