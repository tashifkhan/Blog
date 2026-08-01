import matter from 'gray-matter'

import type { Draft } from '../lib/article'
import { draftFromMarkdown, summaryFromMarkdown } from '../lib/parse-article'
import {
  IMAGE_FILENAME_PATTERN,
  MAX_IMAGE_BYTES,
  articlePathForSlug,
  imagePathFor,
  publicImageUrl,
} from '../lib/publishing-rules'
import { ApiError } from './http.server'
import type { ImageUploadInput, PublishArticleInput } from './publishing-schema'

const GITHUB_API = 'https://api.github.com'
const GITHUB_API_VERSION = '2022-11-28'
const COMMIT_AUTHOR = {
  name: 'tashifkhan',
  email: 'tashifkhan010@gmail.com',
} as const

type PublishingConfig = {
  branch: string
  owner: string
  repository: string
  /** Classic or fine-grained personal access token. */
  token: string
}

type GitHubErrorPayload = {
  message?: string
}

class GitHubApiError extends ApiError {
  constructor(
    public readonly githubStatus: number,
    message: string,
  ) {
    super(502, message)
  }
}

/**
 * GitHub's own message can echo request content, so it is logged rather than
 * returned. These map the status to something actionable without leaking it.
 */
function githubFailureMessage(status: number): string {
  if (status === 401 || status === 403) {
    return 'GitHub rejected the personal access token. Check GITHUB_TOKEN scopes (Contents read/write on the blog repo) and that the token has not expired.'
  }
  if (status === 404) {
    return 'GitHub could not find the repository or branch. Check GITHUB_REPOSITORY_OWNER, GITHUB_REPOSITORY_NAME, and that the token can access the repo.'
  }
  if (status === 429) {
    return 'GitHub rate limit reached. Wait a moment and publish again.'
  }
  return 'GitHub rejected the publishing request'
}

/**
 * Prefer `GITHUB_TOKEN`; accept `GITHUB_PAT` as an alias.
 * Values that look like placeholders are treated as unset.
 */
function readGitHubToken(): string | null {
  const raw =
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.GITHUB_PAT?.trim() ||
    ''
  if (!raw) return null
  if (/^(changeme|your[_-]?token|xxx+|<.*>)$/i.test(raw)) return null
  return raw
}

/** True when a GitHub personal access token is present. */
export function isGitHubConfigured(): boolean {
  return Boolean(readGitHubToken())
}

export function publishBranchName(): string {
  return process.env.GITHUB_PUBLISH_BRANCH?.trim() || 'main'
}

function publishingConfig(): PublishingConfig {
  const token = readGitHubToken()
  const owner = process.env.GITHUB_REPOSITORY_OWNER || 'tashifkhan'
  const repository = process.env.GITHUB_REPOSITORY_NAME || 'Blog'
  const branch = process.env.GITHUB_PUBLISH_BRANCH || 'main'

  if (!token) {
    throw new ApiError(
      503,
      'GitHub publishing is not configured. Set GITHUB_TOKEN (a personal access token with Contents read/write on the blog repo) on the editor server.',
    )
  }
  if (
    !branch ||
    branch.startsWith('/') ||
    branch.endsWith('/') ||
    branch.includes('..') ||
    !/^[A-Za-z0-9._/-]+$/.test(branch)
  ) {
    throw new ApiError(503, 'GitHub publish branch is invalid')
  }

  return {
    branch,
    owner,
    repository,
    token,
  }
}

/** PAT is used directly — no App installation exchange. */
function accessToken(config: PublishingConfig): string {
  return config.token
}

async function githubRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
  /** Statuses that are an expected answer here, so they are not logged. */
  options: { quietStatuses?: number[] } = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${GITHUB_API}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Tashif-Pressroom',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(502, 'Could not reach GitHub')
  }

  const text = await response.text()
  let payload: unknown = {}
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      throw new ApiError(502, 'GitHub returned an invalid response')
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null
        ? (payload as GitHubErrorPayload).message
        : undefined
    if (!options.quietStatuses?.includes(response.status)) {
      console.error(
        `GitHub API ${response.status}: ${message || 'Unknown error'}`,
      )
    }
    throw new GitHubApiError(
      response.status,
      githubFailureMessage(response.status),
    )
  }

  return payload as T
}

function repositoryPath(config: PublishingConfig): string {
  return `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(
    config.repository,
  )}`
}

