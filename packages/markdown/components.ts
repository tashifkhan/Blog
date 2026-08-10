/**
 * The component registry.
 *
 * One declarative table describing every component an author can reach, shared
 * by four consumers that would otherwise each hold their own copy of the rules:
 *
 *   - `directives.ts` — resolves `:::name` against it
 *   - `jsx.ts`        — resolves `<Name>` against it
 *   - `render.ts`     — dispatches `directive_open` through `render`
 *   - `validate.ts`   — walks `attrs` / `parents` / `children` to lint a draft
 *
 * Adding a component means adding one entry here. Nothing else has to learn
 * about it, and the editor's insert palette picks it up for free.
 *
 * This module must stay free of any markdown-it dependency: the editor's
 * publish route imports the validator server-side and must not pull in a
 * parser to do it.
 */

import { CALLOUT_ICONS, getIcon, ICON_NAMES, isIconName } from './icons'
import { cx, type MarkdownTheme } from './theme'

export { ICON_NAMES, isIconName, getIcon } from './icons'

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char])
}

export type AttrSpec = {
  type: 'string' | 'number' | 'boolean' | 'enum'
  /** Permitted values, for `type: 'enum'`. */
  values?: readonly string[]
  default?: string | number | boolean
  required?: boolean
  /** Shown in the editor palette and in validation messages. */
  describe?: string
}

export type AttrValues = Record<string, string | number | boolean | undefined>

export type HeadingEntry = { depth: number; text: string; slug: string }

export type RenderCtx = {
  /** Attributes after coercion, defaults applied. */
  attrs: AttrValues
  theme: MarkdownTheme
  /**
   * Headings of the document being rendered. Only populated when the source
   * actually uses a component that asks for them, so the common case does not
   * pay for a second parse.
   */
  headings: readonly HeadingEntry[]
  /**
   * True when this occurrence sits inside a paragraph. Components allowed in
   * both positions use it to pick an inline or a block element, since a `span`
   * cannot hold paragraphs and a `div` inside a `<p>` is invalid.
   */
  inline: boolean
}

export type ComponentSpec = {
  /** PascalCase tag name: `<Steps>`. */
  name: string
  /** Kebab-case directive name: `:::steps`. */
  directive: string
  /** Additional directive spellings kept working for already-published posts. */
  aliases?: readonly string[]
  /**
   * `block` — body is re-tokenized as Markdown
   * `raw`   — body is captured verbatim, for content Markdown would mangle
   * `none`  — no body; the tag is self-closing
   */
  body: 'block' | 'raw' | 'none'
  /**
   * Where the tag may appear. `block` components are claimed only on a line of
   * their own; `inline` ones only inside a paragraph. Defaults to `block`.
   */
  placement?: 'block' | 'inline' | 'both'
  attrs: Record<string, AttrSpec>
  /** Attribute a bare value maps to, so `:::note Heads up` needs no braces. */
  positional?: string
  /** Component must sit directly inside one of these (by `name`). */
  parents?: readonly string[]
  /** Direct-child requirement, enforced by the validator. */
  children?: { name: string; min?: number; max?: number }
  /** Set when `render` reads `ctx.headings`, so the renderer knows to fill it. */
  needsHeadings?: boolean
  /** One-line description for the editor palette. */
  describe: string
  render: (ctx: RenderCtx) => { open: string; close: string }
}

// ---------------------------------------------------------------------------
// Shared attribute shapes
// ---------------------------------------------------------------------------

/**
 * Track templates for `Cols`.
 *
 * Equal-column layouts are also available via the `cols` number attribute
 * (`cols={3}` → three equal tracks). Prefer `cols` when the tracks match; use
 * `ratio` when they should not.
 */
export const COLUMN_RATIOS = {
  '1:1': '1fr 1fr',
  '2:1': '2fr 1fr',
  '1:2': '1fr 2fr',
  '1:1:1': '1fr 1fr 1fr',
  '2:1:1': '2fr 1fr 1fr',
  '1:2:1': '1fr 2fr 1fr',
  '1:1:2': '1fr 1fr 2fr',
  '3:1:1': '3fr 1fr 1fr',
  '1:1:1:1': '1fr 1fr 1fr 1fr',
  '2:1:1:1': '2fr 1fr 1fr 1fr',
  '1:1:1:2': '1fr 1fr 1fr 2fr',
} as const

export type ColumnRatio = keyof typeof COLUMN_RATIOS

