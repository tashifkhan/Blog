/**
 * End-to-end image pipeline check with real encoded image bytes.
 *
 * Walks one attachment of every supported type through the exact chain the
 * product uses: filename normalisation -> client accept -> upload schema ->
 * `stageImage` signature check -> Markdown insertion -> `asset:` resolution ->
 * publish schema -> commit tree -> the blog's own URL rewriting.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildArticle, normalizeFilename } from './lib/article'
import { insertBlock } from './lib/markdown-editing'
import {
  IMAGE_ACCEPT_ATTRIBUTE,
  IMAGE_FILENAME_PATTERN,
  assetReference,
  findAssetReferences,
} from './lib/publishing-rules'
import { publishArticle, stageImage } from './server/github.server'
import { publishArticleSchema, imageUploadSchema } from './server/publishing-schema'

const BASE_SHA = 'a'.repeat(40)
const BLOB_SHA = 'd'.repeat(40)
const SLUG = 'Image-Pipeline'

/**
 * Real 48x32 images, one per accepted encoder, inlined so the run needs no
 * fixture files. Handwritten headers would pass the signature check without
 * proving anything, so these are genuine encoder output.
 */
const ENCODED: Record<string, string> = {
  png: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAgCAIAAADbtmxLAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAASUlEQVRYhe2WAQkAQAwCF8cQ9udifYw942ABRPTc0Hx1s64ABUWHaoawZVnHD4IxOlQzhC3LOoTwQYsO1QxhyyKHIhjrdHB4XB8OYAhqJ6EikQAAAABJRU5ErkJggg==',
  jpeg: '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAgADADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAYH/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmgEw1IAAAAAAAAAB/9k=',
  webp: 'UklGRkwAAABXRUJQVlA4IEAAAABwAwCdASowACAAPm02l0ikIyIhJWgAgA2JZwDQvoAAL4uqmAAA/uveL/8Buvi2mX/+rQ/9Wh/6tD9vSB8NrAAA',
  avif: 'AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAACUAAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAADAAAAAgAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAAtbWRhdBIACgk4FS/7SAhoNIAyFhlCYwTAADQAAKxQwBOU9kJ89NO5zY0=',
  gif: 'R0lGODlhMAAgAIAAAExpccg8KCH5BAUAAAAALAAAAAAwACAAAAImjI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jef6XQAAOw==',
}

/** The five types the editor advertises, plus the `.jpeg` spelling. */
const TYPES = [
  { dropped: 'Hero Shot.png', mime: 'image/png', encoding: 'png' },
  { dropped: 'shot.jpg', mime: 'image/jpeg', encoding: 'jpeg' },
  { dropped: 'shot.jpeg', mime: 'image/jpeg', encoding: 'jpeg' },
  { dropped: 'shot.webp', mime: 'image/webp', encoding: 'webp' },
  { dropped: 'shot.avif', mime: 'image/avif', encoding: 'avif' },
  { dropped: 'shot.gif', mime: 'image/gif', encoding: 'gif' },
]

const bytesFor = (encoding: string) =>
  Buffer.from(ENCODED[encoding], 'base64')

function stubGitHub() {
  const captured = { tree: {} as { tree?: Array<Record<string, unknown>> } }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const path = new URL(String(input)).pathname
      if (path.endsWith('/git/ref/heads/main')) {
        return Response.json({ object: { sha: BASE_SHA } })
      }
      if (path.includes('/contents/')) {
        return Response.json({ message: 'Not Found' }, { status: 404 })
      }
      if (path.endsWith(`/git/commits/${BASE_SHA}`)) {
        return Response.json({ tree: { sha: 'b'.repeat(40) } })
      }
      if (path.endsWith('/git/blobs')) {
        return Response.json({ sha: BLOB_SHA }, { status: 201 })
      }
      if (path.endsWith('/git/trees')) {
        captured.tree = JSON.parse(String(init?.body))
        return Response.json({ sha: 'e'.repeat(40) }, { status: 201 })
      }
      if (path.endsWith('/git/commits')) {
        return Response.json({ sha: 'f'.repeat(40) }, { status: 201 })
      }
      if (path.endsWith('/git/refs/heads/main')) {
        return Response.json({ object: { sha: 'f'.repeat(40) } })
      }
      return Response.json({ message: `Unhandled ${path}` }, { status: 404 })
    }),
  )
  return captured
}

