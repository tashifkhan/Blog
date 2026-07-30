import {
  AlertTriangle,
  BookOpen,
  Bold,
  Check,
  ChevronRight,
  Code2,
  Columns2,
  FilePlus2,
  GitBranch,
  Heading2,
  ImagePlus,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  LoaderCircle,
  LogOut,
  PenLine,
  Plus,
  Quote,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { renderMarkdown } from '../markdown'
import { validateDirectives } from '../markdown/validate'
import {
  type Draft,
  buildArticle,
  formatBytes,
  normalizeFilename,
  parseTags,
  readingMinutes,
  slugify,
  uniqueFilename,
  wordCount,
} from '../lib/article'
import { ClientApiError, apiRequest, fileToBase64 } from '../lib/client-api'
import {
  type BodyEdit,
  CALLOUT_TEMPLATE,
  TWO_COL_TEMPLATE,
  insertBlock,
  insertLink,
  insertTemplate,
  normalizeLinkDestination,
  prefixLines,
  wrapSelection,
} from '../lib/markdown-editing'
import {
  MarkdownEditor,
  type MarkdownEditorHandle,
} from './MarkdownEditor'
import { ThemeToggle } from './ThemeToggle'
import {
  IMAGE_ACCEPT_ATTRIBUTE,
  IMAGE_FILENAME_PATTERN,
  MAX_COMMIT_MESSAGE_LENGTH,
  MAX_EXCERPT_LENGTH,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  assetReference,
  findAssetReferences,
} from '../lib/publishing-rules'

type EditorWorkspaceProps = {
  onSignedOut: () => void
}

type EditorImage = {
  file: File
  filename: string
  id: string
  previewUrl: string
  status: 'ready' | 'uploading' | 'staged'
}

type PublishHead = {
  branch: string
  headSha: string
}

type SlugCheck =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'free'; path: string }
  | { state: 'taken'; path: string }
  | { state: 'unknown' }

type StagedImage = {
  blobSha: string
  filename: string
  sizeBytes: number
}

type PublishResult = {
  articlePath: string
  author: { email: string; name: string }
  branch: string
  commitSha: string
  commitUrl: string
  imagePaths: string[]
  message: string
  replaced: boolean
}

/** Which stage of the publish pipeline is running, for the progress strip. */
type Phase = 'idle' | 'staging' | 'committing' | 'done'

/**
 * Obsidian's three views: raw Markdown, inline-rendered editing, and a
 * read-only render of the finished page.
 */
type Mode = 'source' | 'live' | 'reading'

type LinkDraft = {
  destination: string
  error: string
  label: string
}

const MODES: Array<{ id: Mode; label: string; hint: string }> = [
  { id: 'source', label: 'Source', hint: 'Raw Markdown' },
  { id: 'live', label: 'Live', hint: 'Renders as you type' },
  { id: 'reading', label: 'Reading', hint: 'Read-only page' },
]

const DRAFT_KEY = 'pressroom:draft:v1'
const MODE_KEY = 'pressroom:mode:v1'
const SAVE_DEBOUNCE_MS = 450
const SLUG_CHECK_DEBOUNCE_MS = 500

function isMode(value: unknown): value is Mode {
  return MODES.some((mode) => mode.id === value)
}

function freshDraft(): Draft {
  return {
    body: '## Begin with the idea\n\nWrite the story here. Keep the opening sharp.',
    commitMessage: '',
    date: new Date().toISOString().slice(0, 10),
    excerpt: '',
    slug: '',
    tags: '',
    title: '',
  }
}

function shortSha(sha: string): string {
  return sha.slice(0, 7)
}

