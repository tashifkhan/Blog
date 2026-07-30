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

import { directiveSyntax } from '../lib/directive-syntax'
import {
  type AssetMap,
  livePreview,
  setAssets,
  setSlug,
} from '../lib/live-preview'
import type { BodyEdit } from '../lib/markdown-editing'
import {
  filesFromDataTransfer,
  isDraggingFiles,
} from '../lib/transfer-files'

export type MarkdownEditorHandle = {
  applyEdit: (edit: BodyEdit) => void
  focus: () => void
  getSelection: () => string
}

type MarkdownEditorProps = {
  ariaLabel: string
  assets: AssetMap
  className?: string
  live: boolean
  onChange: (value: string) => void
  /** Files dropped on or pasted into the body, with the caret already placed. */
  onFiles?: (files: File[]) => void
  placeholder?: string
  ref?: Ref<MarkdownEditorHandle>
  slug: string
  value: string
}

export { isDraggingFiles }

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
  onFiles,
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
  const onFilesRef = useRef(onFiles)
  onFilesRef.current = onFiles
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
          markdown({ extensions: [directiveSyntax] }),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': initial.ariaLabel }),
          initial.placeholder
            ? placeholderExtension(initial.placeholder)
            : [],
          liveCompartment.current.of(initial.live ? livePreview() : []),
          // Dropping an image into the prose is the natural gesture, so the
          // body accepts files itself rather than only the media desk.
          EditorView.domEventHandlers({
            dragover(event) {
              if (!isDraggingFiles(event.dataTransfer)) return false
              // Without this the drop never reaches the page and the browser
              // navigates away from the editor to display the file.
              event.preventDefault()
              if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
              return true
            },
            drop(event, view) {
              // Must read the transfer synchronously — Firefox clears
              // clipboard/drag-backed File data once this handler returns.
              const files = filesFromDataTransfer(event.dataTransfer)
              if (!files.length) return false
              event.preventDefault()

              // Land the image where it was aimed, not at the old caret.
              const position = view.posAtCoords({
                x: event.clientX,
                y: event.clientY,
              })
              if (position !== null) {
                view.dispatch({ selection: { anchor: position } })
              }
              view.focus()
              onFilesRef.current?.(files)
              return true
            },
            paste(event) {
              // Firefox screenshot pastes often leave `files` empty and only
              // expose the image via `items` + `getAsFile()`. Capture in this
              // frame before the engine clears the clipboard payload.
              const files = filesFromDataTransfer(event.clipboardData)
              if (!files.length) return false
              event.preventDefault()
              onFilesRef.current?.(files)
              return true
            },
          }),
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
      getSelection() {
        const view = viewRef.current
        if (!view) return ''
        const { from, to } = view.state.selection.main
        return view.state.sliceDoc(from, to)
      },
    }),
    [],
  )

  return <div className={className} ref={hostRef} />
}
