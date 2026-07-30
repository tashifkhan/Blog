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
 * digits — `![Rock|Paper](x.png)` keeps its alt text intact.
 */

export type ParsedImageAlt = {
  alt: string
  width?: number
  height?: number
}

/** `|400` or `|400x260`, anchored to the end of the alt text. */
const SIZE_SUFFIX = /\|\s*(\d{1,5})(?:\s*[x×]\s*(\d{1,5}))?\s*$/

export function parseImageAlt(raw: string): ParsedImageAlt {
  const match = SIZE_SUFFIX.exec(raw)
  if (!match) return { alt: raw }

  const width = Number(match[1])
  const height = match[2] ? Number(match[2]) : undefined
  // `|0` is a typo rather than a request for a zero-width image.
  if (!width) return { alt: raw }

  return {
    alt: raw.slice(0, match.index).trim(),
    width,
    ...(height ? { height } : {}),
  }
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
