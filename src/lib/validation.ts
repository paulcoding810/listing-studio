import type { TargetSpec } from '@/types/target'

export interface Issue {
  level: 'error' | 'warning'
  message: string
}

export interface OutputCheck {
  width: number
  height: number
  format: 'png' | 'jpg'
  hasAlpha?: boolean
  bytes?: number
}

export function validateSize(spec: TargetSpec, width: number, height: number): Issue[] {
  const issues: Issue[] = []
  const exact = spec.sizes?.some((s) => s.w === width && s.h === height) ?? false
  if (spec.range) {
    const { minSide, maxSide, maxAspect } = spec.range
    const short = Math.min(width, height)
    const long = Math.max(width, height)
    if (short < minSide) issues.push({ level: 'error', message: `Shortest side must be at least ${minSide}px (is ${short}px).` })
    if (long > maxSide) issues.push({ level: 'error', message: `Longest side must be at most ${maxSide}px (is ${long}px).` })
    if (long / short > maxAspect + 1e-6)
      issues.push({ level: 'error', message: `Aspect ratio ${(long / short).toFixed(2)}:1 exceeds the ${maxAspect}:1 limit.` })
    if (!exact && spec.sizes?.length && issues.length === 0 && spec.store !== 'custom')
      issues.push({ level: 'warning', message: `Accepted, but ${spec.defaultSize.w}×${spec.defaultSize.h} is recommended.` })
  } else if (spec.sizes && !exact) {
    const list = spec.sizes.map((s) => `${s.w}×${s.h}`).join(', ')
    issues.push({ level: 'error', message: `Must be exactly one of: ${list} (is ${width}×${height}).` })
  }
  return issues
}

export function validateOutput(spec: TargetSpec, out: OutputCheck): Issue[] {
  const issues = validateSize(spec, out.width, out.height)
  if (!spec.formats.includes(out.format))
    issues.push({ level: 'error', message: `${out.format.toUpperCase()} is not accepted. Use ${spec.formats.join(' or ').toUpperCase()}.` })
  if (spec.alpha === 'forbidden' && out.hasAlpha)
    issues.push({ level: 'error', message: 'Transparency is not allowed. The image will be flattened.' })
  if (spec.maxBytes && out.bytes && out.bytes > spec.maxBytes)
    issues.push({ level: 'error', message: `File is ${formatBytes(out.bytes)}, limit is ${formatBytes(spec.maxBytes)}.` })
  return issues
}

export function validateCount(spec: TargetSpec, count: number): Issue[] {
  if (!spec.count) return []
  if (count < spec.count.min)
    return [{ level: 'warning', message: `${spec.label}: at least ${spec.count.min} required (have ${count}).` }]
  if (count > spec.count.max)
    return [{ level: 'error', message: `${spec.label}: at most ${spec.count.max} allowed (have ${count}).` }]
  return []
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
