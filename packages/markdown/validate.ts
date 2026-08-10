/**
 * Document validation, used as a publish-time gate.
 *
 * A malformed component does not fail loudly — the parsers hand anything they
 * do not recognise back to Markdown, so a typo like `:::waring` ships as
 * literal colons and `<Metre />` ships as raw HTML. That is worth catching
 * before publish rather than after, because tashif.codes fetches post content
 * at build time and will keep serving the broken render until its next deploy.
 *
 * Every rule below is derived from `components.ts`, so a new component is
 * validated the day it is added without anyone editing this file.
 *
 * Deliberately free of any markdown-it dependency so the editor's server can
 * import it without pulling in a parser.
 */

import {
  type ComponentSpec,
  DIRECTIVE_NAMES,
  embedUrl,
  findByTag,
  isIconName,
} from './components'
import {
  codeFenceMarker,
  leadingMarkers,
  MIN_MARKERS,
  parseDirectiveInfo,
} from './directives'
import { parseOpenTag } from './jsx'

export type DirectiveIssue = {
  /** 1-based line number, so it can be reported straight to an author. */
  line: number
  message: string
}

type OpenComponent = {
  spec: ComponentSpec
  /** The spelling the author used, for error messages. */
  raw: string
  line: number
  /** Colon count for a `:::` opener, `0` for a `<Tag>` opener. */
  markers: number
  /** Direct children seen so far that match the parent's `children.name`. */
  matched: number
}

const KNOWN_NAMES = DIRECTIVE_NAMES.join(', ')

/** Index of the line after the closing `---` of a frontmatter block. */
function skipFrontmatter(lines: readonly string[]): number {
  if (lines[0]?.trim() !== '---') return 0
  for (let index = 1; index < lines.length; index++) {
    if (lines[index].trim() === '---') return index + 1
  }
  return 0
}

/** How the author referred to a component, for a message they'll recognise. */
function label(open: OpenComponent): string {
  return open.markers > 0 ? `":::${open.raw}"` : `"<${open.raw}>"`
}

// ---------------------------------------------------------------------------
// Attribute checks
// ---------------------------------------------------------------------------

function checkAttrs(
  spec: ComponentSpec,
  attrs: Record<string, string>,
  line: number,
  issues: DirectiveIssue[],
): void {
  for (const [key, value] of Object.entries(attrs)) {
    const attr = spec.attrs[key]
    if (!attr) {
      const known = Object.keys(spec.attrs)
      issues.push({
        line,
        message: known.length
          ? `"${spec.name}" has no attribute "${key}". Known attributes: ${known.join(', ')}.`
          : `"${spec.name}" takes no attributes, found "${key}".`,
      })
      continue
    }

    if (attr.type === 'enum' && !attr.values?.includes(value)) {
      issues.push({
        line,
        message: `"${key}" on "${spec.name}" must be one of ${attr.values?.join(', ')}, found "${value}".`,
      })
      continue
    }

    if (attr.type === 'number' && !Number.isFinite(Number(value))) {
      issues.push({
        line,
        message: `"${key}" on "${spec.name}" must be a number, found "${value}".`,
      })
    }
  }

  for (const [key, attr] of Object.entries(spec.attrs)) {
    if (attr.required && attrs[key] === undefined) {
      issues.push({
        line,
        message: `"${spec.name}" requires the "${key}" attribute${attr.describe ? ` (${attr.describe})` : ''}.`,
      })
    }
  }

  // An id the allowlist rejects renders as an error span rather than a frame,
  // which is precisely the kind of silent breakage this gate exists to catch.
  if (spec.name === 'Embed' && attrs.type && attrs.id) {
    if (!embedUrl(attrs.type, attrs.id)) {
      issues.push({
        line,
        message: `"${attrs.id}" is not a valid ${attrs.type} id.`,
      })
    }
  }

  // Icon names are free strings in the attr schema (the enum would be huge),
  // so unknown names are checked here against the Lucide-style registry.
  const iconAttr =
    attrs.icon !== undefined
      ? attrs.icon
      : spec.name === 'Icon' && attrs.name !== undefined
        ? attrs.name
        : undefined
  if (iconAttr !== undefined && !isIconName(String(iconAttr))) {
    issues.push({
      line,
      message:
        `"${iconAttr}" is not a known Lucide-style icon. ` +
        `Examples: arrow-up-right, arrow-down-left, languages, zap, file-text, download.`,
    })
  }
}

// ---------------------------------------------------------------------------
// Structural checks
// ---------------------------------------------------------------------------