async function branchHead(
  config: PublishingConfig,
  token: string,
): Promise<string> {
  const result = await githubRequest<{ object?: { sha?: string } }>(
    `${repositoryPath(config)}/git/ref/heads/${encodeURIComponent(config.branch)}`,
    token,
  )
  const sha = result.object?.sha
  if (!sha) {
    throw new ApiError(502, 'GitHub branch did not return a head SHA')
  }
  return sha
}

/**
 * Whether a path already exists on the publish branch.
 *
 * The path is built from a slug that has already matched `SLUG_PATTERN`, so it
 * contains no characters needing escaping — but a 404 here is an expected
 * answer rather than a failure, so it is caught instead of propagated.
 */
async function pathExists(
  config: PublishingConfig,
  token: string,
  path: string,
): Promise<boolean> {
  try {
    await githubRequest(
      `${repositoryPath(config)}/contents/${path}?ref=${encodeURIComponent(
        config.branch,
      )}`,
      token,
      {},
      { quietStatuses: [404] },
    )
    return true
  } catch (error) {
    if (error instanceof GitHubApiError && error.githubStatus === 404) {
      return false
    }
    throw error
  }
}

async function createBlob(
  config: PublishingConfig,
  token: string,
  content: Uint8Array,
): Promise<string> {
  const result = await githubRequest<{ sha?: string }>(
    `${repositoryPath(config)}/git/blobs`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        content: Buffer.from(content).toString('base64'),
        encoding: 'base64',
      }),
    },
  )
  if (!result.sha) {
    throw new ApiError(502, 'GitHub did not return a blob SHA')
  }
  return result.sha
}

function decodeImage(contentBase64: string): Uint8Array {
  const decoded = Buffer.from(contentBase64, 'base64')
  if (
    decoded.length === 0 ||
    decoded.length > MAX_IMAGE_BYTES ||
    decoded.toString('base64') !== contentBase64
  ) {
    throw new ApiError(422, 'Invalid or oversized image data')
  }
  return decoded
}

function hasExpectedImageSignature(
  filename: string,
  content: Uint8Array,
): boolean {
  const extension = filename.split('.').at(-1)?.toLowerCase()
  const startsWith = (...bytes: number[]) =>
    bytes.every((byte, index) => content[index] === byte)

  if (extension === 'jpg' || extension === 'jpeg') {
    return startsWith(0xff, 0xd8, 0xff)
  }
  if (extension === 'png') {
    return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
  }
  if (extension === 'gif') {
    const header = Buffer.from(content.subarray(0, 6)).toString('ascii')
    return header === 'GIF87a' || header === 'GIF89a'
  }
  if (extension === 'webp') {
    return (
      Buffer.from(content.subarray(0, 4)).toString('ascii') === 'RIFF' &&
      Buffer.from(content.subarray(8, 12)).toString('ascii') === 'WEBP'
    )
  }
  if (extension === 'avif') {
    const marker = Buffer.from(content.subarray(4, 12)).toString('ascii')
    return marker === 'ftypavif' || marker === 'ftypavis'
  }
  return false
}

function validateArticle(articleContent: string): void {
  let parsed: matter.GrayMatterFile<string>
  try {
    parsed = matter(articleContent)
  } catch {
    throw new ApiError(422, 'Article frontmatter is invalid')
  }

  if (typeof parsed.data.title !== 'string' || !parsed.data.title.trim()) {
    throw new ApiError(422, 'Article frontmatter must include a title')
  }
  if (!parsed.content.trim()) {
    throw new ApiError(422, 'Article body cannot be empty')
  }
}

export async function getPublishHead(): Promise<{
  branch: string
  headSha: string
}> {
  const config = publishingConfig()
  const token = accessToken(config)
  return {
    branch: config.branch,
    headSha: await branchHead(config, token),
  }
}

/**
 * Whether publishing this slug would replace an existing post. The editor calls
 * this while the slug is being typed so the collision surfaces before any work
 * is done, not after every image has been uploaded.
 */
export async function inspectSlug(slug: string): Promise<{
  branch: string
  exists: boolean
  path: string
}> {
  const config = publishingConfig()
  const token = accessToken(config)
  const path = articlePathForSlug(slug)
  return {
    branch: config.branch,
    exists: await pathExists(config, token, path),
    path,
  }
}

type ContentsEntry = {
  download_url?: string | null
  name?: string
  path?: string
  sha?: string
  type?: string
  encoding?: string
  content?: string
}

export type PostListItem = {
  coverImage: string | null
  date: string
  excerpt: string
  path: string
  slug: string
  tags: string[]
  title: string
}

export type LoadedPostImage = {
  downloadUrl: string
  filename: string
  publicUrl: string
}

