/**
 * Image sizing, in Obsidian's syntax.
 *
 *     ![A diagram|400](/images/blog/post/diagram.png)
 *     ![A diagram|400x260](/images/blog/post/diagram.png)
 *
 * Chosen to match Obsidian because posts are drafted there and pasted in, so a
 * note keeps rendering the same on both sides. It also degrades honestly
 * everywhere else: a renderer that does not understand the suffix shows the
 * image at full size with `A diagram|400` as its alt text, rather than breaking.
 *
 * A pipe is legal in alt text, so the suffix only counts when what follows it is
 * a size — `![Rock|Paper](x.png)` keeps its alt text intact.
 *
 * dump.taf.sh's placement options stack on top: `|left` / `|right` float the
 * figure so the next paragraphs wrap round it, `|center` centres it, and
 * `|40%` sets its width as a share of the column.
 */

export type ImagePlacement = 'left' | 'right' | 'center'

export type ParsedImageAlt = {
  alt: string
  width?: number
  height?: number
  /** dump.taf.sh placement: float left/right so text wraps, or centre. */
  placement?: ImagePlacement
  /** Width as a share of the column, from `|40%`. */
  percent?: number
}

/** `400` or `400x260`: one `|option` with its pipe already removed. */
const SIZE_SUFFIX = /^(\d{1,5})(?:\s*[x×]\s*(\d{1,5}))?$/
const PERCENT_SUFFIX = /^(\d{1,3})%$/
const PLACEMENTS = new Set(['left', 'right', 'center'])

/**
 * Peel `|option` suffixes off the end of the alt text, in any order:
 * `![Chart|right|40%]`, `![Chart|400x260|center]`. Anything unrecognised stops
 * the scan, so `![Rock|Paper](x.png)` keeps its alt text intact.
 */
export function parseImageAlt(raw: string): ParsedImageAlt {
  const out: ParsedImageAlt = { alt: raw }
  let rest = raw

  while (true) {
    const bar = rest.lastIndexOf('|')
    if (bar === -1) break
    const option = rest.slice(bar + 1).trim().toLowerCase()

    const size = SIZE_SUFFIX.exec(option)
    const percent = PERCENT_SUFFIX.exec(option)
    // `|0` is a typo rather than a request for a zero-width image.
    if (size && Number(size[1]) && out.width === undefined) {
      out.width = Number(size[1])
      if (size[2]) out.height = Number(size[2])
    } else if (percent && Number(percent[1]) && out.percent === undefined) {
      out.percent = Math.min(100, Number(percent[1]))
    } else if (PLACEMENTS.has(option) && !out.placement) {
      out.placement = option as ImagePlacement
    } else {
      break
    }
    rest = rest.slice(0, bar)
  }

  out.alt = rest === raw ? raw : rest.trim()
  return out
}

/** `width`/`height` attributes for an `<img>`, empty when unsized. */
export function sizeAttributes({ width, height }: ParsedImageAlt): string {
  if (!width) return ''
  // Real attributes rather than inline CSS: they give the browser an aspect
  // ratio before the bytes arrive, so a sized image does not shift the page as
  // it loads. `.md-image { max-width: 100%; height: auto }` still scales it
  // down inside a narrow column and keeps the ratio.
  return height ? ` width="${width}" height="${height}"` : ` width="${width}"`
}
