import { createFileRoute } from '@tanstack/react-router'

import { requireEditorRequest } from '../server/auth.server'
import { listPosts, publishingReady } from '../server/posts-source'
import { errorResponse, json } from '../server/http.server'

export const Route = createFileRoute('/api/publish/posts')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireEditorRequest(request)
          const result = await listPosts()
          return json({
            ...result,
            publishingReady: publishingReady(),
          })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})
