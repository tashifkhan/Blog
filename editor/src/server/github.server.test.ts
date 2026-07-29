import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@octokit/auth-app', () => ({
  createAppAuth: () => async () => ({ token: 'installation-token' }),
}))

import { publishArticle, stageImage } from './github.server'

const BASE_SHA = 'a'.repeat(40)
const BASE_TREE_SHA = 'b'.repeat(40)
const ARTICLE_BLOB_SHA = 'c'.repeat(40)
const IMAGE_BLOB_SHA = 'd'.repeat(40)
const NEW_TREE_SHA = 'e'.repeat(40)
const NEW_COMMIT_SHA = 'f'.repeat(40)

const ARTICLE_PATH = '/contents/src/blogs/Atomic-Publishing.md'

function githubResponse(payload: unknown, status = 200): Response {
  return Response.json(payload, { status })
}

/**
 * @param existingArticle whether the slug already has a post on the branch
 */
function stubGitHub(options: { existingArticle?: boolean } = {}) {
  const captured = {
    commit: {} as Record<string, unknown>,
    ref: {} as Record<string, unknown>,
    tree: {} as {
      base_tree?: string
      tree?: Array<Record<string, unknown>>
    },
  }

  const fetchMock = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const path = new URL(String(input)).pathname
      if (path.endsWith('/git/ref/heads/main')) {
        return githubResponse({ object: { sha: BASE_SHA } })
      }
      if (path.endsWith(ARTICLE_PATH)) {
        return options.existingArticle
          ? githubResponse({ path: 'src/blogs/Atomic-Publishing.md' })
          : githubResponse({ message: 'Not Found' }, 404)
      }
      if (path.endsWith(`/git/commits/${BASE_SHA}`)) {
        return githubResponse({ tree: { sha: BASE_TREE_SHA } })
      }
      if (path.endsWith('/git/blobs')) {
        return githubResponse({ sha: ARTICLE_BLOB_SHA }, 201)
      }
      if (path.endsWith('/git/trees')) {
        captured.tree = JSON.parse(String(init?.body))
        return githubResponse({ sha: NEW_TREE_SHA }, 201)
      }
      if (path.endsWith('/git/commits')) {
        captured.commit = JSON.parse(String(init?.body))
        return githubResponse({ sha: NEW_COMMIT_SHA }, 201)
      }
      if (path.endsWith('/git/refs/heads/main')) {
        captured.ref = JSON.parse(String(init?.body))
        return githubResponse({ object: { sha: NEW_COMMIT_SHA } })
      }
      return githubResponse({ message: `Unhandled ${path}` }, 404)
    },
  )

  vi.stubGlobal('fetch', fetchMock)
  return { captured, fetchMock }
}

const BASE_INPUT = {
  articleContent: '---\ntitle: "Atomic publishing"\n---\n\n## Body\n\nText.\n',
  commitMessage: 'content: publish',
  expectedHeadSha: BASE_SHA,
  images: [],
  overwrite: false,
  slug: 'Atomic-Publishing',
}

describe('GitHub publishing', () => {
  beforeEach(() => {
    process.env.GITHUB_APP_ID = '123'
    process.env.GITHUB_APP_PRIVATE_KEY = 'test-private-key'
    process.env.GITHUB_APP_INSTALLATION_ID = '456'
    process.env.GITHUB_REPOSITORY_OWNER = 'tashifkhan'
    process.env.GITHUB_REPOSITORY_NAME = 'Blog'
    process.env.GITHUB_PUBLISH_BRANCH = 'main'
  })

  it('publishes one atomic commit with the exact message and fixed author', async () => {
    const { captured } = stubGitHub()

    const message = '  content: preserve this message exactly  '
    const result = await publishArticle({
      ...BASE_INPUT,
      commitMessage: message,
      images: [{ blobSha: IMAGE_BLOB_SHA, filename: 'cover.webp' }],
    })

    expect(captured.commit.message).toBe(message)
    expect(captured.commit.author).toMatchObject({
      email: 'tashifkhan010@gmail.com',
      name: 'tashifkhan',
    })
    expect(captured.commit.parents).toEqual([BASE_SHA])
    expect(captured.tree.base_tree).toBe(BASE_TREE_SHA)
    expect(captured.tree.tree).toEqual([
      {
        mode: '100644',
        path: 'src/blogs/Atomic-Publishing.md',
        sha: ARTICLE_BLOB_SHA,
        type: 'blob',
      },
      {
        mode: '100644',
        path: 'public/images/blog/Atomic-Publishing/cover.webp',
        sha: IMAGE_BLOB_SHA,
        type: 'blob',
      },
    ])
    expect(captured.ref).toEqual({ force: false, sha: NEW_COMMIT_SHA })
    expect(result.commitSha).toBe(NEW_COMMIT_SHA)
    expect(result.replaced).toBe(false)
    expect(result.author).toEqual({
      email: 'tashifkhan010@gmail.com',
      name: 'tashifkhan',
    })
  })

  it('refuses to replace an existing post unless overwrite was confirmed', async () => {
    const { fetchMock } = stubGitHub({ existingArticle: true })

    await expect(publishArticle(BASE_INPUT)).rejects.toMatchObject({
      status: 409,
      code: 'slug_exists',
    })
    // Head lookup and the existence probe only: nothing was written.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('replaces an existing post once overwrite is confirmed', async () => {
    const { captured } = stubGitHub({ existingArticle: true })

    const result = await publishArticle({ ...BASE_INPUT, overwrite: true })

    expect(result.replaced).toBe(true)
    expect(result.commitSha).toBe(NEW_COMMIT_SHA)
    expect(captured.ref).toEqual({ force: false, sha: NEW_COMMIT_SHA })
  })

  it('rejects a stale editor head before creating a blob', async () => {
    const fetchMock = vi.fn(async () =>
      githubResponse({ object: { sha: '9'.repeat(40) } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(publishArticle(BASE_INPUT)).rejects.toMatchObject({
      status: 409,
      code: 'head_stale',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('validates and stages image bytes without changing the branch', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    )
    let capturedBlob: Record<string, unknown> = {}
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) => {
        capturedBlob = JSON.parse(String(init?.body))
        return githubResponse({ sha: IMAGE_BLOB_SHA }, 201)
      },
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await stageImage({
      contentBase64: png.toString('base64'),
      filename: 'diagram.png',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(capturedBlob).toEqual({
      content: png.toString('base64'),
      encoding: 'base64',
    })
    expect(result).toEqual({
      blobSha: IMAGE_BLOB_SHA,
      filename: 'diagram.png',
      sizeBytes: png.length,
    })
  })

  it('rejects an image whose bytes do not match its extension', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      stageImage({
        contentBase64: Buffer.from('not a png').toString('base64'),
        filename: 'diagram.png',
      }),
    ).rejects.toMatchObject({ status: 422 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
