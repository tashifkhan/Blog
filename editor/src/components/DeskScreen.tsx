import {
  FilePlus2,
  LoaderCircle,
  LogOut,
  PenLine,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Draft } from '../lib/article'
import { ClientApiError, apiRequest } from '../lib/client-api'
import { ThemeToggle } from './ThemeToggle'

export type DeskPost = {
  coverImage: string | null
  date: string
  excerpt: string
  path: string
  slug: string
  tags: string[]
  title: string
}

type PostsSource = 'github' | 'local' | 'blog-api'

const SOURCE_LABEL: Record<PostsSource, string> = {
  github: 'GitHub',
  local: 'local files',
  'blog-api': 'blog.tashif.codes',
}

export type LocalDraftSummary = {
  date: string
  excerpt: string
  slug: string
  title: string
  updatedHint: string
}

type DeskScreenProps = {
  localDraft: LocalDraftSummary | null
  onDiscardLocalDraft: () => void
  onEditPost: (slug: string) => void
  onNewStory: () => void
  onResumeLocalDraft: () => void
  onSignedOut: () => void
}

const BLOG_ORIGIN = 'https://blog.tashif.codes'

function coverSrc(path: string | null): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${BLOG_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`
}

function formatDate(value: string): string {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function DeskScreen({
  localDraft,
  onDiscardLocalDraft,
  onEditPost,
  onNewStory,
  onResumeLocalDraft,
  onSignedOut,
}: DeskScreenProps) {
  const [posts, setPosts] = useState<DeskPost[]>([])
  const [branch, setBranch] = useState('')
  const [source, setSource] = useState<PostsSource | null>(null)
  const [publishingReady, setPublishingReady] = useState(true)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openingSlug, setOpeningSlug] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiRequest<{
        branch: string
        posts: DeskPost[]
        source?: PostsSource
        publishingReady?: boolean
      }>('/api/publish/posts')
      setPosts(response.posts)
      setBranch(response.branch)
      setSource(response.source ?? null)
      setPublishingReady(response.publishingReady !== false)
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.status === 401) {
        onSignedOut()
        return
      }
      setError(
        caught instanceof Error
          ? caught.message
          : 'Could not load posts',
      )
    } finally {
      setLoading(false)
    }
  }, [onSignedOut])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [posts, query])

  async function signOut() {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST', body: '{}' })
    } finally {
      onSignedOut()
    }
  }

  function handleEdit(slug: string) {
    setOpeningSlug(slug)
    onEditPost(slug)
  }

  return (
    <main className="editor-shell desk-shell">
      <header className="editor-header">
        <div className="brand-lockup">
          <div className="brand-mark">P</div>
          <div>
            <span className="eyebrow">Tashif’s private desk</span>
            <strong>Pressroom</strong>
          </div>
        </div>

        <div className="header-status" aria-live="polite">
          <span className={`status-dot ${loading ? 'busy' : ''}`} />
          <span>
            {loading
              ? 'Loading stories…'
              : source
                ? `${posts.length} via ${SOURCE_LABEL[source]}`
                : branch
                  ? `${posts.length} on ${branch}`
                  : 'Stories'}
          </span>
        </div>

        <div className="header-actions">
          <button
            className="quiet-button"
            type="button"
            onClick={() => void loadPosts()}
            disabled={loading}
            title="Refresh list from GitHub"
          >
            <RefreshCw
              className={loading ? 'spin' : undefined}
              size={15}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </button>
          <ThemeToggle />
          <button className="quiet-button" type="button" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <div className="desk-layout">
        <section className="desk-hero">
          <div>
            <span className="eyebrow">Story library</span>
            <h1>What are you working on?</h1>
            <p>
              Open an existing post to revise it, or start a blank story. Local
              drafts stay on this device until you publish.
            </p>
          </div>
          <button className="desk-new-button" type="button" onClick={onNewStory}>
            <FilePlus2 size={18} aria-hidden="true" />
            New story
          </button>
        </section>

        {!publishingReady && !loading ? (
          <section className="desk-github-hint" role="status">
            <strong>Reading works — publishing needs a GitHub token.</strong>
            <p>
              Stories are loaded from{' '}
              {source ? SOURCE_LABEL[source] : 'a fallback source'}. To commit
              changes, set <code>GITHUB_TOKEN</code> (a personal access token
              with Contents read/write on the blog repo) in the editor server
              env (Docker: <code>editor/.env</code>), then restart Pressroom.
            </p>
          </section>
        ) : null}

        {localDraft ? (
          <section className="desk-local-draft" aria-label="Local draft">
            <div className="desk-local-body">
              <span className="desk-local-badge">Unsaved draft</span>
              <strong>{localDraft.title || 'Untitled story'}</strong>
              <p>
                {localDraft.excerpt ||
                  (localDraft.slug
                    ? `/${localDraft.slug}`
                    : 'No slug yet')}
                {localDraft.updatedHint
                  ? ` · ${localDraft.updatedHint}`
                  : ''}
              </p>
            </div>
            <div className="desk-local-actions">
              <button type="button" onClick={onResumeLocalDraft}>
                <PenLine size={15} aria-hidden="true" />
                Resume
              </button>
              <button
                type="button"
                className="desk-discard"
                onClick={onDiscardLocalDraft}
              >
                <Trash2 size={15} aria-hidden="true" />
                Discard
              </button>
            </div>
          </section>
        ) : null}

        <div className="desk-toolbar">
          <label className="desk-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, slug, tag…"
              aria-label="Search posts"
            />
          </label>
          <span className="desk-count">
            {filtered.length}
            {query ? ` match${filtered.length === 1 ? '' : 'es'}` : ' published'}
          </span>
        </div>

        {error ? (
          <div className="desk-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void loadPosts()}>
              Try again
            </button>
          </div>
        ) : null}

        {loading && posts.length === 0 ? (
          <div className="desk-loading">
            <LoaderCircle className="spin" size={22} />
            <span>Reading src/blogs/ from GitHub…</span>
          </div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="desk-empty">
            <p>
              {query
                ? 'No stories match that search.'
                : 'No published posts yet. Start the first one.'}
            </p>
            {!query ? (
              <button type="button" onClick={onNewStory}>
                <FilePlus2 size={16} aria-hidden="true" />
                New story
              </button>
            ) : null}
          </div>
        ) : null}

        <ul className="desk-grid">
          {filtered.map((post) => {
            const cover = coverSrc(post.coverImage)
            const busy = openingSlug === post.slug
            return (
              <li key={post.slug}>
                <button
                  type="button"
                  className="desk-card"
                  onClick={() => handleEdit(post.slug)}
                  disabled={Boolean(openingSlug)}
                >
                  <div className={`desk-card-cover ${cover ? '' : 'empty'}`}>
                    {cover ? (
                      <img src={cover} alt="" loading="lazy" />
                    ) : (
                      <span>{post.title.slice(0, 1) || '·'}</span>
                    )}
                  </div>
                  <div className="desk-card-body">
                    <div className="desk-card-meta">
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      <code>/{post.slug}</code>
                    </div>
                    <strong>{post.title}</strong>
                    {post.excerpt ? (
                      <p className="desk-card-excerpt">{post.excerpt}</p>
                    ) : null}
                    {post.tags.length ? (
                      <ul className="desk-card-tags">
                        {post.tags.slice(0, 4).map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    ) : null}
                    <span className="desk-card-cta">
                      {busy ? (
                        <>
                          <LoaderCircle
                            className="spin"
                            size={14}
                            aria-hidden="true"
                          />
                          Opening…
                        </>
                      ) : (
                        <>
                          <PenLine size={14} aria-hidden="true" />
                          Edit
                        </>
                      )}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}

/** Read a stored draft blob without depending on EditorWorkspace. */
export function readLocalDraftSummary(
  storageKey: string,
): LocalDraftSummary | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Draft>
    const hasContent =
      Boolean(parsed.title?.trim()) ||
      Boolean(parsed.body?.trim()) ||
      Boolean(parsed.excerpt?.trim()) ||
      Boolean(parsed.slug?.trim())
    if (!hasContent) return null
    return {
      title: parsed.title ?? '',
      slug: parsed.slug ?? '',
      excerpt: parsed.excerpt ?? '',
      date: parsed.date ?? '',
      updatedHint: 'saved on this device',
    }
  } catch {
    return null
  }
}

export function readLocalDraft(storageKey: string): Draft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    return JSON.parse(raw) as Draft
  } catch {
    return null
  }
}
