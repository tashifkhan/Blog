import { describe, expect, it } from 'vitest'

import { draftFromMarkdown, summaryFromMarkdown } from './parse-article'

const SAMPLE = `---
title: "React Native Architecture"
date: 2026-07-29
author: "Tashif Ahmad Khan"
tags: ["React", "Mobile"]
excerpt: "A crisp sentence."
coverImage: "/images/blog/React-Native-Architecture/cover.webp"
---

## Hello

Body text.
`

describe('draftFromMarkdown', () => {
  it('parses frontmatter into a publishable draft', () => {
    const draft = draftFromMarkdown('React-Native-Architecture', SAMPLE)
    expect(draft.title).toBe('React Native Architecture')
    expect(draft.date).toBe('2026-07-29')
    expect(draft.tags).toBe('React, Mobile')
    expect(draft.excerpt).toBe('A crisp sentence.')
    expect(draft.coverImage).toBe(
      '/images/blog/React-Native-Architecture/cover.webp',
    )
    expect(draft.body).toContain('## Hello')
    expect(draft.slug).toBe('React-Native-Architecture')
    expect(draft.commitMessage).toContain('update')
  })

  it('falls back when frontmatter is missing', () => {
    const draft = draftFromMarkdown('Bare', 'Just a body.\n')
    expect(draft.title).toBe('Bare')
    expect(draft.body).toContain('Just a body')
    expect(draft.coverImage).toBe('')
  })
})

describe('summaryFromMarkdown', () => {
  it('exposes list fields without the body', () => {
    const summary = summaryFromMarkdown('React-Native-Architecture', SAMPLE)
    expect(summary.title).toBe('React Native Architecture')
    expect(summary.tags).toEqual(['React', 'Mobile'])
    expect(summary.coverImage).toContain('cover.webp')
  })
})
