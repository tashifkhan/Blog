import {
  MAX_IMAGES,
  MAX_SLUG_LENGTH,
  assetReference,
  publicImageUrl,
} from './publishing-rules'

export type Draft = {
  body: string
  commitMessage: string
  date: string
  excerpt: string
  slug: string
  tags: string
  title: string
}

/**
 * Author block carried by every post in `src/blogs/`. Kept identical to the
 * existing files so published posts render the same social links as the ones
 * written by hand.
 */
const AUTHOR_NAME = 'Tashif Ahmad Khan'
const AUTHOR_SOCIALS = [
  'https://www.github.com/tashifkhan',
  'https://www.linkedin.com/in/tashif-ahmad-khan-982304244/',
  'https://tashif.codes',
]

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
}

export function normalizeFilename(value: string): string {
  const dot = value.lastIndexOf('.')
  const rawName = dot > 0 ? value.slice(0, dot) : value
  const extension = dot > 0 ? value.slice(dot + 1).toLowerCase() : ''
  const name = slugify(rawName).toLowerCase() || 'image'
  return `${name}.${extension}`
}

/**
 * `image.png` -> `image-2.png` when the name is taken.
 *
 * Every screenshot arrives from the clipboard as `image.png`, so a name clash
 * has to stay attachable rather than becoming a dead end. `taken` holds
 * lowercased filenames, matching how attachments are compared.
 */
export function uniqueFilename(filename: string, taken: Set<string>): string {
  if (!taken.has(filename.toLowerCase())) return filename

  const dot = filename.lastIndexOf('.')
  const stem = dot > 0 ? filename.slice(0, dot) : filename
  const extension = dot > 0 ? filename.slice(dot) : ''

  for (let suffix = 2; suffix <= MAX_IMAGES; suffix += 1) {
    const candidate = `${stem}-${suffix}${extension}`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
  return filename
}

/** JSON and YAML agree on double-quoted scalars, so this is a safe encoder. */
function yamlString(value: string): string {
  return JSON.stringify(value)
}

function yamlList(values: string[]): string {
  return `[${values.map(yamlString).join(', ')}]`
}

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/** Rewrite every `asset:name.png` placeholder to its published public path. */
export function resolveAssetReferences(
  body: string,
  filenames: string[],
  slug: string,
): string {
  let resolved = body
  for (const filename of filenames) {
    resolved = resolved.replaceAll(
      assetReference(filename),
      publicImageUrl(slug, filename),
    )
  }
  return resolved
}

export function buildArticle(draft: Draft, filenames: string[]): string {
  return [
    '---',
    `title: ${yamlString(draft.title.trim())}`,
    `date: ${yamlString(draft.date)}`,
    `author: ${yamlString(AUTHOR_NAME)}`,
    `socials: ${yamlList(AUTHOR_SOCIALS)}`,
    `tags: ${yamlList(parseTags(draft.tags))}`,
    `excerpt: ${yamlString(draft.excerpt.trim())}`,
    '---',
    '',
    resolveAssetReferences(draft.body, filenames, draft.slug).trim(),
    '',
  ].join('\n')
}

export function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200))
}

export function formatBytes(value: number): string {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
