import { createFileRoute } from '@tanstack/react-router'

import { requireEditorRequest } from '../server/auth.server'
import { publishArticle } from '../server/github.server'
import {
  ApiError,
  errorResponse,
  json,
  readJson,
} from '../server/http.server'
import { publishArticleSchema } from '../server/publishing-schema'

export const Route = createFileRoute('/api/publish')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireEditorRequest(request, { mutation: true })
          const parsed = publishArticleSchema.safeParse(await readJson(request))
          if (!parsed.success) {
            throw new ApiError(
              422,
              parsed.error.issues[0]?.message || 'Invalid publish request',
            )
          }
          return json(await publishArticle(parsed.data), { status: 201 })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})
