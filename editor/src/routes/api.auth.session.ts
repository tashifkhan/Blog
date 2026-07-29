import { createFileRoute } from '@tanstack/react-router'

import { getEditorIdentity } from '../server/auth.server'
import { errorResponse, json } from '../server/http.server'

export const Route = createFileRoute('/api/auth/session')({
  server: {
    handlers: {
      GET: async () => {
        try {
          return json(await getEditorIdentity())
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})