function checkPlacement(
  spec: ComponentSpec,
  stack: OpenComponent[],
  line: number,
  issues: DirectiveIssue[],
): void {
  const parent = stack[stack.length - 1]

  if (spec.parents) {
    if (!parent || !spec.parents.includes(parent.spec.name)) {
      issues.push({
        line,
        message: `"${spec.name}" must sit directly inside ${spec.parents.map((name) => `"${name}"`).join(' or ')}.`,
      })
    }
  }

  if (parent?.spec.children) {
    if (parent.spec.children.name === spec.name) parent.matched++
    else {
      issues.push({
        line,
        message: `"${parent.spec.name}" may only contain "${parent.spec.children.name}", found "${spec.name}".`,
      })
    }
  }
}

function checkChildCount(
  open: OpenComponent,
  line: number,
  issues: DirectiveIssue[],
): void {
  const rule = open.spec.children
  if (!rule) return

  const { min, max } = rule
  if (min !== undefined && open.matched < min) {
    issues.push({
      line,
      message:
        min === max
          ? `"${open.spec.name}" needs exactly ${min} "${rule.name}" blocks, found ${open.matched}.`
          : `"${open.spec.name}" needs at least ${min} "${rule.name}" blocks, found ${open.matched}.`,
    })
  } else if (max !== undefined && open.matched > max) {
    issues.push({
      line,
      message: `"${open.spec.name}" allows at most ${max} "${rule.name}" blocks, found ${open.matched}.`,
    })
  }
}

// ---------------------------------------------------------------------------
// Tag scanning
// ---------------------------------------------------------------------------

/**
 * Blank out inline code spans, preserving length.
 *
 * A post that documents the components — the gallery post is the obvious one —
 * writes `` `<Steps>` `` in prose, and the renderer correctly treats that as
 * code. Without this the linter would read it as a real unclosed tag and block
 * the publish. Spaces rather than removal so column positions still line up
 * with the original text.
 */
function maskInlineCode(line: string): string {
  let out = ''
  let index = 0

  while (index < line.length) {
    if (line[index] !== '`') {
      out += line[index]
      index++
      continue
    }

    let ticks = 0
    while (index + ticks < line.length && line[index + ticks] === '`') ticks++

    const fence = '`'.repeat(ticks)
    const close = line.indexOf(fence, index + ticks)
    if (close === -1) {
      // Unterminated: not a code span, so leave it to be scanned.
      out += fence
      index += ticks
      continue
    }

    const end = close + ticks
    out += ' '.repeat(end - index)
    index = end
  }

  return out
}

const CLOSE_TAG = /^<\/([A-Za-z][A-Za-z0-9]*)\s*>/

type TagEvent =
  | { kind: 'open'; spec: ComponentSpec; attrs: Record<string, string>; column: number }
  | { kind: 'close'; spec: ComponentSpec; column: number }
  | { kind: 'self'; spec: ComponentSpec; attrs: Record<string, string>; column: number }

/** Every component tag on a line, in order. Unregistered tags are ignored. */
function scanTags(line: string): TagEvent[] {
  const events: TagEvent[] = []

  for (let index = 0; index < line.length; index++) {
    if (line[index] !== '<') continue

    const close = CLOSE_TAG.exec(line.slice(index))
    if (close) {
      const spec = findByTag(close[1])
      if (spec) {
        events.push({ kind: 'close', spec, column: index })
        index += close[0].length - 1
      }
      continue
    }

    const tag = parseOpenTag(line, index)
    if (!tag) continue
    events.push({
      kind: tag.selfClosing || tag.spec.body === 'none' ? 'self' : 'open',
      spec: tag.spec,
      attrs: tag.attrs,
      column: index,
    })
    index = tag.end - 1
  }

  return events
}

// ---------------------------------------------------------------------------

