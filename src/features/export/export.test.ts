import { describe, expect, it } from 'vitest'
import { createBlankProject } from '@/lib/factory'
import { fileName } from './export'

describe('fileName', () => {
  const p = createBlankProject('My App', 'google-play/phone', 2)
  const s = p.spreads[0]
  const base = { format: 'png' as const, quality: 0.9, scale: 1, naming: '{index}-{page}', profile: 'zip' as const }

  it('builds a store/set path', () => {
    expect(fileName(p, { spreadId: s.id, pageIndex: 0, locale: 'en-US' }, base)).toBe('google-play/phone-screenshots/01-screen-1.png')
  })

  it('uses the fastlane layout when requested', () => {
    expect(fileName(p, { spreadId: s.id, pageIndex: 1, locale: 'de-DE' }, { ...base, profile: 'fastlane' })).toBe(
      'metadata/android/de-DE/images/phoneScreenshots/02-screen-2.png',
    )
  })

  it('names single-file assets directly in fastlane', () => {
    const fg = createBlankProject('X', 'google-play/feature-graphic', 1)
    expect(fileName(fg, { spreadId: fg.spreads[0].id, pageIndex: 0, locale: 'en-US' }, { ...base, profile: 'fastlane', format: 'jpg' })).toBe(
      'metadata/android/en-US/images/featureGraphic.jpg',
    )
  })
})

describe('icon variant paths', () => {
  it('uses fixed store paths and the fastlane icon location', async () => {
    const { createBlankProject } = await import('@/lib/factory')
    const p = createBlankProject('Icon', 'icon/master', 1)
    const id = p.spreads[0].id
    const base = { format: 'png' as const, quality: 1, scale: 1, naming: '{index}', profile: 'zip' as const }
    expect(fileName(p, { spreadId: id, pageIndex: 0, locale: 'en-US', variantId: 'chrome' }, base)).toBe('chrome-web-store/icon-128.png')
    expect(fileName(p, { spreadId: id, pageIndex: 0, locale: 'en-US', variantId: 'play' }, { ...base, profile: 'fastlane' })).toBe('metadata/android/en-US/images/icon.png')
  })
})