/** Shared optional Lucide-style icon attribute used by several components. */
const ICON_ATTR: Record<string, AttrSpec> = {
  icon: {
    type: 'string',
    describe: `Lucide-style icon name (e.g. arrow-up-right, languages, zap). Known: ${ICON_NAMES.slice(0, 8).join(', ')}, …`,
  },
}

export const CALLOUT_NAMES = [
  'note',
  'tip',
  'important',
  'warning',
  'caution',
  'danger',
] as const

export type CalloutName = (typeof CALLOUT_NAMES)[number]

const CALLOUT_LABELS: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
  danger: 'Danger',
}

const TITLE_ATTR: Record<string, AttrSpec> = {
  title: { type: 'string', describe: 'Heading shown in the callout bar' },
}

/** Accent names components may tint themselves with, from the site's tokens. */
export const TONES = ['accent', 'alt', 'ok', 'warn', 'danger', 'muted'] as const

/** Degrees of rotation a decorative component may ask for. */
const MAX_ROTATE = 15

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Read a numeric attribute.
 *
 * `resolveAttrs` has already coerced and defaulted it, so the only job left is
 * to survive a non-number. Written as an explicit check rather than `Number(x)
 * || fallback`, which would quietly discard a deliberate `0` — `max={0}` is a
 * typo worth rendering as an empty bar, not silently as `max={100}`.
 */
function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** A `style="--name: value"` fragment, or nothing when the value is absent. */
function styleVars(vars: Record<string, string | number | undefined>): string {
  const parts = Object.entries(vars)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([name, value]) => `${name}: ${value}`)
  return parts.length ? ` style="${escapeHtml(parts.join('; '))}"` : ''
}

function attrText(value: unknown): string {
  return value === undefined ? '' : escapeHtml(String(value))
}

/**
 * Rotation, as a custom property.
 *
 * Kept opt-in per site: `markdown.css` multiplies it by `--md-rotate`, which
 * defaults to `0`, so the zine tilt is available without being imposed on a
 * design system that does not want it.
 */
function rotateVar(value: unknown): Record<string, string | undefined> {
  const degrees = typeof value === 'number' ? clamp(value, -MAX_ROTATE, MAX_ROTATE) : 0
  return degrees ? { '--md-rotate-local': `${degrees}deg` } : {}
}

