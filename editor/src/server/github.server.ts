import { createAppAuth } from '@octokit/auth-app'
import matter from 'gray-matter'

import {
  MAX_IMAGE_BYTES,
  articlePathForSlug,
  imagePathFor,
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
  appId: string
  branch: string
  installationId: number
  owner: string
  privateKey: string
  repository: string
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
    return 'GitHub rejected the App credentials. Check the App ID, private key, and installation.'
  }
  if (status === 404) {
    return 'GitHub could not find the repository or branch. Check the repository settings and that the App is installed on it.'
  }
  if (status === 429) {
    return 'GitHub rate limit reached. Wait a moment and publish again.'
  }
  return 'GitHub rejected the publishing request'
}

function publishingConfig(): PublishingConfig {
  const appId = process.env.GITHUB_APP_ID
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const installationId = Number(process.env.GITHUB_APP_INSTALLATION_ID)
  const owner = process.env.GITHUB_REPOSITORY_OWNER || 'tashifkhan'
  const repository = process.env.GITHUB_REPOSITORY_NAME || 'Blog'
  const branch = process.env.GITHUB_PUBLISH_BRANCH || 'main'

  if (!appId || !privateKey || !Number.isSafeInteger(installationId)) {
    throw new ApiError(503, 'GitHub publishing is not configured')
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
    appId,
    branch,
    installationId,
    owner,
    privateKey,
    repository,
  }
}

async function installationToken(config: PublishingConfig): Promise<string> {
  try {
    const auth = createAppAuth({
      appId: config.appId,
      privateKey: config.privateKey,
      installationId: config.installationId,
    })
    const authentication = await auth({ type: 'installation' })
    return authentication.token
  } catch {
    console.error('Could not create GitHub App installation token')
    throw new ApiError(502, 'GitHub App authentication failed')
  }
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
  const token = await installationToken(config)
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
  const token = await installationToken(config)
  const path = articlePathForSlug(slug)
  return {
    branch: config.branch,
    exists: await pathExists(config, token, path),
    path,
  }
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
  const token = await installationToken(config)
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
  const token = await installationToken(config)
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
