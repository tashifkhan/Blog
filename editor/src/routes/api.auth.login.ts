import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { loginEditor } from '../server/auth.server'
import {
  ApiError,
  errorResponse,
  json,
  readJson,
} from '../server/http.server'

const loginSchema = z.object({
  password: z.string().min(1).max(512),
})

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const parsed = loginSchema.safeParse(await readJson(request))
          if (!parsed.success) {
            throw new ApiError(422, 'Password is required')
          }

          await loginEditor(request, parsed.data.password)
          return json({ authenticated: true, user: 'tashifkhan' })
        } catch (error) {
          return errorResponse(error)
        }
      },
    },
  },
})
