import { history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { Compartment, EditorState } from '@codemirror/state'
import {
  EditorView,
  drawSelection,
  keymap,
  placeholder as placeholderExtension,
} from '@codemirror/view'
import { type Ref, useEffect, useImperativeHandle, useRef } from 'react'

import {
  type AssetMap,
  livePreview,
  setAssets,
  setSlug,
} from '../lib/live-preview'
import type { BodyEdit } from '../lib/markdown-editing'

export type MarkdownEditorHandle = {
  applyEdit: (edit: BodyEdit) => void
  focus: () => void
}

type MarkdownEditorProps = {
  ariaLabel: string
  assets: AssetMap
  className?: string
  live: boolean
  onChange: (value: string) => void
  placeholder?: string
  ref?: Ref<MarkdownEditorHandle>
  slug: string
  value: string
}

/**
 * CodeMirror surface for the article body.
 *
 * `live` toggles the Obsidian-style inline rendering through a compartment
 * rather than a remount, so switching between Source and Live keeps the caret,
 * the scroll position, and the undo history intact.
 */
export function MarkdownEditor({
  ariaLabel,
  assets,
  className,
  live,
  onChange,
  placeholder,
  ref,
  slug,
  value,
}: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const liveCompartment = useRef(new Compartment())

  // Read the latest props through refs so the CodeMirror instance never closes
  // over a stale callback, which would silently drop edits after a re-render.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const initialRef = useRef({ ariaLabel, assets, live, placeholder, slug, value })

  useEffect(() => {
    if (!hostRef.current) return
    const initial = initialRef.current

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: initial.value,
        extensions: [
          history(),
          drawSelection(),
          keymap.of([...historyKeymap, indentWithTab]),
          markdown(),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': initial.ariaLabel }),
          initial.placeholder
            ? placeholderExtension(initial.placeholder)
            : [],
          liveCompartment.current.of(initial.live ? livePreview() : []),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString())
            }
          }),
        ],
      }),
    })
    viewRef.current = view
    view.dispatch({
      effects: [setAssets.of(initial.assets), setSlug.of(initial.slug)],
    })

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: liveCompartment.current.reconfigure(live ? livePreview() : []),
    })
  }, [live])

  // Adopt changes made outside the editor (draft restore, "start a new story").
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    })
  }, [value])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: setAssets.of(assets) })
  }, [assets])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: setSlug.of(slug) })
  }, [slug])

  useImperativeHandle(
    ref,
    () => ({
      applyEdit(edit) {
        const view = viewRef.current
        if (!view) return
        const body = view.state.doc.toString()
        const { from, to } = view.state.selection.main
        const next = edit(body, from, to)

        view.dispatch({
          changes: { from: 0, to: body.length, insert: next.body },
          selection: { anchor: next.selectionStart, head: next.selectionEnd },
          scrollIntoView: true,
        })
        view.focus()
      },
      focus() {
        viewRef.current?.focus()
      },
    }),
    [],
  )

  return <div className={className} ref={hostRef} />
}
