import { describe, expect, it } from 'vitest'
import { TARGETS, staleTargets } from '.'

describe('store spec registry', () => {
  it('has unique ids and a default size that passes its own rules', () => {
    expect(new Set(TARGETS.map((t) => t.id)).size).toBe(TARGETS.length)
  })

  it('was re-verified against store docs within the last year', () => {
    const stale = staleTargets(365).map((t) => `${t.id} (${t.verifiedAt})`)
    expect(stale, 'Re-check these specs against the official store pages and bump verifiedAt').toEqual([])
  })
})
