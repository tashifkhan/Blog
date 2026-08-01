import { createFileRoute } from '@tanstack/react-router'

import { requireEditorRequest } from '../server/auth.server'
import { listPosts } from '../server/github.server'
import { errorResponse, json } from '../server/http.server'

export const Route = createFileRoute('/api/publish/posts')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireEditorRequest(request)
          return json(await listPosts())
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})
