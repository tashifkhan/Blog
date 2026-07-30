/**
 * Directive validation, used as a publish-time gate.
 *
 * A malformed directive does not fail loudly — markdown-it leaves the line as
 * prose, so a typo like `:::waring` ships as literal colons in the middle of a
 * post. That is worth catching before publish rather than after, because
 * tashif.codes fetches post content at build time and will keep serving the
 * broken render until its next deploy.
 *
 * Deliberately free of any markdown-it dependency so the editor's server can
 * import it without pulling in a parser.
 */

import {
  COLUMN_RATIOS,
  DIRECTIVE_NAMES,
  MIN_MARKERS,
  codeFenceMarker,
  isCalloutName,
  leadingMarkers,
  parseDirectiveInfo,
} from './directives'

export type DirectiveIssue = {
  /** 1-based line number, so it can be reported straight to an author. */
  line: number
  message: string
}

type OpenDirective = {
  name: string
  line: number
  markers: number
  columns: number
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

export function validateDirectives(source: string): DirectiveIssue[] {
  const lines = source.split(/\r?\n/)
  const issues: DirectiveIssue[] = []
  const stack: OpenDirective[] = []
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

    const markers = leadingMarkers(line)
    if (markers < MIN_MARKERS) continue

    const rest = line.trimStart().slice(markers).trim()

    // A run of colons on its own closes the innermost directive.
    if (rest === '') {
      const open = stack.pop()
      if (!open) {
        issues.push({
          line: lineNumber,
          message: 'Closing ":::" with no directive open.',
        })
        continue
      }
      if (markers < open.markers) {
        issues.push({
          line: lineNumber,
          message: `Closing fence has ${markers} colons but ":::${open.name}" on line ${open.line} opened with ${open.markers}.`,
        })
      }
      if (open.name === 'two-col' && open.columns !== 2) {
        issues.push({
          line: lineNumber,
          message: `"two-col" needs exactly two ":::col" blocks, found ${open.columns}.`,
        })
      }
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

    const parent = stack[stack.length - 1]

    if (directive.name === 'col') {
      if (parent?.name !== 'two-col') {
        issues.push({
          line: lineNumber,
          message: '":::col" must sit directly inside a "two-col" directive.',
        })
      } else {
        parent.columns++
      }
    } else if (parent?.name === 'two-col') {
      issues.push({
        line: lineNumber,
        message: `"two-col" may only contain ":::col" blocks, found ":::${directive.name}".`,
      })
    }

    if (directive.name === 'two-col') {
      const ratio = directive.attrs.ratio
      if (ratio && !(ratio in COLUMN_RATIOS)) {
        issues.push({
          line: lineNumber,
          message: `Unsupported ratio "${ratio}". Use one of ${Object.keys(COLUMN_RATIOS).join(', ')}.`,
        })
      }
    }

    if (isCalloutName(directive.name) && directive.attrs.ratio) {
      issues.push({
        line: lineNumber,
        message: `":::${directive.name}" takes a title, not a ratio.`,
      })
    }

    stack.push({
      name: directive.name,
      line: lineNumber,
      markers,
      columns: 0,
    })
  }

  for (const open of stack) {
    issues.push({
      line: open.line,
      message: `":::${open.name}" is never closed. Add a line of ${open.markers} colons.`,
    })
  }

  return issues
}

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
