import { LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import type { Draft } from '../lib/article'
import { DRAFT_KEY } from '../lib/draft-storage'
import { ClientApiError, apiRequest } from '../lib/client-api'
import {
  DeskScreen,
  readLocalDraft,
  readLocalDraftSummary,
  type LocalDraftSummary,
} from './DeskScreen'
import {
  EditorWorkspace,
  type EditorSession,
  type PublishedImageSeed,
} from './EditorWorkspace'
import { LoginScreen } from './LoginScreen'

type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: string }

type AppView =
  | { id: 'desk' }
  | { id: 'editor'; session: EditorSession }

export function EditorApp() {
  const [session, setSession] = useState<SessionState>({ status: 'loading' })
  const [view, setView] = useState<AppView>({ id: 'desk' })
  const [localDraft, setLocalDraft] = useState<LocalDraftSummary | null>(null)
  const [bootError, setBootError] = useState('')
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest<{ authenticated: boolean; user: string | null }>(
      '/api/auth/session',
    )
      .then((identity) => {
        if (!active) return
        setSession(
          identity.authenticated && identity.user
            ? { status: 'authenticated', user: identity.user }
            : { status: 'anonymous' },
        )
      })
      .catch(() => {
        if (active) setSession({ status: 'anonymous' })
      })
    return () => {
      active = false
    }
  }, [])

  const refreshLocalDraft = useCallback(() => {
    setLocalDraft(readLocalDraftSummary(DRAFT_KEY))
  }, [])

  useEffect(() => {
    if (session.status === 'authenticated') refreshLocalDraft()
  }, [session.status, refreshLocalDraft])

  if (session.status === 'loading') {
    return (
      <main className="loading-screen">
        <LoaderCircle className="spin" size={24} />
        <span>Opening the pressroom…</span>
      </main>
    )
  }

  if (session.status === 'anonymous') {
    return (
      <LoginScreen
        onAuthenticated={() =>
          setSession({ status: 'authenticated', user: 'tashifkhan' })
        }
      />
    )
  }

  if (opening) {
    return (
      <main className="loading-screen">
        <LoaderCircle className="spin" size={24} />
        <span>Loading story from GitHub…</span>
      </main>
    )
  }

  if (view.id === 'editor') {
    return (
      <EditorWorkspace
        session={view.session}
        onBackToDesk={() => {
          refreshLocalDraft()
          setView({ id: 'desk' })
          setBootError('')
        }}
        onSignedOut={() => setSession({ status: 'anonymous' })}
      />
    )
  }

  return (
    <>
      {bootError ? (
        <div className="desk-boot-error" role="alert">
          {bootError}
          <button type="button" onClick={() => setBootError('')}>
            Dismiss
          </button>
        </div>
      ) : null}
      <DeskScreen
        localDraft={localDraft}
        onDiscardLocalDraft={() => {
          window.localStorage.removeItem(DRAFT_KEY)
          setLocalDraft(null)
        }}
        onNewStory={() => {
          window.localStorage.removeItem(DRAFT_KEY)
          setLocalDraft(null)
          setView({ id: 'editor', session: { kind: 'new' } })
        }}
        onResumeLocalDraft={() => {
          const draft = readLocalDraft(DRAFT_KEY)
          if (!draft) {
            setLocalDraft(null)
            return
          }
          setView({
            id: 'editor',
            session: { kind: 'local', draft: ensureDraft(draft) },
          })
        }}
        onEditPost={(slug) => {
          void (async () => {
            setOpening(true)
            setBootError('')
            try {
              const loaded = await apiRequest<{
                draft: Draft
                images: PublishedImageSeed[]
                slug: string
              }>(`/api/publish/posts/${encodeURIComponent(slug)}`)
              setView({
                id: 'editor',
                session: {
                  kind: 'edit',
                  draft: ensureDraft(loaded.draft),
                  images: loaded.images,
                  sourceSlug: loaded.slug,
                },
              })
            } catch (caught) {
              if (caught instanceof ClientApiError && caught.status === 401) {
                setSession({ status: 'anonymous' })
                return
              }
              setBootError(
                caught instanceof Error
                  ? caught.message
                  : 'Could not open that post',
              )
            } finally {
              setOpening(false)
            }
          })()
        }}
        onSignedOut={() => setSession({ status: 'anonymous' })}
      />
    </>
  )
}

function ensureDraft(value: Partial<Draft> & Pick<Draft, 'body' | 'slug'>): Draft {
  return {
    body: value.body ?? '',
    commitMessage: value.commitMessage ?? '',
    coverImage: value.coverImage ?? '',
    date: value.date ?? new Date().toISOString().slice(0, 10),
    excerpt: value.excerpt ?? '',
    slug: value.slug ?? '',
    tags: value.tags ?? '',
    title: value.title ?? '',
  }
}
