import { describe, expect, it } from 'vitest'

import { publishArticleSchema } from './publishing-schema'

const VALID_REQUEST = {
  articleContent: '---\ntitle: "Test"\n---\n\nBody.\n',
  commitMessage: 'content: publish test',
  expectedHeadSha: 'a'.repeat(40),
  images: [],
  slug: 'Test',
}

describe('publishing schema', () => {
  it('preserves commit message whitespace exactly', () => {
    const result = publishArticleSchema.parse({
      ...VALID_REQUEST,
      commitMessage: '  exact message  ',
    })
    expect(result.commitMessage).toBe('  exact message  ')
  })

  it('defaults to refusing to overwrite an existing post', () => {
    expect(publishArticleSchema.parse(VALID_REQUEST).overwrite).toBe(false)
  })

  it('rejects unresolved editor-only media references', () => {
    const result = publishArticleSchema.safeParse({
      ...VALID_REQUEST,
      articleContent:
        '---\ntitle: "Test"\n---\n\n![draft](asset:temporary-image.png)\n',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('temporary-image.png')
  })

  it('accepts prose and code that merely contain the word asset', () => {
    for (const body of [
      'The `dataset:cover.png` key is required.',
      'Config:\n\n```yaml\nasset: ./cover.png\n```\n',
      'We ship one asset: the compiled bundle.',
    ]) {
      const result = publishArticleSchema.safeParse({
        ...VALID_REQUEST,
        articleContent: `---\ntitle: "Test"\n---\n\n${body}\n`,
      })
      expect(result.success, body).toBe(true)
    }
  })

  it('rejects duplicate image filenames ignoring case', () => {
    const result = publishArticleSchema.safeParse({
      ...VALID_REQUEST,
      images: [
        { blobSha: 'b'.repeat(40), filename: 'Cover.webp' },
        { blobSha: 'c'.repeat(40), filename: 'cover.webp' },
      ],
    })
    expect(result.success).toBe(false)
  })
})
