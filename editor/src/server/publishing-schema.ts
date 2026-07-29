import { z } from 'zod'

import {
  IMAGE_FILENAME_PATTERN,
  MAX_ARTICLE_BYTES,
  MAX_COMMIT_MESSAGE_LENGTH,
  MAX_IMAGE_BASE64_LENGTH,
  MAX_IMAGES,
  SHA_PATTERN,
  SLUG_PATTERN,
  findAssetReferences,
} from '../lib/publishing-rules'

export const imageUploadSchema = z.object({
  filename: z.string().regex(IMAGE_FILENAME_PATTERN, 'Unsafe image filename'),
  contentBase64: z
    .string()
    .min(1)
    .max(MAX_IMAGE_BASE64_LENGTH)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'Invalid base64 image data'),
})

const publishImageSchema = z.object({
  filename: z.string().regex(IMAGE_FILENAME_PATTERN, 'Unsafe image filename'),
  blobSha: z.string().regex(SHA_PATTERN, 'Invalid Git blob SHA').toLowerCase(),
})

export const slugSchema = z
  .string()
  .regex(SLUG_PATTERN, 'Slug may contain only letters, numbers, and hyphens')

export const publishArticleSchema = z
  .object({
    slug: slugSchema,
    articleContent: z
      .string()
      .min(1)
      .refine(
        (value) => Buffer.byteLength(value, 'utf8') <= MAX_ARTICLE_BYTES,
        `Article must be at most ${MAX_ARTICLE_BYTES} UTF-8 bytes`,
      )
      .refine((value) => !value.includes('\0'), 'Article contains a NUL byte'),
    commitMessage: z
      .string()
      .min(1)
      .max(MAX_COMMIT_MESSAGE_LENGTH)
      .refine((value) => value.trim().length > 0, 'Commit message is blank')
      .refine(
        (value) => !value.includes('\0'),
        'Commit message contains a NUL byte',
      ),
    expectedHeadSha: z
      .string()
      .regex(SHA_PATTERN, 'Invalid Git commit SHA')
      .toLowerCase(),
    images: z.array(publishImageSchema).max(MAX_IMAGES),
    // Publishing over an existing post is destructive, so the editor has to ask
    // for it explicitly rather than the server inferring intent from the slug.
    overwrite: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    // Any `asset:` placeholder still present points at an image the editor no
    // longer holds, so the published Markdown would link to nothing.
    const unresolved = findAssetReferences(value.articleContent)
    if (unresolved.length) {
      context.addIssue({
        code: 'custom',
        message: `Unresolved editor image reference: ${unresolved
          .slice(0, 3)
          .join(', ')}. Re-attach the image or remove the link.`,
        path: ['articleContent'],
      })
    }

    const filenames = new Set<string>()
    for (const image of value.images) {
      const normalized = image.filename.toLowerCase()
      if (filenames.has(normalized)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate image filename: ${image.filename}`,
          path: ['images'],
        })
      }
      filenames.add(normalized)
    }
  })

export type ImageUploadInput = z.infer<typeof imageUploadSchema>
export type PublishArticleInput = z.infer<typeof publishArticleSchema>
