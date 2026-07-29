import { createFileRoute } from '@tanstack/react-router'

import { requireEditorRequest } from '../server/auth.server'
import { stageImage } from '../server/github.server'
import {
  ApiError,
  errorResponse,
  json,
  readJson,
} from '../server/http.server'
import { imageUploadSchema } from '../server/publishing-schema'

export const Route = createFileRoute('/api/publish/assets')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireEditorRequest(request, { mutation: true })
          const parsed = imageUploadSchema.safeParse(await readJson(request))
          if (!parsed.success) {
            throw new ApiError(
              422,
              parsed.error.issues[0]?.message || 'Invalid image upload',
            )
          }
          return json(await stageImage(parsed.data), { status: 201 })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})
