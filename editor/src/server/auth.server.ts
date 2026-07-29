import { useSession } from '@tanstack/react-start/server'

import { ApiError } from './http.server'

type EditorSessionData = {
  authenticated?: boolean
  signedInAt?: string
  user?: 'tashifkhan'
}

type LoginWindow = {
  attempts: number
  resetAt: number
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5
/**
 * `X-Forwarded-For` is client-supplied, so a caller can mint a fresh per-address
 * budget at will. A global ceiling makes that pointless: this is a single-owner
 * editor, and thirty failed sign-ins in a quarter hour is never legitimate use.
 */
const MAX_GLOBAL_LOGIN_ATTEMPTS = 30
const MAX_TRACKED_ADDRESSES = 1_000

const loginWindows = new Map<string, LoginWindow>()
let globalWindow: LoginWindow = { attempts: 0, resetAt: 0 }

function requireSessionSecret(): string {
  const secret = process.env.EDITOR_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new ApiError(
      503,
      'Editor authentication is not configured on the server',
    )
  }
  return secret
}

function requireEditorPassword(): string {
  const password = process.env.EDITOR_PASSWORD
  if (!password || password.length < 1) {
    throw new ApiError(
      503,
      'Editor authentication is not configured on the server',
    )
  }
  return password
}

export function useEditorSession() {
  const production = process.env.NODE_ENV === 'production'
  return useSession<EditorSessionData>({
    name: production ? '__Host-pressroom' : 'pressroom',
    password: requireSessionSecret(),
    cookie: {
      httpOnly: true,
      maxAge: 12 * 60 * 60,
      path: '/',
      sameSite: 'strict',
      secure: production,
    },
  })
}

function requestAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

/** Drop elapsed windows so the map cannot grow without bound. */
function sweepLoginWindows(now: number): void {
  for (const [key, window] of loginWindows) {
    if (window.resetAt <= now) loginWindows.delete(key)
  }
  if (loginWindows.size > MAX_TRACKED_ADDRESSES) loginWindows.clear()
}

function enforceLoginRateLimit(request: Request): void {
  const now = Date.now()
  sweepLoginWindows(now)

  if (globalWindow.resetAt <= now) {
    globalWindow = { attempts: 0, resetAt: now + LOGIN_WINDOW_MS }
  }
  if (globalWindow.attempts >= MAX_GLOBAL_LOGIN_ATTEMPTS) {
    throw new ApiError(429, 'Too many login attempts. Try again later.')
  }

  const key = requestAddress(request)
  const current = loginWindows.get(key)

  if (current && current.attempts >= MAX_LOGIN_ATTEMPTS) {
    throw new ApiError(429, 'Too many login attempts. Try again later.')
  }

  globalWindow.attempts += 1
  if (current) {
    current.attempts += 1
  } else {
    loginWindows.set(key, { attempts: 1, resetAt: now + LOGIN_WINDOW_MS })
  }
}

function clearLoginRateLimit(request: Request): void {
  loginWindows.delete(requestAddress(request))
  globalWindow = { attempts: 0, resetAt: 0 }
}

async function digest(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value)
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
}

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([digest(left), digest(right)])
  let mismatch = 0

  for (let index = 0; index < leftHash.length; index += 1) {
    mismatch |= leftHash[index] ^ rightHash[index]
  }

  return mismatch === 0
}

export function verifySameOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  const expectedOrigin = new URL(request.url).origin

  if (!origin || origin !== expectedOrigin) {
    throw new ApiError(403, 'Cross-origin request rejected')
  }
}

export async function loginEditor(
  request: Request,
  password: string,
): Promise<void> {
  verifySameOrigin(request)
  enforceLoginRateLimit(request)

  const valid = await constantTimeEqual(password, requireEditorPassword())
  if (!valid) {
    await new Promise((resolve) => setTimeout(resolve, 350))
    throw new ApiError(401, 'Invalid credentials')
  }

  clearLoginRateLimit(request)
  const session = await useEditorSession()
  await session.update({
    authenticated: true,
    signedInAt: new Date().toISOString(),
    user: 'tashifkhan',
  })
}

export async function logoutEditor(request: Request): Promise<void> {
  verifySameOrigin(request)
  const session = await useEditorSession()
  await session.clear()
}

export async function getEditorIdentity(): Promise<{
  authenticated: boolean
  user: 'tashifkhan' | null
}> {
  const session = await useEditorSession()
  if (!session.data.authenticated || session.data.user !== 'tashifkhan') {
    return { authenticated: false, user: null }
  }
  return { authenticated: true, user: session.data.user }
}

export async function requireEditorRequest(
  request: Request,
  options: { mutation?: boolean } = {},
): Promise<void> {
  if (options.mutation) {
    verifySameOrigin(request)
  }

  const identity = await getEditorIdentity()
  if (!identity.authenticated) {
    throw new ApiError(401, 'Authentication required')
  }
}