export type LoadedPost = {
  branch: string
  draft: Draft
  images: LoadedPostImage[]
  path: string
  slug: string
}

async function readFileText(
  config: PublishingConfig,
  token: string,
  path: string,
): Promise<string> {
  try {
    const entry = await githubRequest<ContentsEntry>(
      `${repositoryPath(config)}/contents/${path}?ref=${encodeURIComponent(
        config.branch,
      )}`,
      token,
      {},
      { quietStatuses: [404] },
    )
    if (entry.encoding === 'base64' && typeof entry.content === 'string') {
      return Buffer.from(entry.content.replace(/\n/g, ''), 'base64').toString(
        'utf8',
      )
    }
    if (entry.download_url) {
      const response = await fetch(entry.download_url, {
        headers: {
          Accept: 'application/vnd.github.raw',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Tashif-Pressroom',
        },
      })
      if (!response.ok) {
        throw new ApiError(502, `Could not download ${path}`)
      }
      return await response.text()
    }
    throw new ApiError(502, `GitHub returned no content for ${path}`)
  } catch (error) {
    if (error instanceof GitHubApiError && error.githubStatus === 404) {
      throw new ApiError(404, `No post at ${path}`)
    }
    throw error
  }
}

/**
 * Every Markdown post under `src/blogs/` on the publish branch, newest first.
 * Frontmatter is read from each file so the desk can show titles without a
 * separate metadata store.
 */
export async function listPostsFromGitHub(): Promise<{
  branch: string
  posts: PostListItem[]
}> {
  const config = publishingConfig()
  const token = accessToken(config)
  const dirPath = 'src/blogs'

  let entries: ContentsEntry[] = []
  try {
    const payload = await githubRequest<ContentsEntry[] | ContentsEntry>(
      `${repositoryPath(config)}/contents/${dirPath}?ref=${encodeURIComponent(
        config.branch,
      )}`,
      token,
      {},
      { quietStatuses: [404] },
    )
    entries = Array.isArray(payload) ? payload : []
  } catch (error) {
    if (error instanceof GitHubApiError && error.githubStatus === 404) {
      return { branch: config.branch, posts: [] }
    }
    throw error
  }

  const markdownFiles = entries.filter(
    (entry) =>
      entry.type === 'file' &&
      typeof entry.name === 'string' &&
      entry.name.toLowerCase().endsWith('.md') &&
      typeof entry.path === 'string',
  )

  const posts = await Promise.all(
    markdownFiles.map(async (entry) => {
      const name = entry.name as string
      const path = entry.path as string
      const slug = name.replace(/\.md$/i, '')
      try {
        const markdown = await readFileText(config, token, path)
        const summary = summaryFromMarkdown(slug, markdown)
        return {
          ...summary,
          path,
          slug,
        } satisfies PostListItem
      } catch {
        return {
          coverImage: null,
          date: '',
          excerpt: '',
          path,
          slug,
          tags: [],
          title: slug,
        } satisfies PostListItem
      }
    }),
  )

  posts.sort((a, b) => {
    const byDate = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    if (byDate !== 0) return byDate
    return a.slug.localeCompare(b.slug)
  })

  return { branch: config.branch, posts }
}

async function listPostImages(
  config: PublishingConfig,
  token: string,
  slug: string,
): Promise<LoadedPostImage[]> {
  const dirPath = `public/images/blog/${slug}`
  try {
    const payload = await githubRequest<ContentsEntry[] | ContentsEntry>(
      `${repositoryPath(config)}/contents/${dirPath}?ref=${encodeURIComponent(
        config.branch,
      )}`,
      token,
      {},
      { quietStatuses: [404] },
    )
    const entries = Array.isArray(payload) ? payload : []
    return entries
      .filter(
        (entry) =>
          entry.type === 'file' &&
          typeof entry.name === 'string' &&
          IMAGE_FILENAME_PATTERN.test(entry.name),
      )
      .map((entry) => {
        const filename = entry.name as string
        return {
          filename,
          publicUrl: publicImageUrl(slug, filename),
          downloadUrl:
            entry.download_url ||
            `https://raw.githubusercontent.com/${config.owner}/${config.repository}/${config.branch}/${dirPath}/${filename}`,
        }
      })
  } catch (error) {
    if (error instanceof GitHubApiError && error.githubStatus === 404) {
      return []
    }
    throw error
  }
}

