import matter from 'gray-matter'

import type { Draft } from './article'
import { parseTags } from './article'

/**
 * Turn a published Markdown file into a Pressroom draft.
 *
 * Server-only in practice (gray-matter), but kept free of Node APIs so unit
 * tests can exercise it without GitHub.
 */
export function draftFromMarkdown(slug: string, markdown: string): Draft {
  let parsed: matter.GrayMatterFile<string>
  try {
    parsed = matter(markdown)
  } catch {
    return {
      body: markdown.trim(),
      commitMessage: `content: update ${slug}`,
      coverImage: '',
      date: new Date().toISOString().slice(0, 10),
      excerpt: '',
      slug,
      tags: '',
      title: slug,
    }
  }

  const data = parsed.data as Record<string, unknown>
  const title =
    typeof data.title === 'string' && data.title.trim()
      ? data.title.trim()
      : slug

  return {
    body: parsed.content.replace(/^\n+/, ''),
    commitMessage: `content: update ${title}`,
    coverImage: normalizeCover(data.coverImage),
    date: normalizeDate(data.date),
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    slug,
    tags: normalizeTags(data.tags),
    title,
  }
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim()
    // Accept full ISO timestamps from earlier publishes.
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
  }
  return new Date().toISOString().slice(0, 10)
}

function normalizeTags(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag).trim())
      .filter(Boolean)
      .join(', ')
  }
  if (typeof value === 'string') return parseTags(value).join(', ')
  return ''
}

function normalizeCover(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

/** Lightweight frontmatter for the desk list (no body). */
export function summaryFromMarkdown(
  slug: string,
  markdown: string,
): {
  coverImage: string | null
  date: string
  excerpt: string
  tags: string[]
  title: string
} {
  const draft = draftFromMarkdown(slug, markdown)
  return {
    coverImage: draft.coverImage || null,
    date: draft.date,
    excerpt: draft.excerpt,
    tags: parseTags(draft.tags),
    title: draft.title,
  }
}