/** The blog's own rewriting, copied from src/components/MarkdownRenderer.astro. */
function convertRelativeUrl(url: string, githubBaseUrl: string): string {
  if (
    !githubBaseUrl ||
    url.startsWith('/') ||
    url.startsWith('#') ||
    url.startsWith('//') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(url)
  ) {
    return url
  }
  let baseUrl = githubBaseUrl
  if (
    baseUrl.includes('github.com') &&
    !baseUrl.includes('raw.githubusercontent.com')
  ) {
    baseUrl =
      baseUrl.replace('github.com', 'raw.githubusercontent.com') + '/main'
  }
  if (url.startsWith('./')) return baseUrl + '/' + url.substring(2)
  if (url.startsWith('../')) return baseUrl + '/' + url.replace(/^\.\.\//, '')
  if (!url.includes('://')) return baseUrl + '/' + url
  return url
}

describe('image pipeline, end to end', () => {
  beforeEach(() => {
    process.env.GITHUB_TOKEN = 'ghp_test_personal_access_token'
    delete process.env.GITHUB_PAT
    process.env.GITHUB_REPOSITORY_OWNER = 'tashifkhan'
    process.env.GITHUB_REPOSITORY_NAME = 'Blog'
    process.env.GITHUB_PUBLISH_BRANCH = 'main'
  })

  it('accepts every advertised type through upload and staging', async () => {
    stubGitHub()

    for (const type of TYPES) {
      const filename = normalizeFilename(type.dropped)

      // The file picker's accept attribute must admit the dropped MIME type.
      expect(IMAGE_ACCEPT_ATTRIBUTE.split(',')).toContain(type.mime)
      // The client-side gate in addFiles must admit the normalised name.
      expect(
        IMAGE_FILENAME_PATTERN.test(filename),
        `${type.dropped} -> ${filename} rejected by client`,
      ).toBe(true)

      const contentBase64 = bytesFor(type.encoding).toString('base64')
      const parsed = imageUploadSchema.safeParse({ contentBase64, filename })
      expect(parsed.success, `${filename} rejected by upload schema`).toBe(true)

      const staged = await stageImage({ contentBase64, filename })
      expect(staged, `${filename} failed staging`).toEqual({
        blobSha: BLOB_SHA,
        filename,
        sizeBytes: bytesFor(type.encoding).byteLength,
      })
    }
  })

  it('carries a dropped image from caret to committed path to rendered src', async () => {
    const captured = stubGitHub()
    const filename = normalizeFilename('Hero Shot.png')

    // 1. Dropping inserts Markdown at the caret, as addFiles does.
    const alt = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const inserted = insertBlock(`![${alt}](${assetReference(filename)})`)(
      'Intro paragraph.',
      16,
      16,
    )
    expect(inserted.body).toContain('![hero shot](asset:hero-shot.png)')

    // 2. Building the article resolves `asset:` to the published public path.
    const article = buildArticle(
      {
        body: inserted.body,
        commitMessage: 'content: publish',
        coverImage: '',
        date: '2026-07-30',
        excerpt: 'Excerpt.',
        slug: SLUG,
        tags: 'images',
        title: 'Image pipeline',
      },
      [filename],
    )
    expect(article).toContain(`](/images/blog/${SLUG}/${filename})`)
    expect(findAssetReferences(article)).toEqual([])

    // 3. The publish schema accepts it and the commit writes it under public/.
    const contentBase64 = bytesFor('png').toString('base64')
    const staged = await stageImage({ contentBase64, filename })
    const input = publishArticleSchema.parse({
      articleContent: article,
      commitMessage: 'content: publish',
      expectedHeadSha: BASE_SHA,
      images: [{ blobSha: staged.blobSha, filename: staged.filename }],
      overwrite: false,
      slug: SLUG,
    })
    const published = await publishArticle(input)

    expect(published.imagePaths).toEqual([
      `public/images/blog/${SLUG}/${filename}`,
    ])
    expect(captured.tree.tree).toContainEqual({
      mode: '100644',
      path: `public/images/blog/${SLUG}/${filename}`,
      sha: BLOB_SHA,
      type: 'blob',
    })

    // 4. The blog must serve that committed file, not rewrite it to raw GitHub.
    const src = `/images/blog/${SLUG}/${filename}`
    expect(convertRelativeUrl(src, 'https://github.com/tashifkhan/Blog')).toBe(
      src,
    )
  })

  it('rejects a file whose extension lies about its bytes', async () => {
    stubGitHub()
    await expect(
      stageImage({
        contentBase64: bytesFor('gif').toString('base64'),
        filename: 'shot.png',
      }),
    ).rejects.toMatchObject({ status: 422 })
  })
})
