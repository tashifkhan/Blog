import { describe, expect, it } from 'vitest'

import {
  buildArticle,
  normalizeFilename,
  resolveAssetReferences,
  resolveCoverImage,
  slugify,
  uniqueFilename,
} from './article'
import { findAssetReferences } from './publishing-rules'

const DRAFT = {
  body: 'Body text.',
  commitMessage: 'content: publish',
  coverImage: '',
  date: '2026-07-29',
  excerpt: 'A crisp sentence.',
  slug: 'React-Native-Architecture',
  tags: 'React, Mobile Development',
  title: 'React Native Architecture',
}

describe('slugify', () => {
  it('strips diacritics and punctuation', () => {
    expect(slugify('Héllo, Wörld!')).toBe('Hello-World')
  })

  it('trims leading and trailing separators', () => {
    expect(slugify('  --draft--  ')).toBe('draft')
  })
})

describe('normalizeFilename', () => {
  it('slugifies the stem and lowercases the extension', () => {
    expect(normalizeFilename('My Cover Shot.PNG')).toBe('my-cover-shot.png')
  })

  it('falls back to a usable name', () => {
    expect(normalizeFilename('___.webp')).toBe('image.webp')
  })
})

describe('uniqueFilename', () => {
  it('keeps a free name untouched', () => {
    expect(uniqueFilename('cover.png', new Set(['other.png']))).toBe(
      'cover.png',
    )
  })

  it('suffixes past every taken name so a second paste still attaches', () => {
    expect(uniqueFilename('image.png', new Set(['image.png']))).toBe(
      'image-2.png',
    )
    expect(
      uniqueFilename('image.png', new Set(['image.png', 'image-2.png'])),
    ).toBe('image-3.png')
  })

  it('compares case-insensitively, matching how attachments clash', () => {
    expect(uniqueFilename('Cover.PNG', new Set(['cover.png']))).toBe(
      'Cover-2.PNG',
    )
  })
})

describe('buildArticle', () => {
  it('emits frontmatter matching the fields existing posts carry', () => {
    const article = buildArticle(DRAFT, [])
    expect(article).toContain('title: "React Native Architecture"')
    expect(article).toContain('author: "Tashif Ahmad Khan"')
    expect(article).toContain('socials: ["https://www.github.com/tashifkhan"')
    expect(article).toContain('tags: ["React", "Mobile Development"]')
    expect(article).toContain('excerpt: "A crisp sentence."')
  })

  it('emits an empty tag list rather than omitting the key', () => {
    expect(buildArticle({ ...DRAFT, tags: '' }, [])).toContain('tags: []')
  })

  it('omits coverImage when none is set', () => {
    expect(buildArticle(DRAFT, [])).not.toContain('coverImage:')
  })

  it('emits a public cover path when the cover is attached', () => {
    const article = buildArticle(
      { ...DRAFT, coverImage: 'cover.webp' },
      ['cover.webp'],
    )
    expect(article).toContain(
      'coverImage: "/images/blog/React-Native-Architecture/cover.webp"',
    )
  })

  it('omits coverImage when the cover file is not attached', () => {
    const article = buildArticle(
      { ...DRAFT, coverImage: 'missing.webp' },
      [],
    )
    expect(article).not.toContain('coverImage:')
  })

  it('rewrites attached asset references to their published paths', () => {
    const article = buildArticle(
      { ...DRAFT, body: '![Cover](asset:cover.webp)' },
      ['cover.webp'],
    )
    expect(article).toContain(
      '![Cover](/images/blog/React-Native-Architecture/cover.webp)',
    )
    expect(findAssetReferences(article)).toEqual([])
  })

  it('leaves references to detached images unresolved so they are caught', () => {
    const article = buildArticle(
      { ...DRAFT, body: '![Cover](asset:missing.webp)' },
      [],
    )
    expect(findAssetReferences(article)).toEqual(['missing.webp'])
  })
})

describe('resolveCoverImage', () => {
  it('returns null for an empty cover', () => {
    expect(resolveCoverImage('', ['cover.webp'], 'Post')).toBeNull()
  })

  it('resolves an attached filename to its public path', () => {
    expect(resolveCoverImage('cover.webp', ['cover.webp'], 'Post')).toBe(
      '/images/blog/Post/cover.webp',
    )
  })

  it('passes through an already-public path', () => {
    expect(
      resolveCoverImage(
        '/images/blog/Post/hero.png',
        [],
        'Post',
      ),
    ).toBe('/images/blog/Post/hero.png')
  })

  it('returns null when the cover is not among attachments', () => {
    expect(resolveCoverImage('gone.webp', ['other.png'], 'Post')).toBeNull()
  })
})

describe('resolveAssetReferences', () => {
  it('replaces every occurrence of the same reference', () => {
    const resolved = resolveAssetReferences(
      'asset:a.png then asset:a.png',
      ['a.png'],
      'Post',
    )
    expect(resolved).toBe(
      '/images/blog/Post/a.png then /images/blog/Post/a.png',
    )
  })
})

describe('findAssetReferences', () => {
  it('ignores words that merely end in "asset:"', () => {
    expect(findAssetReferences('dataset:cover.png')).toEqual([])
  })

  it('ignores a YAML key named asset', () => {
    expect(findAssetReferences('asset: ./cover.png')).toEqual([])
  })

  it('deduplicates repeated references', () => {
    expect(findAssetReferences('asset:a.png asset:a.png asset:b.webp')).toEqual([
      'a.png',
      'b.webp',
    ])
  })
})
