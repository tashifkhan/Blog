import { describe, expect, it } from 'vitest'

import { createId } from './id'

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('createId', () => {
  it('returns a UUID-shaped string', () => {
    expect(createId()).toMatch(UUID_V4)
  })

  it('returns distinct values', () => {
    const ids = new Set(Array.from({ length: 20 }, () => createId()))
    expect(ids.size).toBe(20)
  })

  it('works when randomUUID is missing (Firefox non-secure HTTP)', () => {
    const original = crypto.randomUUID
    // @ts-expect-error — simulate Firefox on http://tailscale-host
    crypto.randomUUID = undefined
    try {
      expect(createId()).toMatch(UUID_V4)
    } finally {
      crypto.randomUUID = original
    }
  })
})
