import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { apiRequest } from '../lib/client-api'
import { EditorWorkspace } from './EditorWorkspace'
import { LoginScreen } from './LoginScreen'

type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: string }

export function EditorApp() {
  const [session, setSession] = useState<SessionState>({ status: 'loading' })

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

  return (
    <EditorWorkspace
      onSignedOut={() => setSession({ status: 'anonymous' })}
    />
  )
}
