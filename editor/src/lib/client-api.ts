export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message)
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ClientApiError(0, 'No connection to the editor server')
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    code?: string
  }
  if (!response.ok) {
    throw new ClientApiError(
      response.status,
      payload.error || 'The server could not complete the request',
      payload.code,
    )
  }
  return payload as T
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const value = String(reader.result)
      resolve(value.slice(value.indexOf(',') + 1))
    })
    reader.addEventListener('error', () => {
      reject(new Error(`Could not read ${file.name}`))
    })
    reader.readAsDataURL(file)
  })
}