/** Load one post into a draft the editor can open for editing. */
export async function loadPostFromGitHub(slug: string): Promise<LoadedPost> {
  const config = publishingConfig()
  const token = accessToken(config)
  const path = articlePathForSlug(slug)
  const markdown = await readFileText(config, token, path)
  const draft = draftFromMarkdown(slug, markdown)
  const images = await listPostImages(config, token, slug)

  return {
    branch: config.branch,
    draft,
    images,
    path,
    slug,
  }
}

/** @deprecated Use listPostsFromGitHub or posts-source.listPosts */
export async function listPosts(): Promise<{
  branch: string
  posts: PostListItem[]
}> {
  return listPostsFromGitHub()
}

/** @deprecated Use loadPostFromGitHub or posts-source.loadPost */
export async function loadPost(slug: string): Promise<LoadedPost> {
  return loadPostFromGitHub(slug)
}

export async function stageImage(input: ImageUploadInput): Promise<{
  filename: string
  blobSha: string
  sizeBytes: number
}> {
  const content = decodeImage(input.contentBase64)
  if (!hasExpectedImageSignature(input.filename, content)) {
    throw new ApiError(422, 'Image bytes do not match its filename extension')
  }

  const config = publishingConfig()
  const token = accessToken(config)
  const blobSha = await createBlob(config, token, content)
  return {
    filename: input.filename,
    blobSha,
    sizeBytes: content.byteLength,
  }
}

export async function publishArticle(input: PublishArticleInput): Promise<{
  articlePath: string
  author: typeof COMMIT_AUTHOR
  branch: string
  commitSha: string
  commitUrl: string
  imagePaths: string[]
  message: string
  replaced: boolean
}> {
  validateArticle(input.articleContent)
  const config = publishingConfig()
  const token = accessToken(config)
  const currentHead = await branchHead(config, token)

  if (currentHead !== input.expectedHeadSha) {
    throw new ApiError(
      409,
      'The publish branch moved since this tab loaded. Sync to the latest commit and review before publishing again.',
      'head_stale',
    )
  }

  const articlePath = articlePathForSlug(input.slug)
  const replaced = await pathExists(config, token, articlePath)
  if (replaced && !input.overwrite) {
    throw new ApiError(
      409,
      `A post already exists at ${articlePath}. Confirm the replacement before publishing.`,
      'slug_exists',
    )
  }

  const baseCommit = await githubRequest<{ tree?: { sha?: string } }>(
    `${repositoryPath(config)}/git/commits/${currentHead}`,
    token,
  )
  const baseTree = baseCommit.tree?.sha
  if (!baseTree) {
    throw new ApiError(502, 'GitHub did not return the base tree')
  }

  const articleBlob = await createBlob(
    config,
    token,
    new TextEncoder().encode(input.articleContent),
  )
  const treeEntries = [
    {
      mode: '100644',
      path: articlePath,
      sha: articleBlob,
      type: 'blob',
    },
  ]
  const imagePaths = input.images.map((image) => {
    const path = imagePathFor(input.slug, image.filename)
    treeEntries.push({
      mode: '100644',
      path,
      sha: image.blobSha,
      type: 'blob',
    })
    return path
  })

  const tree = await githubRequest<{ sha?: string }>(
    `${repositoryPath(config)}/git/trees`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTree, tree: treeEntries }),
    },
  )
  if (!tree.sha) {
    throw new ApiError(502, 'GitHub did not return the new tree')
  }

  const commit = await githubRequest<{ sha?: string }>(
    `${repositoryPath(config)}/git/commits`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        author: {
          ...COMMIT_AUTHOR,
          date: new Date().toISOString(),
        },
        message: input.commitMessage,
        parents: [currentHead],
        tree: tree.sha,
      }),
    },
  )
  if (!commit.sha) {
    throw new ApiError(502, 'GitHub did not return the new commit')
  }

  try {
    await githubRequest(
      `${repositoryPath(config)}/git/refs/heads/${encodeURIComponent(config.branch)}`,
      token,
      {
        method: 'PATCH',
        body: JSON.stringify({ force: false, sha: commit.sha }),
      },
    )
  } catch (error) {
    if (
      error instanceof GitHubApiError &&
      (error.githubStatus === 409 || error.githubStatus === 422)
    ) {
      throw new ApiError(
        409,
        'The branch moved while publishing. It was not force-updated.',
        'head_stale',
      )
    }
    throw error
  }

  return {
    articlePath,
    author: COMMIT_AUTHOR,
    branch: config.branch,
    commitSha: commit.sha,
    commitUrl: `https://github.com/${config.owner}/${config.repository}/commit/${commit.sha}`,
    imagePaths,
    message: input.commitMessage,
    replaced,
  }
}
