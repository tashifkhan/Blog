import { createFileRoute } from '@tanstack/react-router'

import { requireEditorRequest } from '../server/auth.server'
import { loadPost, publishingReady } from '../server/posts-source'
import { ApiError, errorResponse, json } from '../server/http.server'
import { slugSchema } from '../server/publishing-schema'

export const Route = createFileRoute('/api/publish/posts/$slug')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          await requireEditorRequest(request)
          const parsed = slugSchema.safeParse(params.slug ?? '')
          if (!parsed.success) {
            throw new ApiError(
              422,
              parsed.error.issues[0]?.message || 'Invalid slug',
            )
          }
          const loaded = await loadPost(parsed.data)
          return json({
            ...loaded,
            publishingReady: publishingReady(),
          })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})
