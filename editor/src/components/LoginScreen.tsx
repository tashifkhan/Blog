import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { apiRequest } from '../lib/client-api'
import { ThemeToggle } from './ThemeToggle'

type LoginScreenProps = {
  onAuthenticated: () => void
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      setPassword('')
      onAuthenticated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-card-top">
          <div className="masthead-mark" aria-hidden="true">
            P
          </div>
          <ThemeToggle className="login-theme-toggle" />
        </div>
        <p className="eyebrow">Private editorial desk</p>
        <h1>Enter the pressroom.</h1>
        <p className="login-copy">
          This workspace can publish directly to the blog repository. Access is
          restricted to the editor owner.
        </p>

        <form onSubmit={submit} className="login-form">
          <label htmlFor="editor-password">Editor password</label>
          <div className="password-field">
            <KeyRound size={18} aria-hidden="true" />
            <input
              id="editor-password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your private access phrase"
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button
            className="primary-button login-button"
            type="submit"
            disabled={submitting || !password}
          >
            <span>{submitting ? 'Verifying…' : 'Open editor'}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>

        <div className="security-note">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>Protected by an encrypted, HTTP-only session cookie.</span>
        </div>
      </section>
      <aside className="login-aside" aria-hidden="true">
        <span>Draft</span>
        <span>Review</span>
        <span>Commit</span>
        <div className="edition-number">№ 001</div>
      </aside>
    </main>
  )
}