/** A callout entry, built the same way six times. */
function calloutSpec(name: CalloutName): ComponentSpec {
  const pascal = name[0].toUpperCase() + name.slice(1)
  return {
    name: pascal,
    directive: name,
    body: 'block',
    attrs: TITLE_ATTR,
    positional: 'title',
    describe: `${CALLOUT_LABELS[name]} callout`,
    render: ({ attrs, theme }) => {
      const label = String(attrs.title || CALLOUT_LABELS[name])
      const icon = CALLOUT_ICONS[name] ?? CALLOUT_ICONS.note
      return {
        open:
          `<div class="${cx(`md-callout md-callout--${name}`, theme.callout)}">` +
          `<div class="${cx('md-callout-title', theme.calloutTitle)}">${icon}<span>${escapeHtml(label)}</span></div>` +
          `<div class="md-callout-body">`,
        // Two wrappers: the title must not inherit the body's typography.
        close: '</div></div>',
      }
    },
  }
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

export const COMPONENTS: readonly ComponentSpec[] = [
  {
    name: 'Cols',
    directive: 'cols',
    aliases: ['two-col'],
    body: 'block',
    attrs: {
      cols: {
        type: 'number',
        default: 2,
        describe: 'Equal columns, 2 to 4 (ignored when ratio is set)',
      },
      ratio: {
        type: 'enum',
        values: Object.keys(COLUMN_RATIOS),
        describe: 'Relative track widths; overrides equal cols when set. Positional: ::::cols 2:1',
      },
    },
    // Positional stays `ratio` so published posts (`::::cols 2:1`) keep working.
    // Equal multi-column layouts use the explicit attribute: `<Cols cols={3}>`.
    positional: 'ratio',
    children: { name: 'Col', min: 2, max: 4 },
    describe: 'Responsive multi-column grid (2–4 cols) that stacks on narrow containers',
    render: ({ attrs, theme }) => {
      // Prefer an explicit ratio; otherwise build equal tracks from `cols`.
      const ratioKey = attrs.ratio !== undefined ? String(attrs.ratio) : ''
      const fromRatio = (COLUMN_RATIOS as Record<string, string>)[ratioKey]
      const equalCount = clamp(num(attrs.cols, 2), 2, 4)
      const columns =
        fromRatio ?? Array.from({ length: equalCount }, () => '1fr').join(' ')
      // The tracks arrive as a custom property so the single-column fallback
      // and its breakpoint can live in CSS, where a container query is usable.
      // `md-two-col` is kept as a class alias so existing host themes still match.
      return {
        open: `<div class="${cx('md-cols md-two-col', theme.twoCol)}" style="--md-grid-cols: ${columns}">`,
        close: '</div>',
      }
    },
  },
  {
    name: 'Col',
    directive: 'col',
    body: 'block',
    attrs: {},
    parents: ['Cols'],
    describe: 'One column inside Cols',
    render: ({ theme }) => ({
      open: `<div class="${cx('md-col', theme.col)}">`,
      close: '</div>',
    }),
  },
  ...CALLOUT_NAMES.map(calloutSpec),

  // ---- layout -------------------------------------------------------------
  {
    name: 'Panel',
    directive: 'panel',
    body: 'block',
    attrs: {
      title: { type: 'string', describe: 'Optional heading above the body' },
      ...ICON_ATTR,
      tape: { type: 'boolean', describe: 'Draw a strip of masking tape on top' },
      tilt: { type: 'number', describe: 'Rotation in degrees, -15 to 15' },
      tone: { type: 'enum', values: TONES, describe: 'Accent colour' },
    },
    positional: 'title',
    describe: 'Bordered card, optionally with a Lucide icon, taped and tilted',
    render: ({ attrs, theme }) => {
      const tone = attrs.tone ? ` md-panel--${attrs.tone}` : ''
      const tape = attrs.tape
        ? `<span class="md-tape" aria-hidden="true"></span>`
        : ''
      const icon = getIcon(attrs.icon ? String(attrs.icon) : '', {
        size: 22,
        className: 'md-icon md-panel-icon-svg',
      })
      const iconHtml = icon
        ? `<div class="md-panel-icon" aria-hidden="true">${icon}</div>`
        : ''
      const title = attrs.title
        ? `<div class="md-panel-title">${attrText(attrs.title)}</div>`
        : ''
      return {
        open:
          `<div class="${cx(`md-panel${tone}${icon ? ' md-panel--icon' : ''}`, theme.panel)}"${styleVars(rotateVar(attrs.tilt))}>` +
          tape +
          iconHtml +
          title +
          `<div class="md-panel-body">`,
        close: '</div></div>',
      }
    },
  },
  {
    name: 'Icon',
    directive: 'icon',
    body: 'none',
    placement: 'both',
    attrs: {
      name: {
        type: 'string',
        required: true,
        describe: 'Lucide-style icon name (arrow-up-right, languages, zap, …)',
      },
      size: {
        type: 'number',
        default: 24,
        describe: 'Pixel size, 12 to 64',
      },
    },
    positional: 'name',
    describe: 'Inline Lucide-style SVG icon',
    render: ({ attrs, inline, theme }) => {
      const size = clamp(num(attrs.size, 24), 12, 64)
      const svg = getIcon(attrs.name ? String(attrs.name) : '', {
        size,
        className: 'md-icon md-icon-standalone',
      })
      // Unknown names fail open at render time; validate.ts blocks publish.
      if (!svg) {
        return {
          open: `<span class="md-icon-missing" title="Unknown icon">${attrText(attrs.name)}</span>`,
          close: '',
        }
      }
      const tag = inline ? 'span' : 'div'
      return {
        open: `<${tag} class="${cx('md-icon-wrap', theme.icon)}">${svg}`,
        close: `</${tag}>`,
      }
    },
  },
  {
    name: 'InkBand',
    directive: 'ink-band',
    body: 'block',
    attrs: {
      title: { type: 'string', describe: 'Optional heading' },
    },
    positional: 'title',
    describe: 'Inverted full-width section, for a break in the page',
    render: ({ attrs, theme }) => ({
      open:
        `<section class="${cx('md-ink-band', theme.inkBand)}">` +
        (attrs.title
          ? `<p class="md-ink-band-title">${attrText(attrs.title)}</p>`
          : '') +
        `<div class="md-ink-band-body">`,
      close: '</div></section>',
    }),
  },
  {
    name: 'Strips',
    directive: 'strips',
    body: 'block',
    attrs: {},
    describe: 'Turns a list into offset cards',
    render: ({ theme }) => ({
      open: `<div class="${cx('md-strips', theme.strips)}">`,
      close: '</div>',
    }),
  },

  // ---- document structure -------------------------------------------------
  {
    name: 'Toc',
    directive: 'toc',
    body: 'none',
    needsHeadings: true,
    attrs: {
      title: { type: 'string', default: 'Contents', describe: 'Heading above the list' },
      depth: {
        type: 'number',
        default: 3,
        describe: 'Deepest heading level to include, 2 to 6',
      },
      from: {
        type: 'number',
        default: 2,
        describe: 'Shallowest heading level to include',
      },
    },
    describe: 'Table of contents, built from the document’s own headings',
    render: ({ attrs, headings, theme }) => {
      const from = clamp(num(attrs.from, 2), 1, 6)
      const depth = clamp(num(attrs.depth, 3), from, 6)
      const items = headings.filter((h) => h.depth >= from && h.depth <= depth)

      // An empty nav is worse than none: it reads as a broken component.
      if (!items.length) return { open: '', close: '' }

      const list = items
        .map(
          (heading) =>
            `<li class="md-toc-item md-toc-item--h${heading.depth}">` +
            `<a class="md-toc-link" href="#${escapeHtml(heading.slug)}">${escapeHtml(heading.text)}</a>` +
            `</li>`,
        )
        .join('')

      return {
        open:
          `<nav class="${cx('md-toc', theme.toc)}" aria-label="${attrText(attrs.title)}">` +
          `<p class="md-toc-title">${attrText(attrs.title)}</p>` +
          `<ol class="md-toc-list">${list}</ol>` +
          `</nav>`,
        close: '',
      }
    },
  },
  {
    name: 'Steps',
    directive: 'steps',
    body: 'block',
    attrs: {},
    children: { name: 'Step', min: 1 },
    describe: 'Numbered sequence of instructions',
    render: ({ theme }) => ({
      open: `<ol class="${cx('md-steps', theme.steps)}">`,
      close: '</ol>',
    }),
  },
  {
    name: 'Step',
    directive: 'step',
    body: 'block',
    parents: ['Steps'],
    attrs: {
      title: { type: 'string', describe: 'Short label for the step' },
      ...ICON_ATTR,
    },
    positional: 'title',
    describe: 'One step; numbering is automatic',
    render: ({ attrs, theme }) => {
      // The number comes from a CSS counter, so inserting a step in the middle
      // does not mean renumbering the ones after it by hand.
      const icon = getIcon(attrs.icon ? String(attrs.icon) : '', {
        size: 16,
        className: 'md-icon md-step-icon-svg',
      })
      const title = attrs.title
        ? `<p class="md-step-title">${icon}${attrText(attrs.title)}</p>`
        : icon
          ? `<p class="md-step-title md-step-title--icon-only">${icon}</p>`
          : ''
      return {
        open:
          `<li class="${cx('md-step', theme.step)}">` +
          title +
          `<div class="md-step-body">`,
        close: '</div></li>',
      }
    },
  },
  {
    name: 'Phases',
    directive: 'phases',
    body: 'block',
    attrs: {},
    children: { name: 'Phase', min: 1 },
    describe: 'Rollout phases or a timeline',
    render: ({ theme }) => ({
      open: `<div class="${cx('md-phases', theme.phases)}">`,
      close: '</div>',
    }),
  },
  {
    name: 'Phase',
    directive: 'phase',
    body: 'block',
    parents: ['Phases'],
    attrs: {
      title: { type: 'string', required: true, describe: 'Phase name' },
      tag: { type: 'string', describe: 'Short chip, e.g. a date or "now"' },
      tone: { type: 'enum', values: TONES, describe: 'Accent colour' },
      ...ICON_ATTR,
    },
    positional: 'title',
    describe: 'One phase, with an optional chip and Lucide icon',
    render: ({ attrs, theme }) => {
      const tone = attrs.tone ? ` md-phase--${attrs.tone}` : ''
      const tag = attrs.tag
        ? `<span class="md-phase-tag">${attrText(attrs.tag)}</span>`
        : ''
      const icon = getIcon(attrs.icon ? String(attrs.icon) : '', {
        size: 16,
        className: 'md-icon md-phase-icon-svg',
      })
      return {
        open:
          `<section class="${cx(`md-phase${tone}`, theme.phase)}">` +
          `<div class="md-phase-head">${icon}${tag}<span class="md-phase-name">${attrText(attrs.title)}</span></div>` +
          `<div class="md-phase-body">`,
        close: '</div></section>',
      }
    },
  },
  {
    name: 'Checklist',
    directive: 'checklist',
    body: 'block',
    attrs: {
      title: { type: 'string', describe: 'Optional heading' },
    },
    positional: 'title',
    describe: 'Framed task list',
    render: ({ attrs, theme }) => ({
      open:
        `<div class="${cx('md-checklist', theme.checklist)}">` +
        (attrs.title
          ? `<p class="md-checklist-title">${attrText(attrs.title)}</p>`
          : ''),
      close: '</div>',
    }),
  },
  {
    name: 'Lede',
    directive: 'lede',
    body: 'block',
    attrs: {},
    describe: 'Opening paragraph, set larger than body text',
    render: ({ theme }) => ({
      open: `<div class="${cx('md-lede', theme.lede)}">`,
      close: '</div>',
    }),
  },

  // ---- data ---------------------------------------------------------------
  {
    name: 'Meters',
    directive: 'meters',
    body: 'block',
    attrs: {},
    children: { name: 'Meter', min: 1 },
    describe: 'Scored rubric, e.g. a risk register',
    render: ({ theme }) => ({
      open: `<div class="${cx('md-meters', theme.meters)}">`,
      close: '</div>',
    }),
  },
  {
    name: 'Meter',
    directive: 'meter',
    body: 'block',
    parents: ['Meters'],
    attrs: {
      label: { type: 'string', required: true, describe: 'What is being scored' },
      level: {
        type: 'enum',
        values: ['high', 'mid', 'low'],
        default: 'mid',
        describe: 'Severity band, which sets the colour',
      },
      score: { type: 'number', default: 5, describe: 'Score out of 10' },
    },
    positional: 'label',
    describe: 'One scored row; the body is the explanation',
    render: ({ attrs, theme }) => {
      const score = clamp(num(attrs.score, 0), 0, 10)
      return {
        open:
          `<div class="${cx(`md-meter md-meter--${attrs.level}`, theme.meter)}"${styleVars({ '--md-meter-score': score })}>` +
          `<div class="md-meter-head">` +
          `<span class="md-meter-label">${attrText(attrs.label)}</span>` +
          `<span class="md-meter-score">${score}<span class="md-meter-score-max">/10</span></span>` +
          `</div>` +
          `<div class="md-meter-track" role="img" aria-label="${attrText(attrs.label)}: ${score} out of 10">` +
          `<span class="md-meter-fill"></span>` +
          `</div>` +
          `<div class="md-meter-blurb">`,
        close: '</div></div>',
      }
    },
  },
  {
    name: 'Kpi',
    directive: 'kpi',
    body: 'block',
    attrs: {
      cols: { type: 'number', default: 3, describe: 'Columns, 2 to 4' },
    },
    positional: 'cols',
    children: { name: 'Stat', min: 1 },
    describe: 'Row of headline numbers',
    render: ({ attrs, theme }) => {
      const cols = clamp(num(attrs.cols, 3), 1, 4)
      return {
        open: `<div class="${cx('md-kpi', theme.kpi)}"${styleVars({ '--md-kpi-cols': cols })}>`,
        close: '</div>',
      }
    },
  },
  {
    name: 'Stat',
    directive: 'stat',
    body: 'none',
    parents: ['Kpi'],
    attrs: {
      value: { type: 'string', required: true, describe: 'The number itself' },
      label: { type: 'string', required: true, describe: 'What it measures' },
      tone: { type: 'enum', values: TONES, describe: 'Accent colour' },
      ...ICON_ATTR,
    },
    describe: 'One headline number inside Kpi',
    render: ({ attrs, theme }) => {
      const tone = attrs.tone ? ` md-stat--${attrs.tone}` : ''
      const icon = getIcon(attrs.icon ? String(attrs.icon) : '', {
        size: 18,
        className: 'md-icon md-stat-icon-svg',
      })
      return {
        open:
          `<div class="${cx(`md-stat${tone}`, theme.stat)}">` +
          (icon ? `<span class="md-stat-icon" aria-hidden="true">${icon}</span>` : '') +
          `<span class="md-stat-value">${attrText(attrs.value)}</span>` +
          `<span class="md-stat-label">${attrText(attrs.label)}</span>` +
          `</div>`,
        close: '',
      }
    },
  },
  {
    name: 'Bars',
    directive: 'bars',
    body: 'block',
    attrs: {
      title: { type: 'string', describe: 'Optional heading' },
    },
    positional: 'title',
    describe: 'Horizontal bar chart',
    render: ({ attrs, theme }) => ({
      open:
        `<div class="${cx('md-bars', theme.bars)}">` +
        (attrs.title ? `<p class="md-bars-title">${attrText(attrs.title)}</p>` : ''),
      close: '</div>',
    }),
  },
  {
    name: 'Bar',
    directive: 'bar',
    body: 'none',
    parents: ['Bars'],
    attrs: {
      label: { type: 'string', required: true, describe: 'Row label' },
      value: { type: 'number', required: true, describe: 'Bar length' },
      max: { type: 'number', default: 100, describe: 'Value at full width' },
      display: { type: 'string', describe: 'Text to show instead of the raw value' },
      tone: { type: 'enum', values: TONES, describe: 'Bar colour' },
    },
    describe: 'One bar inside Bars',
    render: ({ attrs, theme }) => {
      const max = num(attrs.max, 100)
      const value = num(attrs.value, 0)
      // Guard the divide: `max={0}` is a typo, not a request for infinity.
      const percent = max > 0 ? clamp((value / max) * 100, 0, 100) : 0
      const tone = attrs.tone ? ` md-bar--${attrs.tone}` : ''
      const shown = attrs.display ?? attrs.value
      return {
        open:
          `<div class="${cx(`md-bar${tone}`, theme.bar)}"${styleVars({ '--md-bar-fill': `${percent.toFixed(2)}%` })}>` +
          `<span class="md-bar-label">${attrText(attrs.label)}</span>` +
          `<span class="md-bar-track" role="img" aria-label="${attrText(attrs.label)}: ${attrText(shown)}">` +
          `<span class="md-bar-fill"></span>` +
          `</span>` +
          `<span class="md-bar-value">${attrText(shown)}</span>` +
          `</div>`,
        close: '',
      }
    },
  },
  {
    name: 'Legend',
    directive: 'legend',
    body: 'block',
    attrs: {},
    describe: 'Turns a list into inline legend chips',
    render: ({ theme }) => ({
      open: `<div class="${cx('md-legend', theme.legend)}">`,
      close: '</div>',
    }),
  },

  // ---- marginalia ---------------------------------------------------------
  {
    name: 'Sticker',
    directive: 'sticker',
    body: 'block',
    placement: 'both',
    attrs: {
      shape: {
        type: 'enum',
        values: ['round', 'rect'],
        default: 'rect',
        describe: 'Sticker outline',
      },
      tone: { type: 'enum', values: TONES, describe: 'Fill colour' },
      rotate: { type: 'number', describe: 'Rotation in degrees, -15 to 15' },
    },
    positional: 'shape',
    describe: 'Small stamped label',
    render: ({ attrs, theme }) => {
      const tone = attrs.tone ? ` md-sticker--${attrs.tone}` : ''
      return {
        open: `<span class="${cx(`md-sticker md-sticker--${attrs.shape}${tone}`, theme.sticker)}"${styleVars(rotateVar(attrs.rotate))}>`,
        close: '</span>',
      }
    },
  },
  {
    name: 'Hand',
    directive: 'hand',
    body: 'block',
    placement: 'both',
    attrs: {},
    describe: 'Handwritten aside',
    render: ({ inline, theme }) => {
      // A `span` cannot hold the paragraphs a block body produces, and a `div`
      // inside a `<p>` is invalid, so the element follows the position.
      const tag = inline ? 'span' : 'div'
      return {
        open: `<${tag} class="${cx('md-hand', theme.hand)}">`,
        close: `</${tag}>`,
      }
    },
  },
  {
    name: 'Tape',
    directive: 'tape',
    body: 'none',
    placement: 'both',
    attrs: {
      rotate: { type: 'number', describe: 'Rotation in degrees, -15 to 15' },
    },
    describe: 'Decorative strip of masking tape',
    render: ({ attrs, theme }) => ({
      open: `<span class="${cx('md-tape', theme.tape)}" aria-hidden="true"${styleVars(rotateVar(attrs.rotate))}></span>`,
      close: '',
    }),
  },
  {
    name: 'Mark',
    directive: 'mark',
    body: 'block',
    placement: 'inline',
    attrs: {
      tone: { type: 'enum', values: TONES, describe: 'Highlighter colour' },
    },
    positional: 'tone',
    describe: 'Highlighter pen',
    render: ({ attrs, theme }) => {
      const tone = attrs.tone ? ` md-mark--${attrs.tone}` : ''
      return {
        open: `<mark class="${cx(`md-mark${tone}`, theme.mark)}">`,
        close: '</mark>',
      }
    },
  },

  // ---- media --------------------------------------------------------------
  {
    name: 'Figure',
    directive: 'figure',
    body: 'block',
    attrs: {
      caption: { type: 'string', describe: 'Caption below the content' },
      credit: { type: 'string', describe: 'Attribution, shown after the caption' },
      full: { type: 'boolean', describe: 'Break out to the full content width' },
    },
    positional: 'caption',
    describe: 'Captioned figure around an image, table or diagram',
    render: ({ attrs, theme }) => {
      const full = attrs.full ? ' md-figure--full' : ''
      const credit = attrs.credit
        ? `<span class="md-figure-credit">${attrText(attrs.credit)}</span>`
        : ''
      const caption =
        attrs.caption || attrs.credit
          ? `<figcaption class="md-figure-caption">${attrText(attrs.caption)}${credit}</figcaption>`
          : ''
      return {
        open: `<figure class="${cx(`md-figure md-figure--explicit${full}`, theme.imageWrap)}">`,
        close: `${caption}</figure>`,
      }
    },
  },
  {
    name: 'Ascii',
    directive: 'ascii',
    body: 'raw',
    attrs: {
      label: {
        type: 'string',
        required: true,
        describe: 'Description of the diagram, for screen readers',
      },
    },
    positional: 'label',
    describe: 'Monospaced diagram, kept exactly as written',
    render: ({ attrs, theme }) => ({
      // `role="img"` plus the label: the box-drawing characters are noise read
      // aloud, so the description stands in for them.
      open:
        `<figure class="${cx('md-ascii', theme.ascii)}" role="img" aria-label="${attrText(attrs.label)}">` +
        `<pre class="md-ascii-pre"><code>`,
      close: '</code></pre></figure>',
    }),
  },
  {
    name: 'Embed',
    directive: 'embed',
    body: 'none',
    attrs: {
      type: {
        type: 'enum',
        values: ['youtube', 'vimeo', 'gist', 'codepen'],
        required: true,
        describe: 'Which provider',
      },
      id: { type: 'string', required: true, describe: 'Provider id or user/hash' },
      title: { type: 'string', describe: 'Accessible title for the frame' },
    },
    describe: 'Embedded video or snippet from an allowed provider',
    render: ({ attrs, theme }) => {
      const provider = String(attrs.type ?? '')
      const id = String(attrs.id ?? '')
      const src = embedUrl(provider, id)

      // Only an allowlisted provider and a pattern-checked id ever become a
      // frame. This content crosses an API boundary and is rendered by two
      // other sites, so an arbitrary author-supplied URL is not on offer.
      if (!src) {
        return {
          open: `<span class="md-embed-invalid">Unsupported embed: ${attrText(provider)} ${attrText(id)}</span>`,
          close: '',
        }
      }

      const title = attrs.title ? String(attrs.title) : `${provider} embed`
      return {
        open:
          `<div class="${cx(`md-embed md-embed--${provider}`, theme.embed)}">` +
          `<iframe src="${escapeHtml(src)}" title="${escapeHtml(title)}" loading="lazy" ` +
          `referrerpolicy="strict-origin-when-cross-origin" ` +
          `allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" ` +
          `allowfullscreen></iframe>` +
          `</div>`,
        close: '',
      }
    },
  },

  // ---- interaction --------------------------------------------------------
  {
    name: 'Tabs',
    directive: 'tabs',
    body: 'block',
    attrs: {},
    children: { name: 'Tab', min: 1 },
    describe: 'Tabbed panels; falls back to stacked sections without JS',
    render: ({ theme }) => ({
      // The tab strip is built by `client.ts` from the panels below it. Without
      // JavaScript every panel stays visible under its own heading, which is a
      // readable document rather than a broken widget.
      open: `<div class="${cx('md-tabs', theme.tabs)}" data-md-tabs>`,
      close: '</div>',
    }),
  },
  {
    name: 'Tab',
    directive: 'tab',
    body: 'block',
    parents: ['Tabs'],
    attrs: {
      title: { type: 'string', required: true, describe: 'Tab label' },
    },
    positional: 'title',
    describe: 'One panel inside Tabs',
    render: ({ attrs, theme }) => ({
      open:
        `<section class="${cx('md-tab', theme.tab)}" data-md-tab-title="${attrText(attrs.title)}">` +
        `<p class="md-tab-title">${attrText(attrs.title)}</p>` +
        `<div class="md-tab-body">`,
      close: '</div></section>',
    }),
  },
  {
    name: 'Details',
    directive: 'details',
    body: 'block',
    attrs: {
      summary: {
        type: 'string',
        required: true,
        describe: 'The always-visible line',
      },
      open: { type: 'boolean', describe: 'Start expanded' },
    },
    positional: 'summary',
    describe: 'Collapsible section',
    render: ({ attrs, theme }) => ({
      // Native `<details>`, so this needs no JavaScript at all and still works
      // with in-page search on browsers that expand matches automatically.
      open:
        `<details class="${cx('md-details', theme.details)}"${attrs.open ? ' open' : ''}>` +
        `<summary class="md-details-summary">${attrText(attrs.summary)}</summary>` +
        `<div class="md-details-body">`,
      close: '</div></details>',
    }),
  },
]

/** Provider id patterns, kept next to the URLs they build. */
const EMBED_PROVIDERS: Record<
  string,
  { pattern: RegExp; url: (id: string) => string }
> = {
  youtube: {
    pattern: /^[A-Za-z0-9_-]{6,20}$/,
    // The -nocookie host so an embedded video does not set a tracking cookie
    // on a reader who never pressed play.
    url: (id) => `https://www.youtube-nocookie.com/embed/${id}`,
  },
  vimeo: {
    pattern: /^\d{6,12}$/,
    url: (id) => `https://player.vimeo.com/video/${id}`,
  },
  gist: {
    pattern: /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[0-9a-f]{20,40}$/,
    url: (id) => `https://gist.github.com/${id}.pibb`,
  },
  codepen: {
    pattern: /^[A-Za-z0-9_-]{1,40}\/[A-Za-z0-9]{5,12}$/,
    url: (id) => `https://codepen.io/${id.replace('/', '/embed/')}`,
  },
}

/** The embed URL for a provider and id, or `null` if either is not allowed. */
export function embedUrl(provider: string, id: string): string | null {
  const entry = EMBED_PROVIDERS[provider]
  if (!entry || !entry.pattern.test(id)) return null
  return entry.url(id)
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

const BY_NAME = new Map<string, ComponentSpec>()
const BY_DIRECTIVE = new Map<string, ComponentSpec>()

for (const spec of COMPONENTS) {
  BY_NAME.set(spec.name.toLowerCase(), spec)
  BY_DIRECTIVE.set(spec.directive, spec)
  for (const alias of spec.aliases ?? []) BY_DIRECTIVE.set(alias, spec)
}

/** Resolve a `:::name` directive, including back-compat aliases. */
export function findByDirective(name: string): ComponentSpec | undefined {
  return BY_DIRECTIVE.get(name.toLowerCase())
}

/** Resolve a `<Name>` tag. Case-insensitive, so `<cols>` also works. */
export function findByTag(name: string): ComponentSpec | undefined {
  return BY_NAME.get(name.toLowerCase()) ?? BY_DIRECTIVE.get(name.toLowerCase())
}

/** Every spelling the parsers accept, for error messages. */
export const DIRECTIVE_NAMES: readonly string[] = COMPONENTS.flatMap((spec) => [
  spec.directive,
  ...(spec.aliases ?? []),
])

export const COMPONENT_NAMES: readonly string[] = COMPONENTS.map(
  (spec) => spec.name,
)

export function isCalloutName(name: string): boolean {
  return (CALLOUT_NAMES as readonly string[]).includes(name)
}

// ---------------------------------------------------------------------------
// Attribute coercion
// ---------------------------------------------------------------------------

/**
 * Coerce raw string attributes against a spec and apply defaults.
 *
 * Rendering is forgiving on purpose: a bad enum value falls back to its default
 * rather than throwing, because a post that reaches a reader with one wrong
 * attribute should still render. `validate.ts` is what turns the same mistake
 * into a publish blocker, where it can still be fixed.
 */
export function resolveAttrs(
  spec: ComponentSpec,
  raw: Record<string, string>,
): AttrValues {
  const out: AttrValues = {}

  for (const [key, attr] of Object.entries(spec.attrs)) {
    const value = raw[key]

    if (value === undefined) {
      if (attr.default !== undefined) out[key] = attr.default
      else if (attr.type === 'boolean') out[key] = false
      continue
    }

    switch (attr.type) {
      case 'number': {
        const parsed = Number(value)
        out[key] = Number.isFinite(parsed) ? parsed : attr.default
        break
      }
      case 'boolean':
        // A bare `<Panel tilt>` parses to the empty string, which reads as on.
        out[key] = value === '' || value === 'true' || value === 'yes'
        break
      case 'enum':
        out[key] = attr.values?.includes(value) ? value : attr.default
        break
      default:
        out[key] = value
    }
  }

  return out
}
