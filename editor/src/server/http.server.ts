/**
 * Machine-readable failure kinds. The editor UI branches on these to offer the
 * right recovery (re-sync the branch, confirm an overwrite) instead of matching
 * on human-facing copy.
 */
export type ApiErrorCode = 'head_stale' | 'slug_exists'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: ApiErrorCode,
  ) {
    super(message)
  }
}

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...init?.headers,
    },
  })
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return json(
      { error: error.message, ...(error.code ? { code: error.code } : {}) },
      { status: error.status },
    )
  }

  console.error('Unhandled editor API error', error)
  return json({ error: 'Unexpected server error' }, { status: 500 })
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new ApiError(415, 'Expected an application/json request')
  }

  try {
    return await request.json()
  } catch {
    throw new ApiError(400, 'Request body is not valid JSON')
  }
}
