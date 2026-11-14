import { describe, expect, it } from 'vitest'
import { getTarget } from '@/targets'
import { validateCount, validateOutput, validateSize } from './validation'

describe('validateSize', () => {
  it('accepts exact App Store sizes and rejects others', () => {
    const spec = getTarget('app-store/iphone-6.9')
    expect(validateSize(spec, 1320, 2868)).toEqual([])
    expect(validateSize(spec, 2868, 1320)).toEqual([])
    expect(validateSize(spec, 1080, 1920)[0].level).toBe('error')
  })

  it('applies Google Play range rules', () => {
    const spec = getTarget('google-play/phone')
    expect(validateSize(spec, 1080, 1920)).toEqual([])
    expect(validateSize(spec, 1000, 2100).some((i) => i.message.includes('Aspect'))).toBe(true)
    expect(validateSize(spec, 200, 300).some((i) => i.message.includes('Shortest'))).toBe(true)
    expect(validateSize(spec, 1200, 2000)[0].level).toBe('warning')
  })

  it('requires the exact feature graphic size', () => {
    expect(validateSize(getTarget('google-play/feature-graphic'), 1024, 500)).toEqual([])
    expect(validateSize(getTarget('google-play/feature-graphic'), 1024, 512)).toHaveLength(1)
  })
})

describe('validateOutput', () => {
  it('flags format, alpha and size limits', () => {
    const icon = getTarget('google-play/icon')
    const issues = validateOutput(icon, { width: 512, height: 512, format: 'jpg', bytes: 2 * 1024 * 1024 })
    expect(issues.map((i) => i.level)).toEqual(['error', 'error'])
    const shot = getTarget('chrome-web-store/screenshot')
    expect(validateOutput(shot, { width: 1280, height: 800, format: 'png', hasAlpha: true })).toHaveLength(1)
  })
})

describe('validateCount', () => {
  it('checks min and max', () => {
    const spec = getTarget('chrome-web-store/screenshot')
    expect(validateCount(spec, 3)).toEqual([])
    expect(validateCount(spec, 6)[0].level).toBe('error')
    expect(validateCount(spec, 0)[0].level).toBe('warning')
  })
})
