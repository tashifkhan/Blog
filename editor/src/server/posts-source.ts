/**
 * Where the desk loads posts from.
 *
 * Prefer GitHub when the App is configured (matches the publish branch).
 * Otherwise fall back to the monorepo `src/blogs/` directory (local dev),
 * then the public blog API so a home-server deploy can still open stories
 * for editing even before GitHub credentials are wired.
 *
 * Publishing still always goes through GitHub.
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Draft } from '../lib/article'
import { draftFromMarkdown } from '../lib/parse-article'
import {
  IMAGE_FILENAME_PATTERN,
  articlePathForSlug,
  publicImageUrl,
} from '../lib/publishing-rules'
import {
  type LoadedPost,
  type LoadedPostImage,
  type PostListItem,
  isGitHubConfigured,
  listPostsFromGitHub,
  loadPostFromGitHub,
  publishBranchName,
} from './github.server'
import { ApiError } from './http.server'

export type PostsSource = 'github' | 'local' | 'blog-api'

const BLOG_API_BASE =
  process.env.BLOG_API_BASE?.replace(/\/$/, '') ||
  'https://blog.tashif.codes/api'

const BLOG_SITE_ORIGIN =
  process.env.BLOG_SITE_ORIGIN?.replace(/\/$/, '') ||
  'https://blog.tashif.codes'

async function dirExists(dir: string): Promise<boolean> {
  try {
    const info = await stat(dir)
    return info.isDirectory()
  } catch {
    return false
  }
}

async function resolveBlogsDir(): Promise<string | null> {
  const candidates = [
    process.env.BLOGS_DIR,
    path.resolve(process.cwd(), 'src/blogs'),
    path.resolve(process.cwd(), '../src/blogs'),
    // editor/ package next to monorepo root
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../src/blogs',
    ),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (await dirExists(candidate)) return candidate
  }
  return null
}

async function listPostsFromLocal(): Promise<{
  branch: string
  posts: PostListItem[]
  source: PostsSource
} | null> {
  const blogsDir = await resolveBlogsDir()
  if (!blogsDir) return null

  const names = await readdir(blogsDir)
  const markdownFiles = names.filter((name) => name.toLowerCase().endsWith('.md'))

  const { summaryFromMarkdown } = await import('../lib/parse-article')

  const posts: PostListItem[] = await Promise.all(
    markdownFiles.map(async (name) => {
      const slug = name.replace(/\.md$/i, '')
      const filePath = path.join(blogsDir, name)
      try {
        const markdown = await readFile(filePath, 'utf8')
        const summary = summaryFromMarkdown(slug, markdown)
        return {
          ...summary,
          path: articlePathForSlug(slug),
          slug,
        } satisfies PostListItem
      } catch {
        return {
          coverImage: null,
          date: '',
          excerpt: '',
          path: articlePathForSlug(slug),
          slug,
          tags: [],
          title: slug,
        } satisfies PostListItem
      }
    }),
  )

  posts.sort((a, b) => {
    const byDate =
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    if (byDate !== 0) return byDate
    return a.slug.localeCompare(b.slug)
  })

  return {
    branch: 'local',
    posts,
    source: 'local',
  }
}

async function listLocalImages(slug: string): Promise<LoadedPostImage[]> {
  const blogsDir = await resolveBlogsDir()
  if (!blogsDir) return []
  // blogsDir is .../src/blogs → public is .../public
  const imagesDir = path.resolve(
    blogsDir,
    '..',
    '..',
    'public',
    'images',
    'blog',
    slug,
  )
  if (!(await dirExists(imagesDir))) return []

  const names = await readdir(imagesDir)
  return names
    .filter((name) => IMAGE_FILENAME_PATTERN.test(name))
    .map((filename) => {
      const publicUrl = publicImageUrl(slug, filename)
      return {
        filename,
        publicUrl,
        downloadUrl: `${BLOG_SITE_ORIGIN}${publicUrl}`,
      }
    })
}

async function loadPostFromLocal(slug: string): Promise<LoadedPost | null> {
  const blogsDir = await resolveBlogsDir()
  if (!blogsDir) return null

  const filePath = path.join(blogsDir, `${slug}.md`)
  try {
    const markdown = await readFile(filePath, 'utf8')
    const draft = draftFromMarkdown(slug, markdown)
    const images = await listLocalImages(slug)
    return {
      branch: 'local',
      draft,
      images,
      path: articlePathForSlug(slug),
      slug,
    }
  } catch {
    return null
  }
}

type BlogApiSummary = {
  slug: string
  title?: string
  date?: string
  excerpt?: string
  tags?: string[]
  coverImage?: string | null
  metadata?: Record<string, unknown>
}

async function listPostsFromBlogApi(): Promise<{
  branch: string
  posts: PostListItem[]
  source: PostsSource
}> {
  let response: Response
  try {
    response = await fetch(`${BLOG_API_BASE}/posts.json`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Tashif-Pressroom' },
    })
  } catch {
    throw new ApiError(
      502,
      'Could not reach the public blog API to list posts. Set GITHUB_TOKEN or BLOG_API_BASE.',
    )
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      `Blog API returned ${response.status} while listing posts`,
    )
  }

  const data = (await response.json()) as unknown
  if (!Array.isArray(data)) {
    throw new ApiError(502, 'Blog API posts response was not an array')
  }

  const posts: PostListItem[] = (data as BlogApiSummary[]).map((item) => {
    const cover =
      (typeof item.coverImage === 'string' && item.coverImage) ||
      (typeof item.metadata?.coverImage === 'string'
        ? (item.metadata.coverImage as string)
        : null)
    return {
      slug: item.slug,
      title: item.title || item.slug,
      date: item.date ? String(item.date).slice(0, 10) : '',
      excerpt: item.excerpt || '',
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      coverImage: cover,
      path: articlePathForSlug(item.slug),
    }
  })

  posts.sort((a, b) => {
    const byDate =
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    if (byDate !== 0) return byDate
    return a.slug.localeCompare(b.slug)
  })

  return {
    branch: 'blog-api',
    posts,
    source: 'blog-api',
  }
}

function draftFromApiPayload(
  slug: string,
  markdown: string,
  metadata: Record<string, unknown>,
): Draft {
  // Full endpoint returns body without frontmatter; rebuild a synthetic doc
  // so draftFromMarkdown still works if metadata is empty.
  const hasFm = markdown.trimStart().startsWith('---')
  if (hasFm) return draftFromMarkdown(slug, markdown)

  const title =
    typeof metadata.title === 'string' ? metadata.title : slug
  const dateRaw = metadata.date
  let date = new Date().toISOString().slice(0, 10)
  if (dateRaw instanceof Date) date = dateRaw.toISOString().slice(0, 10)
  else if (typeof dateRaw === 'string') date = dateRaw.slice(0, 10)

  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.map(String).join(', ')
    : typeof metadata.tags === 'string'
      ? metadata.tags
      : ''

  const excerpt =
    typeof metadata.excerpt === 'string' ? metadata.excerpt : ''
  const coverImage =
    typeof metadata.coverImage === 'string' ? metadata.coverImage : ''

  return {
    body: markdown.replace(/^\n+/, ''),
    commitMessage: `content: update ${title}`,
    coverImage,
    date,
    excerpt,
    slug,
    tags,
    title,
  }
}

function imagesFromDraft(slug: string, draft: Draft): LoadedPostImage[] {
  const found = new Set<string>()
  const ref = new RegExp(
    String.raw`/images/blog/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([A-Za-z0-9][A-Za-z0-9._-]*\.(?:avif|gif|jpe?g|png|webp))`,
    'gi',
  )
  for (const match of draft.body.matchAll(ref)) {
    found.add(match[1]!)
  }
  if (draft.coverImage) {
    const coverMatch = draft.coverImage.match(
      new RegExp(
        String.raw`/images/blog/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^/?#]+)$`,
        'i',
      ),
    )
    if (coverMatch?.[1] && IMAGE_FILENAME_PATTERN.test(coverMatch[1])) {
      found.add(coverMatch[1])
    }
  }

  return [...found].map((filename) => {
    const publicUrl = publicImageUrl(slug, filename)
    return {
      filename,
      publicUrl,
      downloadUrl: `${BLOG_SITE_ORIGIN}${publicUrl}`,
    }
  })
}

async function loadPostFromBlogApi(slug: string): Promise<LoadedPost> {
  let response: Response
  try {
    response = await fetch(
      `${BLOG_API_BASE}/posts/${encodeURIComponent(slug)}/full`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Tashif-Pressroom',
        },
      },
    )
  } catch {
    throw new ApiError(502, `Could not reach the blog API for “${slug}”`)
  }

  if (response.status === 404) {
    throw new ApiError(404, `No post at src/blogs/${slug}.md`)
  }
  if (!response.ok) {
    throw new ApiError(
      502,
      `Blog API returned ${response.status} while loading “${slug}”`,
    )
  }

  const data = (await response.json()) as {
    post?: {
      slug?: string
      markdown?: string
      metadata?: Record<string, unknown>
    }
  }
  const post = data.post
  if (!post || typeof post.markdown !== 'string') {
    throw new ApiError(502, 'Blog API full-post payload was incomplete')
  }

  const draft = draftFromApiPayload(
    post.slug || slug,
    post.markdown,
    post.metadata || {},
  )
  const images = imagesFromDraft(draft.slug, draft)

  return {
    branch: 'blog-api',
    draft,
    images,
    path: articlePathForSlug(draft.slug),
    slug: draft.slug,
  }
}

export async function listPosts(): Promise<{
  branch: string
  posts: PostListItem[]
  source: PostsSource
}> {
  if (isGitHubConfigured()) {
    try {
      const fromGitHub = await listPostsFromGitHub()
      return { ...fromGitHub, source: 'github' }
    } catch (error) {
      // Fall through to local / public API so a misconfigured App still
      // leaves the desk usable for reading and drafting.
      console.error('GitHub listPosts failed; trying fallbacks', error)
    }
  }

  const local = await listPostsFromLocal()
  if (local && local.posts.length > 0) return local

  return listPostsFromBlogApi()
}

export async function loadPost(slug: string): Promise<LoadedPost & { source: PostsSource }> {
  if (isGitHubConfigured()) {
    try {
      const loaded = await loadPostFromGitHub(slug)
      return { ...loaded, source: 'github' }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // try fallbacks
      } else {
        console.error('GitHub loadPost failed; trying fallbacks', error)
      }
    }
  }

  const local = await loadPostFromLocal(slug)
  if (local) return { ...local, source: 'local' }

  const fromApi = await loadPostFromBlogApi(slug)
  return { ...fromApi, source: 'blog-api' }
}

export function publishingReady(): boolean {
  return isGitHubConfigured()
}

export { publishBranchName }