export function validateDocument(source: string): DirectiveIssue[] {
  const lines = source.split(/\r?\n/)
  const issues: DirectiveIssue[] = []
  const stack: OpenComponent[] = []
  let codeMarker: string | null = null

  for (let index = skipFrontmatter(lines); index < lines.length; index++) {
    const line = lines[index]
    const lineNumber = index + 1

    const fence = codeFenceMarker(line)
    if (fence) {
      if (codeMarker === null) codeMarker = fence
      else if (codeMarker === fence) codeMarker = null
      continue
    }
    if (codeMarker !== null) continue

    // Everything below reads the masked copy, so a component named inside an
    // inline code span is documentation rather than markup.
    const scan = maskInlineCode(line)

    // ---- `:::` directives -------------------------------------------------
    const markers = leadingMarkers(scan)
    if (markers >= MIN_MARKERS) {
      const rest = scan.trimStart().slice(markers).trim()

      // A run of colons on its own closes the innermost component.
      if (rest === '') {
        const open = stack.pop()
        if (!open) {
          issues.push({
            line: lineNumber,
            message: 'Closing ":::" with no component open.',
          })
          continue
        }
        if (open.markers === 0) {
          issues.push({
            line: lineNumber,
            message: `Closing ":::" but "<${open.raw}>" on line ${open.line} was opened as a tag. Close it with "</${open.spec.name}>".`,
          })
        } else if (markers < open.markers) {
          issues.push({
            line: lineNumber,
            message: `Closing fence has ${markers} colons but ":::${open.raw}" on line ${open.line} opened with ${open.markers}.`,
          })
        }
        checkChildCount(open, lineNumber, issues)
        continue
      }

      const directive = parseDirectiveInfo(rest)
      if (!directive) {
        const name = /^([a-z][a-z0-9-]*)/i.exec(rest)?.[1]?.toLowerCase()
        const known = name
          ? (DIRECTIVE_NAMES as readonly string[]).includes(name)
          : false
        issues.push({
          line: lineNumber,
          message: known
            ? `Malformed attributes on ":::${name}". Use {key="value"} or a bare value.`
            : `Unknown directive ":::${rest}". Known directives: ${KNOWN_NAMES}.`,
        })
        continue
      }

      checkPlacement(directive.spec, stack, lineNumber, issues)
      checkAttrs(directive.spec, directive.attrs, lineNumber, issues)

      if (directive.spec.body === 'none') {
        // Nothing to close, so it never joins the stack.
        continue
      }

      stack.push({
        spec: directive.spec,
        raw: directive.raw,
        line: lineNumber,
        markers,
        matched: 0,
      })
      continue
    }

    // ---- `<Tag>` components ----------------------------------------------
    if (!scan.includes('<')) continue

    const trimmed = scan.trim()
    const indent = scan.length - scan.trimStart().length

    for (const event of scanTags(scan)) {
      const inlineAllowed = event.spec.placement === 'inline' || event.spec.placement === 'both'

      if (event.kind === 'close') {
        const open = stack.pop()
        if (!open) {
          issues.push({
            line: lineNumber,
            message: `"</${event.spec.name}>" with no matching opening tag.`,
          })
          continue
        }
        if (open.spec.name !== event.spec.name) {
          issues.push({
            line: lineNumber,
            message: `"</${event.spec.name}>" closes ${label(open)} opened on line ${open.line}. Close the inner one first.`,
          })
        }
        if (open.markers > 0) {
          issues.push({
            line: lineNumber,
            message: `"</${event.spec.name}>" but ":::${open.raw}" on line ${open.line} was opened as a directive. Close it with ":::".`,
          })
        }
        checkChildCount(open, lineNumber, issues)
        continue
      }

      // A block component that is not alone on its line renders as raw HTML,
      // which is exactly the silent failure this gate exists to catch. The
      // single-line `<Note>text</Note>` form is fine — the parser expands it.
      if (!inlineAllowed && event.column !== indent) {
        issues.push({
          line: lineNumber,
          message: `"<${event.spec.name}>" must start its own line. Put it on a line by itself, or write "<${event.spec.name}>text</${event.spec.name}>" on one line.`,
        })
      }

      checkPlacement(event.spec, stack, lineNumber, issues)
      checkAttrs(event.spec, event.attrs, lineNumber, issues)

      if (event.kind === 'self') continue

      // The single-line paired form opens and closes on the same line.
      const closing = `</${event.spec.name}>`
      if (
        event.column === indent &&
        trimmed.toLowerCase().endsWith(closing.toLowerCase())
      ) {
        checkChildCount(
          { spec: event.spec, raw: event.spec.name, line: lineNumber, markers: 0, matched: 0 },
          lineNumber,
          issues,
        )
        break
      }

      stack.push({
        spec: event.spec,
        raw: event.spec.name,
        line: lineNumber,
        markers: 0,
        matched: 0,
      })
    }
  }

  for (const open of stack) {
    issues.push({
      line: open.line,
      message:
        open.markers > 0
          ? `":::${open.raw}" is never closed. Add a line of ${open.markers} colons.`
          : `"<${open.raw}>" is never closed. Add "</${open.spec.name}>".`,
    })
  }

  return issues
}

/** @deprecated Renamed to `validateDocument` now that it validates tags too. */
export const validateDirectives = validateDocument

/** One-line summary suitable for a validation error message. */
export function formatDirectiveIssues(
  issues: readonly DirectiveIssue[],
  limit = 3,
): string {
  const shown = issues
    .slice(0, limit)
    .map((issue) => `line ${issue.line}: ${issue.message}`)
    .join(' ')
  const remaining = issues.length - limit
  return remaining > 0 ? `${shown} (+${remaining} more)` : shown
}
