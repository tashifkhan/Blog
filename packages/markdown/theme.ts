/**
 * Per-site class names.
 *
 * Every element the renderer emits carries a stable structural class (`md-h2`,
 * `md-code`, `md-two-col`, …) that `markdown.css` keys off, plus whatever extra
 * classes the host site supplies here. That split is what lets one renderer
 * serve two sites with different design systems: the portfolio passes Tailwind
 * utilities and the blog passes nothing, styling `md-*` from its runtime theme
 * variables instead.
 *
 * Every key is optional. An empty theme renders valid, fully structured HTML.
 */
export type MarkdownTheme = {
  h1?: string
  h2?: string
  h3?: string
  h4?: string
  h5?: string
  h6?: string
  /** Wrapper around h1/h2 that hosts the hover anchor. */
  headingWrap?: string
  anchor?: string
  anchorTrailing?: string
  /** Accent bar rendered before h2/h3/h4 text. */
  headingBar?: string

  paragraph?: string
  /** Paragraphs inside a list item, which must not carry block margins. */
  paragraphTight?: string
  strong?: string
  em?: string
  hr?: string
  link?: string

  codeInline?: string
  codeBlock?: string
  codeBar?: string
  codeLang?: string
  codeCopy?: string
  codePre?: string
  codeTag?: string

  mermaid?: string
  mermaidRender?: string

  quote?: string
  callout?: string
  calloutTitle?: string

  twoCol?: string
  col?: string

  // Layout
  panel?: string
  inkBand?: string
  strips?: string

  // Document structure
  toc?: string
  steps?: string
  step?: string
  phases?: string
  phase?: string
  checklist?: string
  lede?: string

  // Data
  meters?: string
  meter?: string
  kpi?: string
  stat?: string
  bars?: string
  bar?: string
  legend?: string

  // Marginalia
  sticker?: string
  hand?: string
  tape?: string
  mark?: string

  // Media
  ascii?: string
  embed?: string

  // Interaction
  tabs?: string
  tab?: string
  details?: string

  tableWrap?: string
  table?: string
  thead?: string
  th?: string
  td?: string
  tr?: string

  bulletList?: string
  orderedList?: string
  listItem?: string
  listItemBullet?: string
  listItemBody?: string

  imageWrap?: string
  image?: string

  citeCard?: string
  citeHeading?: string
  citeBody?: string
  citeLink?: string
}

export const EMPTY_THEME: MarkdownTheme = {}

/** Join a structural class with the theme's extra classes for that slot. */
export function cx(structural: string, extra?: string): string {
  return extra ? `${structural} ${extra}` : structural
}
