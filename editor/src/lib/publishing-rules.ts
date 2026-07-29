/**
 * Publishing rules shared by the browser and the server.
 *
 * This module is intentionally dependency-free so the editor UI can enforce the
 * same limits the API enforces. Anything that needs `Buffer`, `zod`, or the
 * GitHub client belongs in `src/server/` instead.
 */

export const MAX_IMAGE_BYTES = 3_000_000
export const MAX_IMAGE_BASE64_LENGTH = 4_050_000
export const MAX_ARTICLE_BYTES = 2 * 1024 * 1024
export const MAX_IMAGES = 25
export const MAX_COMMIT_MESSAGE_LENGTH = 500
export const MAX_EXCERPT_LENGTH = 240
export const MAX_SLUG_LENGTH = 120

export const SHA_PATTERN = /^[0-9a-f]{40}$/i
export const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,119}$/
export const IMAGE_FILENAME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}\.(?:avif|gif|jpe?g|png|webp)$/i

export const IMAGE_ACCEPT_ATTRIBUTE =
  'image/avif,image/gif,image/jpeg,image/png,image/webp'

/**
 * `asset:cover.webp` — the editor-only placeholder the media desk inserts, and
 * which `resolveAssetReferences` rewrites to a real `/images/blog/...` path
 * before publishing.
 *
 * The leading lookbehind keeps prose and code from tripping the check: an
 * article may legitimately contain `dataset:cover.png` or a YAML line reading
 * `asset: something`, and neither is an unresolved editor reference.
 */
const ASSET_REFERENCE_SOURCE = String.raw`(?<![A-Za-z0-9_-])asset:([A-Za-z0-9][A-Za-z0-9._-]*\.(?:avif|gif|jpe?g|png|webp))`

export function assetReference(filename: string): string {
  return `asset:${filename}`
}

/** Every distinct `asset:` filename still present in the text, in order. */
export function findAssetReferences(value: string): string[] {
  const matches = value.matchAll(new RegExp(ASSET_REFERENCE_SOURCE, 'gi'))
  return [...new Set(Array.from(matches, (match) => match[1]))]
}

export function articlePathForSlug(slug: string): string {
  return `src/blogs/${slug}.md`
}

export function imagePathFor(slug: string, filename: string): string {
  return `public/images/blog/${slug}/${filename}`
}

export function publicImageUrl(slug: string, filename: string): string {
  return `/images/blog/${slug}/${filename}`
}
