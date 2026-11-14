import { describe, expect, it } from 'vitest'
import { validateSize } from './validation'
import { TARGETS } from '@/targets'
import { cloneProject, collectAssetIds, retargetSpread } from './doc'
import { TEMPLATES } from '@/templates'
import { projectFromTemplate } from '@/templates/builder'

describe('templates', () => {
  it.each(TEMPLATES.map((t) => [t.id, t] as const))('%s builds a valid project', (_id, t) => {
    const p = projectFromTemplate(t)
    expect(p.spreads.length).toBeGreaterThan(0)
    for (const s of p.spreads) {
      const spec = TARGETS.find((x) => x.id === s.targetId)!
      expect(validateSize(spec, s.width, s.height).filter((i) => i.level === 'error')).toEqual([])
      expect(s.pages.length).toBeGreaterThan(0)
    }
  })

  it('clones a project with fresh ids and remapped zoom sources', () => {
    const p = projectFromTemplate(TEMPLATES.find((t) => t.id === 'wealth')!)
    const c = cloneProject(p, 'copy')
    expect(c.id).not.toBe(p.id)
    const zooms = c.spreads[0].pages.flatMap((pg) => pg.layers).filter((l) => l.type === 'zoom')
    const ids = new Set(c.spreads[0].pages.flatMap((pg) => pg.layers.map((l) => l.id)))
    expect(zooms.length).toBeGreaterThan(0)
    zooms.forEach((z) => z.type === 'zoom' && expect(ids.has(z.sourceId!)).toBe(true))
    expect(collectAssetIds(c).every((id) => id.startsWith('demo:'))).toBe(true)
  })

  it('retargets a spread proportionally', () => {
    const p = projectFromTemplate(TEMPLATES[0])
    const s = p.spreads[0]
    const beforeX = s.pages[0].layers[0].x
    retargetSpread(s, s.width * 2, s.height * 2)
    expect(s.pages[0].layers[0].x).toBeCloseTo(beforeX * 2)
  })
})
