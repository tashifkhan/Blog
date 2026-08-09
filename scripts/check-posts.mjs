#!/usr/bin/env bun
/**
 * Lint and smoke-render every post in src/blogs.
 *
 * The publish route runs `validateDocument` on a single article; this runs the
 * same gate across the whole library, plus a render, so a refactor that breaks
 * one post out of fifteen is caught before it ships rather than on the page.
 *
 *   bun scripts/check-posts.mjs
 *   bun scripts/check-posts.mjs Web-Vitals-Guide
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { extractOutline, renderMarkdown, validateDocument } from '../packages/markdown/index.ts'

const DIR = 'src/blogs'
const filter = process.argv[2]

/** Component tags that survived rendering, i.e. did not resolve. */
const LEAKED = /&lt;\/?([A-Z][A-Za-z0-9]*)[^&]*&gt;/g

let failed = 0

for (const name of readdirSync(DIR).filter((f) => f.endsWith('.md')).sort()) {
  if (filter && !name.includes(filter)) continue

  const raw = readFileSync(join(DIR, name), 'utf8')
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '')

  const issues = validateDocument(raw)
  const html = renderMarkdown(body, { mermaid: true })
  const outline = extractOutline(raw)

  // A tag that reaches the reader escaped is a component that did not resolve.
  //
  // Code legitimately contains JSX, and the copy button carries an escaped copy
  // of the whole block in `data-code`, so both come out before looking. What is
  // left is prose, where an escaped `<Steps>` means the parser declined it.
  const prose = html
    .replace(/ data-code="[^"]*"/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '')
    .replace(/<code[\s\S]*?<\/code>/g, '')
  const leaked = [...prose.matchAll(LEAKED)].map((m) => m[1])

  const opens = (html.match(/<div/g) ?? []).length
  const closes = (html.match(/<\/div>/g) ?? []).length

  const problems = []
  if (issues.length) problems.push(...issues.map((i) => `line ${i.line}: ${i.message}`))
  if (leaked.length) problems.push(`unresolved tags: ${[...new Set(leaked)].join(', ')}`)
  if (opens !== closes) problems.push(`div imbalance: ${opens} open, ${closes} close`)

  const status = problems.length ? '✗' : '✓'
  const used = outline.components.length
  console.log(
    `${status} ${name.padEnd(40)} ${String(outline.wordCount).padStart(5)}w  ${String(used).padStart(2)} components`,
  )
  for (const problem of problems) console.log(`    ${problem}`)
  if (problems.length) failed++
}

if (failed) {
  console.error(`\n${failed} post(s) with problems`)
  process.exit(1)
}
