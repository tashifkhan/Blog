import { Blocks, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { componentPalette } from '../lib/markdown-editing'

/**
 * Insert menu for the document components.
 *
 * The list comes from the shared registry rather than being written out here,
 * so a component added to `components.ts` shows up with its own description and
 * a correct skeleton without this file changing. That is the same reason the
 * toolbar keeps only the two shortcuts an author reaches for constantly —
 * callout and columns — instead of growing a button per component.
 */
export function ComponentPalette({
  onInsert,
}: {
  onInsert: (snippet: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const entries = useMemo(() => componentPalette(), [])

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return entries
    return entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        entry.describe.toLowerCase().includes(needle),
    )
  }, [entries, query])

  useEffect(() => {
    if (!open) return

    searchRef.current?.focus()

    // Close on an outside click or Escape, the way the other menus here do.
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function insert(snippet: string) {
    onInsert(snippet)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="component-palette" ref={containerRef}>
      <button
        type="button"
        title="Components · insert a block"
        aria-label="Insert a component"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Blocks size={17} aria-hidden="true" />
      </button>

      {open ? (
        <div className="component-palette-menu" role="menu">
          <label className="component-palette-search">
            <Search size={14} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="Search components"
              aria-label="Search components"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                // Enter on a single match inserts it, so the whole interaction
                // can be keyboard-only.
                if (event.key === 'Enter' && matches.length) {
                  event.preventDefault()
                  insert(matches[0].snippet)
                }
              }}
            />
          </label>

          <ul className="component-palette-list">
            {matches.map((entry) => (
              <li key={entry.name}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => insert(entry.snippet)}
                >
                  <strong>{entry.name}</strong>
                  <span>{entry.describe}</span>
                </button>
              </li>
            ))}
            {matches.length === 0 ? (
              <li className="component-palette-empty">No component matches.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
