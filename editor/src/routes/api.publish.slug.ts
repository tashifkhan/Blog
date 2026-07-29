import { createFileRoute } from '@tanstack/react-router'

import { requireEditorRequest } from '../server/auth.server'
import { inspectSlug } from '../server/github.server'
import { ApiError, errorResponse, json } from '../server/http.server'
import { slugSchema } from '../server/publishing-schema'

export const Route = createFileRoute('/api/publish/slug')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireEditorRequest(request)
          const parsed = slugSchema.safeParse(
            new URL(request.url).searchParams.get('slug') ?? '',
          )
          if (!parsed.success) {
            throw new ApiError(
              422,
              parsed.error.issues[0]?.message || 'Invalid slug',
            )
          }
          return json(await inspectSlug(parsed.data))
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})
