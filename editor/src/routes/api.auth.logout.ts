import { createFileRoute } from '@tanstack/react-router'

import { logoutEditor } from '../server/auth.server'
import { errorResponse, json } from '../server/http.server'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await logoutEditor(request)
          return json({ authenticated: false })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})
