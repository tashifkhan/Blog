import { createFileRoute } from '@tanstack/react-router'

import { EditorApp } from '../components/EditorApp'

export const Route = createFileRoute('/')({
  component: EditorApp,
})