export function EditorWorkspace({ onSignedOut }: EditorWorkspaceProps) {
  const [draft, setDraft] = useState<Draft>(freshDraft)
  const [images, setImages] = useState<EditorImage[]>([])
  const [mode, setMode] = useState<Mode>('live')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugCheck, setSlugCheck] = useState<SlugCheck>({ state: 'idle' })
  const [overwrite, setOverwrite] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [head, setHead] = useState<PublishHead | null>(null)
  const [headStale, setHeadStale] = useState(false)
  const [headLoading, setHeadLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PublishResult | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkDraft, setLinkDraft] = useState<LinkDraft>({
    destination: '',
    error: '',
    label: '',
  })

  const formRef = useRef<HTMLFormElement>(null)
  const editorRef = useRef<MarkdownEditorHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const linkDestinationRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const imagesRef = useRef<EditorImage[]>([])

  const publishing = phase === 'staging' || phase === 'committing'
  const filenames = useMemo(
    () => images.map((image) => image.filename),
    [images],
  )
  // Object URLs keyed by filename, so live preview can render an attached
  // `asset:` reference without a network round trip.
  const assets = useMemo(
    () => new Map(images.map((image) => [image.filename, image.previewUrl])),
    [images],
  )
  const article = useMemo(
    () => buildArticle(draft, filenames),
    [draft, filenames],
  )
  // Anything still shaped like `asset:name.png` after resolution points at an
  // image that is no longer attached, and the API would reject it.
  const unresolved = useMemo(() => findAssetReferences(article), [article])
  // The same check the publish endpoint runs, surfaced while writing so a
  // malformed directive is caught before it is committed rather than after.
  const directiveIssues = useMemo(
    () => validateDirectives(draft.body),
    [draft.body],
  )
  const words = useMemo(() => wordCount(draft.body), [draft.body])
  const tags = useMemo(() => parseTags(draft.tags), [draft.tags])

  // The reading pane runs the same renderer the sites do, so a directive that
  // previews correctly here publishes correctly. Diagrams stay as code blocks:
  // the editor does not ship the mermaid bundle.
  const previewHtml = useMemo(
    () =>
      renderMarkdown(draft.body, {
        mermaid: false,
        resolveImage: (src) => {
          if (!src.startsWith('asset:')) return { src }
          const filename = src.slice('asset:'.length)
          const attached = assets.get(filename)
          return attached ? { src: attached } : { src, missing: true }
        },
      }),
    [draft.body, assets],
  )

  const blockers = useMemo(() => {
    const list: string[] = []
    if (!draft.title.trim()) list.push('Headline')
    if (!draft.slug) list.push('File slug')
    if (!draft.body.trim()) list.push('Article body')
    if (!draft.commitMessage.trim()) list.push('Commit message')
    if (unresolved.length) list.push('Unresolved image links')
    if (directiveIssues.length) list.push('Directive errors')
    if (slugCheck.state === 'taken' && !overwrite) {
      list.push('Replacement confirmation')
    }
    if (!head) list.push('Branch sync')
    return list
  }, [draft, unresolved, directiveIssues, slugCheck, overwrite, head])

  useEffect(() => {
    const storedMode = window.localStorage.getItem(MODE_KEY)
    if (isMode(storedMode)) setMode(storedMode)

    const stored = window.localStorage.getItem(DRAFT_KEY)
    if (!stored) return
    try {
      const parsed = { ...freshDraft(), ...(JSON.parse(stored) as Partial<Draft>) }
      setDraft(parsed)
      // Only treat the slug as hand-written if there actually is one, otherwise
      // restoring an untouched draft would permanently disable slug-from-title.
      setSlugEdited(Boolean(parsed.slug))
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  useEffect(() => {
    setSaving(true)
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setSaving(false)
      setSavedAt(new Date())
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [draft])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(
    () => () => {
      for (const image of imagesRef.current) {
        URL.revokeObjectURL(image.previewUrl)
      }
    },
    [],
  )

  const refreshHead = useCallback(async () => {
    setHeadLoading(true)
    try {
      const next = await apiRequest<PublishHead>('/api/publish/head')
      setHead(next)
      setHeadStale(false)
      return next
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.status === 401) {
        onSignedOut()
        return null
      }
      setHead(null)
      return null
    } finally {
      setHeadLoading(false)
    }
  }, [onSignedOut])

  // The branch head is read when the tab opens and whenever it regains focus,
  // then sent verbatim with the commit. Reading it at publish time instead
  // would make the server's stale-head check unable to ever fire.
  useEffect(() => {
    void refreshHead()
    const onFocus = () => {
      if (document.visibilityState === 'visible') void refreshHead()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refreshHead])

  // Surface a slug collision while it is still cheap to rename, rather than
  // after every image has been uploaded.
  useEffect(() => {
    setOverwrite(false)
    if (!draft.slug) {
      setSlugCheck({ state: 'idle' })
      return
    }

    let active = true
    setSlugCheck({ state: 'checking' })
    const timeout = window.setTimeout(() => {
      apiRequest<{ exists: boolean; path: string }>(
        `/api/publish/slug?slug=${encodeURIComponent(draft.slug)}`,
      )
        .then((response) => {
          if (!active) return
          setSlugCheck({
            state: response.exists ? 'taken' : 'free',
            path: response.path,
          })
        })
        .catch(() => {
          if (active) setSlugCheck({ state: 'unknown' })
        })
    }, SLUG_CHECK_DEBOUNCE_MS)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [draft.slug])

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest' })
  }, [error])

  function updateDraft<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function updateTitle(value: string) {
    setDraft((current) => ({
      ...current,
      slug: slugEdited ? current.slug : slugify(value),
      title: value,
    }))
  }

  // Reading view is read-only, so a formatting action moves back to the last
  // editable surface first. CodeMirror owns the selection in both.
  const applyEdit = useCallback(
    (edit: BodyEdit) => {
      if (mode === 'reading') {
        setMode('live')
        // The editor mounts on the next commit; run the edit once it exists.
        window.requestAnimationFrame(() => editorRef.current?.applyEdit(edit))
        return
      }
      editorRef.current?.applyEdit(edit)
    },
    [mode],
  )

  const openLinkDialog = useCallback(() => {
    const reveal = () => {
      setLinkDraft({
        destination: '',
        error: '',
        label: editorRef.current?.getSelection() ?? '',
      })
      setLinkDialogOpen(true)
    }

    if (mode === 'reading') {
      setMode('live')
      window.requestAnimationFrame(reveal)
      return
    }
    reveal()
  }, [mode])

  useEffect(() => {
    if (!linkDialogOpen) return
    window.requestAnimationFrame(() => linkDestinationRef.current?.focus())
  }, [linkDialogOpen])

  // Keyboard shortcuts mirror the toolbar so hands can stay on the keys.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!event.metaKey && !event.ctrlKey) return
      const key = event.key.toLowerCase()

      if (key === 's') {
        event.preventDefault()
        return
      }
      if (key === 'enter') {
        event.preventDefault()
        formRef.current?.requestSubmit()
        return
      }
      // ⌘E cycles the view, matching Obsidian.
      if (key === 'e' && !event.shiftKey) {
        event.preventDefault()
        setMode((current) => {
          const index = MODES.findIndex((entry) => entry.id === current)
          return MODES[(index + 1) % MODES.length].id
        })
        return
      }

      if (event.shiftKey) {
        if (key !== 'c') return
        event.preventDefault()
        applyEdit(wrapSelection('`', '`'))
        return
      }

      if (key === 'k') {
        event.preventDefault()
        openLinkDialog()
        return
      }

      const inline: Record<string, BodyEdit> = {
        b: wrapSelection('**', '**'),
        i: wrapSelection('_', '_'),
      }
      const edit = inline[key]
      if (!edit) return
      event.preventDefault()
      applyEdit(edit)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [applyEdit, openLinkDialog])

  function commitLink() {
    const destination = normalizeLinkDestination(linkDraft.destination)
    if (!destination) {
      setLinkDraft((current) => ({
        ...current,
        error: 'Enter a valid web address, relative path, email, or anchor.',
      }))
      return
    }

    setLinkDialogOpen(false)
    applyEdit(insertLink(linkDraft.label, destination))
  }

  function imageMarkdown(image: EditorImage): string {
    const alt = image.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    return `![${alt}](${assetReference(image.filename)})`
  }

  function addFiles(fileList: FileList | File[]) {
    setError('')
    const accepted: EditorImage[] = []
    let room = MAX_IMAGES - images.length

    for (const file of Array.from(fileList)) {
      if (room <= 0) {
        setError(`A post can carry at most ${MAX_IMAGES} images`)
        break
      }

      const filename = normalizeFilename(file.name)
      if (!IMAGE_FILENAME_PATTERN.test(filename)) {
        setError(`${file.name} is not a supported image format`)
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(
          `${file.name} is ${formatBytes(file.size)} — over the ${formatBytes(
            MAX_IMAGE_BYTES,
          )} limit`,
        )
        continue
      }
      // Attaching the very same file twice is a slip worth reporting. A
      // different image that merely shares a name is not: the clipboard calls
      // every pasted screenshot `image.png`, so rejecting on the name alone
      // would make a second paste impossible. Those get a suffix instead.
      const attached = [...images, ...accepted]
      const alreadyAttached = attached.some(
        (candidate) =>
          candidate.filename.toLowerCase() === filename.toLowerCase() &&
          candidate.file.size === file.size &&
          candidate.file.lastModified === file.lastModified,
      )
      if (alreadyAttached) {
        setError(`${filename} is already attached`)
        continue
      }
      const unique = uniqueFilename(
        filename,
        new Set(attached.map((candidate) => candidate.filename.toLowerCase())),
      )

      accepted.push({
        file,
        filename: unique,
        id: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        status: 'ready',
      })
      room -= 1
    }

    if (accepted.length) {
      setImages((current) => [...current, ...accepted])

      // Choosing an image should do the complete editorial action. If a
      // restored draft already references the file, attaching it only repairs
      // that reference; otherwise place it at the current caret immediately.
      const newReferences = accepted.filter(
        (image) => !draft.body.includes(assetReference(image.filename)),
      )
      if (newReferences.length) {
        applyEdit(insertBlock(newReferences.map(imageMarkdown).join('\n\n')))
      }
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files)
  }

  function removeImage(id: string) {
    setImages((current) => {
      const target = current.find((image) => image.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return current.filter((image) => image.id !== id)
    })
  }

  function insertImage(image: EditorImage) {
    applyEdit(insertBlock(imageMarkdown(image)))
  }

  function startNewDraft() {
    for (const image of imagesRef.current) URL.revokeObjectURL(image.previewUrl)
    window.localStorage.removeItem(DRAFT_KEY)
    setImages([])
    setResult(null)
    setError('')
    setPhase('idle')
    setSlugEdited(false)
    setOverwrite(false)
    setDraft(freshDraft())
  }

  async function signOut() {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST', body: '{}' })
    } finally {
      onSignedOut()
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setResult(null)

    if (blockers.length) {
      setError(`Still needed before publishing: ${blockers.join(', ')}`)
      return
    }
    if (!head) return

    setPhase('staging')
    setImages((current) =>
      current.map((image) => ({ ...image, status: 'uploading' })),
    )

    try {
      const stagedImages = await Promise.all(
        images.map(async (image) => {
          const contentBase64 = await fileToBase64(image.file)
          const staged = await apiRequest<StagedImage>('/api/publish/assets', {
            method: 'POST',
            body: JSON.stringify({
              contentBase64,
              filename: image.filename,
            }),
          })
          setImages((current) =>
            current.map((candidate) =>
              candidate.id === image.id
                ? { ...candidate, status: 'staged' }
                : candidate,
            ),
          )
          return staged
        }),
      )

      setPhase('committing')
      const published = await apiRequest<PublishResult>('/api/publish', {
        method: 'POST',
        body: JSON.stringify({
          articleContent: article,
          commitMessage: draft.commitMessage,
          expectedHeadSha: head.headSha,
          images: stagedImages.map(({ blobSha, filename }) => ({
            blobSha,
            filename,
          })),
          overwrite,
          slug: draft.slug,
        }),
      })

      setResult(published)
      setPhase('done')
      // The commit we just wrote is the new head, so a follow-up edit does not
      // need a round trip to become publishable again.
      setHead({ branch: published.branch, headSha: published.commitSha })
      setSlugCheck({ state: 'taken', path: published.articlePath })
      setOverwrite(false)
    } catch (caught) {
      setPhase('idle')
      setImages((current) =>
        current.map((image) => ({ ...image, status: 'ready' })),
      )

      if (caught instanceof ClientApiError) {
        if (caught.status === 401) {
          onSignedOut()
          return
        }
        if (caught.code === 'head_stale') setHeadStale(true)
        if (caught.code === 'slug_exists') {
          setSlugCheck({
            state: 'taken',
            path: `src/blogs/${draft.slug}.md`,
          })
        }
      }
      setError(caught instanceof Error ? caught.message : 'Publishing failed')
    }
  }

  const statusLabel = publishing
    ? phase === 'staging'
      ? 'Staging images…'
      : 'Writing the commit…'
    : saving
      ? 'Saving draft…'
      : savedAt
        ? `Draft saved ${savedAt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : 'Draft saved locally'

  return (
    <main className="editor-shell">
      <header className="editor-header">
        <div className="brand-lockup">
          <div className="brand-mark">P</div>
          <div>
            <span className="eyebrow">Tashif’s private desk</span>
            <strong>Pressroom</strong>
          </div>
        </div>

        <div className="header-status" aria-live="polite">
          <span className={`status-dot ${saving || publishing ? 'busy' : ''}`} />
          <span>{statusLabel}</span>
        </div>

        <div className="header-actions">
          <button
            className={`branch-chip ${headStale ? 'stale' : ''}`}
            type="button"
            onClick={() => void refreshHead()}
            disabled={headLoading}
            title="Re-read the branch head from GitHub"
          >
            {headLoading ? (
              <LoaderCircle className="spin" size={13} aria-hidden="true" />
            ) : (
              <GitBranch size={13} aria-hidden="true" />
            )}
            <span>
              {head ? `${head.branch} @ ${shortSha(head.headSha)}` : 'no branch'}
            </span>
            {!headLoading ? <RefreshCw size={12} aria-hidden="true" /> : null}
          </button>

          <ThemeToggle />

          <button className="quiet-button" type="button" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <form className="editor-grid" onSubmit={publish} ref={formRef}>
        <aside className="story-rail">
          <div className="rail-heading">
            <span>Story file</span>
            <span className="draft-badge">
              {result ? 'Published' : 'Draft'}
            </span>
          </div>

          <label className="field-group">
            <span>Headline</span>
            <textarea
              className="headline-input"
              value={draft.title}
              onChange={(event) => updateTitle(event.target.value)}
              placeholder="A headline worth opening"
              rows={3}
            />
          </label>

          <div className="field-group">
            <span id="slug-label">File slug</span>
            <div className="slug-field">
              <span aria-hidden="true">/</span>
              <input
                aria-labelledby="slug-label"
                value={draft.slug}
                onChange={(event) => {
                  setSlugEdited(true)
                  updateDraft('slug', slugify(event.target.value))
                }}
                placeholder="article-slug"
              />
            </div>
            <SlugStatus check={slugCheck} slug={draft.slug} />
          </div>

          <div className="two-fields">
            <label className="field-group">
              <span>Publish date</span>
              <input
                type="date"
                value={draft.date}
                onChange={(event) => updateDraft('date', event.target.value)}
              />
            </label>
            <label className="field-group">
              <span>Tags</span>
              <input
                value={draft.tags}
                onChange={(event) => updateDraft('tags', event.target.value)}
                placeholder="React, Web"
              />
            </label>
          </div>

          {tags.length ? (
            <ul className="tag-chips">
              {tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}

          <label className="field-group">
            <span>Deck / excerpt</span>
            <textarea
              value={draft.excerpt}
              onChange={(event) => updateDraft('excerpt', event.target.value)}
              placeholder="One crisp sentence for cards and search."
              rows={4}
              maxLength={MAX_EXCERPT_LENGTH}
            />
            <small>
              {draft.excerpt.length}/{MAX_EXCERPT_LENGTH} characters
            </small>
          </label>

          <div className="story-stats">
            <div>
              <strong>{words}</strong>
              <span>words</span>
            </div>
            <div>
              <strong>{readingMinutes(words)}</strong>
              <span>min read</span>
            </div>
            <div>
              <strong>{images.length}</strong>
              <span>images</span>
            </div>
          </div>
        </aside>

        <section className="writing-desk">
          <div className="desk-toolbar">
            <div className="pane-switcher" role="tablist">
              {MODES.map((entry) => {
                const Icon =
                  entry.id === 'source'
                    ? PenLine
                    : entry.id === 'live'
                      ? Sparkles
                      : BookOpen
                return (
                  <button
                    key={entry.id}
                    className={mode === entry.id ? 'active' : ''}
                    type="button"
                    role="tab"
                    id={`tab-${entry.id}`}
                    title={entry.hint}
                    aria-selected={mode === entry.id}
                    aria-controls={`pane-${entry.id}`}
                    onClick={() => setMode(entry.id)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {entry.label}
                  </button>
                )
              })}
              <kbd className="shortcut-hint">⌘E</kbd>
            </div>

            <div className="format-tools" aria-label="Markdown formatting">
              <ToolButton
                label="Heading"
                hint="##"
                onClick={() => applyEdit(prefixLines('## '))}
              >
                <Heading2 size={17} aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="Bold"
                hint="⌘B"
                onClick={() => applyEdit(wrapSelection('**', '**'))}
              >
                <Bold size={17} aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="Italic"
                hint="⌘I"
                onClick={() => applyEdit(wrapSelection('_', '_'))}
              >
                <Italic size={17} aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="Link"
                hint="⌘K"
                onClick={openLinkDialog}
              >
                <LinkIcon size={17} aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="Inline code"
                hint="⌘⇧C"
                onClick={() => applyEdit(wrapSelection('`', '`'))}
              >
                <Code2 size={17} aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="Bullet list"
                hint="-"
                onClick={() => applyEdit(prefixLines('- '))}
              >
                <List size={17} aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="Quote"
                hint=">"
                onClick={() => applyEdit(prefixLines('> '))}
              >
                <Quote size={17} aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="Code block"
                hint="```"
                onClick={() => applyEdit(insertBlock('```\n\n```'))}
              >
                <Code2 size={17} aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="Callout"
                hint=":::note"
                onClick={() => applyEdit(insertTemplate(CALLOUT_TEMPLATE))}
              >
                <Info size={17} aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="Two columns"
                hint="::::two-col"
                onClick={() => applyEdit(insertTemplate(TWO_COL_TEMPLATE))}
              >
                <Columns2 size={17} aria-hidden="true" />
              </ToolButton>
            </div>
          </div>

          {directiveIssues.length ? (
            <p className="inline-warning" role="alert">
              <AlertTriangle size={14} aria-hidden="true" />
              <span>
                {`Line ${directiveIssues[0].line}: ${directiveIssues[0].message}`}
                {directiveIssues.length > 1
                  ? ` (+${directiveIssues.length - 1} more)`
                  : ''}
              </span>
            </p>
          ) : null}

          {mode !== 'reading' ? (
            <div
              id={`pane-${mode}`}
              role="tabpanel"
              aria-labelledby={`tab-${mode}`}
              className={`body-editor ${mode === 'live' ? 'is-live' : 'is-source'}`}
            >
              <MarkdownEditor
                ref={editorRef}
                ariaLabel="Article Markdown"
                assets={assets}
                live={mode === 'live'}
                onChange={(body) => updateDraft('body', body)}
                onFiles={addFiles}
                placeholder="Write the story here."
                slug={draft.slug}
                value={draft.body}
              />
            </div>
          ) : (
            <article
              className="article-preview"
              id="pane-reading"
              role="tabpanel"
              aria-labelledby="tab-reading"
            >
              <p className="preview-date">
                {draft.date}
                {tags.length ? ` · ${tags.join(' · ')}` : ''}
              </p>
              <h1>{draft.title || 'Untitled story'}</h1>
              {draft.excerpt ? (
                <p className="preview-deck">{draft.excerpt}</p>
              ) : null}
              <div className="preview-rule" />
              {/*
                Rendered by the same module both sites use, so what the reading
                pane shows is what publishes — directives and callouts included.
                The body is Markdown the author is currently typing, not
                third-party input, and it renders with `html: true` exactly as it
                will on the sites.
              */}
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </article>
          )}
        </section>

        <aside className="publish-rail">
          <section className="rail-section">
            <div className="rail-heading">
              <span>Media desk</span>
              <span>
                {images.length}/{MAX_IMAGES}
              </span>
            </div>

            <div
              className={`drop-zone ${dragging ? 'dragging' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_ACCEPT_ATTRIBUTE}
                multiple
                hidden
                onChange={handleFileInput}
              />
              <UploadCloud size={24} aria-hidden="true" />
              <strong>Drop images to attach & insert</strong>
              <span>AVIF, WebP, PNG, JPEG or GIF · 3 MB max</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={15} aria-hidden="true" />
                Choose & insert
              </button>
            </div>

            {unresolved.length ? (
              <p className="inline-warning" role="alert">
                <AlertTriangle size={14} aria-hidden="true" />
                <span>
                  {unresolved.length === 1
                    ? `“${unresolved[0]}” is linked in the article but not attached.`
                    : `${unresolved.length} linked images are not attached: ${unresolved.join(', ')}.`}
                </span>
              </p>
            ) : null}

            <div className="image-list">
              {images.length === 0 ? (
                <p className="empty-note">
                  Nothing attached yet. Images commit alongside the Markdown in
                  the same commit.
                </p>
              ) : null}
              {images.map((image) => (
                <div className="image-card" key={image.id}>
                  <img src={image.previewUrl} alt="" />
                  <div>
                    <strong title={image.filename}>{image.filename}</strong>
                    <span>
                      {image.status === 'uploading' ? (
                        <>
                          <LoaderCircle
                            className="spin"
                            size={10}
                            aria-hidden="true"
                          />{' '}
                          Uploading…
                        </>
                      ) : image.status === 'staged' ? (
                        'Staged'
                      ) : (
                        formatBytes(image.file.size)
                      )}
                    </span>
                  </div>
                  <div className="image-actions">
                    <button
                      className="insert-image-button"
                      type="button"
                      title="Insert into article"
                      aria-label={`Insert ${image.filename} into article`}
                      onClick={() => insertImage(image)}
                    >
                      <ImagePlus size={15} aria-hidden="true" />
                      <span>Insert</span>
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      aria-label={`Remove ${image.filename}`}
                      onClick={() => removeImage(image.id)}
                      disabled={publishing}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rail-section commit-section">
            <div className="rail-heading">
              <span>Commit desk</span>
              <ChevronRight size={16} aria-hidden="true" />
            </div>

            <label className="field-group">
              <span>Git commit message</span>
              <textarea
                value={draft.commitMessage}
                onChange={(event) =>
                  updateDraft('commitMessage', event.target.value)
                }
                placeholder="content: publish …"
                rows={3}
                maxLength={MAX_COMMIT_MESSAGE_LENGTH}
              />
              <small>
                Sent exactly as written · {draft.commitMessage.length}/
                {MAX_COMMIT_MESSAGE_LENGTH}
              </small>
            </label>

            <div className="author-chip">
              <div className="author-avatar">TK</div>
              <div>
                <span>Commit author</span>
                <strong>tashifkhan</strong>
                <small>tashifkhan010@gmail.com</small>
              </div>
              <Check size={16} aria-hidden="true" />
            </div>

            {headStale ? (
              <div className="callout warning" role="alert">
                <AlertTriangle size={15} aria-hidden="true" />
                <div>
                  <strong>The branch moved.</strong>
                  <p>
                    Someone pushed to {head?.branch ?? 'the branch'} after this
                    tab loaded. Nothing was overwritten.
                  </p>
                  <button type="button" onClick={() => void refreshHead()}>
                    <RefreshCw size={13} aria-hidden="true" />
                    Sync to latest
                  </button>
                </div>
              </div>
            ) : null}

            {slugCheck.state === 'taken' && !result ? (
              <div className="callout danger">
                <AlertTriangle size={15} aria-hidden="true" />
                <div>
                  <strong>This slug already has a post.</strong>
                  <p>
                    Publishing rewrites <code>{slugCheck.path}</code> in full.
                    Rename the slug to keep both.
                  </p>
                  <label className="confirm-check">
                    <input
                      type="checkbox"
                      checked={overwrite}
                      onChange={(event) => setOverwrite(event.target.checked)}
                    />
                    <span>Replace the existing post</span>
                  </label>
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="publish-error" role="alert" ref={errorRef}>
                {error}
              </p>
            ) : null}

            {publishing ? (
              <ol className="publish-steps" aria-live="polite">
                <li className={phase === 'staging' ? 'active' : 'done'}>
                  Staging {images.length} image
                  {images.length === 1 ? '' : 's'}
                </li>
                <li className={phase === 'committing' ? 'active' : ''}>
                  Writing one atomic commit
                </li>
              </ol>
            ) : null}

            {result ? (
              <div className="publish-success">
                <a href={result.commitUrl} target="_blank" rel="noreferrer">
                  <Check size={17} aria-hidden="true" />
                  <span>
                    {result.replaced ? 'Replaced' : 'Published'} as{' '}
                    <strong>{shortSha(result.commitSha)}</strong>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </a>
                <p>
                  <code>{result.articlePath}</code>
                  {result.imagePaths.length
                    ? ` · ${result.imagePaths.length} image${
                        result.imagePaths.length === 1 ? '' : 's'
                      }`
                    : ''}
                </p>
                <button type="button" onClick={startNewDraft}>
                  <FilePlus2 size={14} aria-hidden="true" />
                  Start a new story
                </button>
              </div>
            ) : null}

            <button
              className="publish-button"
              type="submit"
              disabled={publishing || blockers.length > 0}
              aria-busy={publishing}
            >
              {publishing ? (
                <LoaderCircle className="spin" size={18} aria-hidden="true" />
              ) : (
                <Send size={18} aria-hidden="true" />
              )}
              <span>{publishing ? 'Publishing…' : 'Commit & publish'}</span>
              {!publishing ? <kbd>⌘↵</kbd> : null}
            </button>

            {blockers.length && !publishing ? (
              <ul className="blocker-list">
                {blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            ) : (
              <p className="atomic-note">
                Markdown and all images land in one non-force commit.
              </p>
            )}
          </section>
        </aside>
      </form>

      {linkDialogOpen ? (
        <div
          className="dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLinkDialogOpen(false)
          }}
        >
          <section
            className="link-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-dialog-title"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                setLinkDialogOpen(false)
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                commitLink()
              }
            }}
          >
            <div className="link-dialog-heading">
              <div>
                <span className="eyebrow">Markdown link</span>
                <h2 id="link-dialog-title">Add a destination</h2>
              </div>
              <button
                type="button"
                aria-label="Close link dialog"
                onClick={() => setLinkDialogOpen(false)}
              >
                ×
              </button>
            </div>

            <label className="field-group">
              <span>Link text</span>
              <input
                value={linkDraft.label}
                onChange={(event) =>
                  setLinkDraft((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                placeholder="this is cool"
              />
            </label>

            <label className="field-group">
              <span>Destination</span>
              <input
                ref={linkDestinationRef}
                value={linkDraft.destination}
                onChange={(event) =>
                  setLinkDraft((current) => ({
                    ...current,
                    destination: event.target.value,
                    error: '',
                  }))
                }
                placeholder="https://search.taf.sh"
                inputMode="url"
              />
            </label>

            {linkDraft.error ? (
              <p className="link-dialog-error" role="alert">
                {linkDraft.error}
              </p>
            ) : (
              <p className="link-dialog-note">
                This writes <code>[link text](destination)</code> in the correct
                order.
              </p>
            )}

            <div className="link-dialog-actions">
              <button type="button" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </button>
              <button type="button" onClick={commitLink}>
                <LinkIcon size={15} aria-hidden="true" />
                Insert link
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function ToolButton({
  children,
  hint,
  label,
  onClick,
}: {
  children: ReactNode
  hint: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={`${label} · ${hint}`}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function SlugStatus({ check, slug }: { check: SlugCheck; slug: string }) {
  if (!slug) {
    return <small>src/blogs/article-slug.md</small>
  }
  if (check.state === 'checking') {
    return <small className="slug-checking">Checking src/blogs/{slug}.md…</small>
  }
  if (check.state === 'taken') {
    return (
      <small className="slug-taken">
        <AlertTriangle size={11} aria-hidden="true" /> Replaces {check.path}
      </small>
    )
  }
  if (check.state === 'free') {
    return (
      <small className="slug-free">
        <Check size={11} aria-hidden="true" /> New file · {check.path}
      </small>
    )
  }
  return <small>src/blogs/{slug}.md</small>
}
