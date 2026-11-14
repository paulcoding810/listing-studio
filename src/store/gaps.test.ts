import { beforeEach, describe, expect, it } from 'vitest'
import { cloneProject, collectAssetIds, findLayer, localizedLayer } from '@/lib/doc'
import { createBlankProject, createImage, createShape, DEFAULT_THEME } from '@/lib/factory'
import type { DeviceLayer, GroupLayer, Project, TextLayer } from '@/types/project'
import { resetHistory, useEditor } from './editor-store'

const st = () => useEditor.getState()
const proj = () => st().project as Project
const devices = () => proj().spreads[0].pages.map((p) => p.layers.find((l): l is DeviceLayer => l.type === 'device'))

function load(pages: number, locales = ['en-US']) {
  const p = createBlankProject('t', 'google-play/phone', pages)
  p.locales = locales
  st().load(p)
  resetHistory()
}

describe('fill frames from several screenshots', () => {
  beforeEach(() => load(3))

  it('fills the target frame and the following images in order', () => {
    const second = devices()[1]!
    expect(st().fillScreens({ deviceId: second.id }, ['a', 'b'])).toBe(2)
    expect(devices().map((d) => d?.screenAssetId)).toEqual([undefined, 'a', 'b'])
  })

  it('adds images to the set when there are more files than frames', () => {
    st().fillScreens({ spreadId: proj().spreads[0].id }, ['a', 'b', 'c', 'd', 'e'])
    expect(proj().spreads[0].pages).toHaveLength(5)
    expect(devices().map((d) => d?.screenAssetId)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})

describe('per-language screenshots and text size', () => {
  beforeEach(() => load(1, ['en-US', 'de-DE']))

  it('writes screenshots to the active language only and falls back to the shared one', () => {
    const d = devices()[0]!
    st().setLayerAsset(d.id, 'screenAssetId', 'en-shot')
    st().setLocale('de-DE')
    st().setLayerAsset(d.id, 'screenAssetId', 'de-shot')
    const raw = findLayer(proj(), d.id)!.layer as DeviceLayer
    expect(raw.screenAssetId).toBe('en-shot')
    expect(localizedLayer(proj(), 'de-DE', raw).screenAssetId).toBe('de-shot')
    expect(localizedLayer(proj(), 'en-US', raw).screenAssetId).toBe('en-shot')
    expect(collectAssetIds(proj())).toEqual(expect.arrayContaining(['en-shot', 'de-shot']))
    st().clearOverride(d.id, 'screenAssetId')
    expect(localizedLayer(proj(), 'de-DE', raw).screenAssetId).toBe('en-shot')
  })

  it('keeps a per-language text size and scales it when the set is resized', () => {
    const t = proj().spreads[0].pages[0].layers.find((l): l is TextLayer => l.type === 'text')!
    st().setLocale('de-DE')
    st().setFontSize(t.id, 40)
    expect((findLayer(proj(), t.id)!.layer as TextLayer).fontSize).toBe(t.fontSize)
    const sp = proj().spreads[0]
    st().retarget(sp.id, sp.targetId, sp.width / 2, sp.height / 2)
    expect(proj().overrides!['de-DE'][t.id].fontSize).toBe(20)
  })

  it('drops overrides with the layer and with the language', () => {
    const d = devices()[0]!
    st().setLocale('de-DE')
    st().setLayerAsset(d.id, 'screenAssetId', 'de-shot')
    st().duplicatePage(proj().spreads[0].pages[0].id)
    const copy = devices()[1]!
    expect(proj().overrides!['de-DE'][copy.id].screenAssetId).toBe('de-shot')
    st().deleteLayers([d.id])
    expect(proj().overrides!['de-DE'][d.id]).toBeUndefined()
    st().removeLocale('de-DE')
    expect(proj().overrides!['de-DE']).toBeUndefined()
  })
})

describe('linked app icon', () => {
  it('relinks icons to the new set ids when a project is cloned', () => {
    const p = createBlankProject('t', 'google-play/feature-graphic', 1)
    const icon = createBlankProject('i', 'icon/master', 1).spreads[0]
    p.spreads.push(icon)
    p.spreads[0].pages[0].layers.push(createImage(`icon:${icon.id}`, 100, 100))
    expect(collectAssetIds(p).some((id) => id.startsWith('icon:'))).toBe(false)
    const c = cloneProject(p, 'copy')
    const img = c.spreads[0].pages[0].layers.find((l) => l.type === 'image')!
    expect(img.type === 'image' && img.assetId).toBe(`icon:${c.spreads[1].id}`)
  })
})

describe('group resize from numeric fields', () => {
  it('scales the children', () => {
    load(1)
    const a = createShape('rect', DEFAULT_THEME, { x: 0, y: 0, width: 100, height: 100 })
    const b = createShape('rect', DEFAULT_THEME, { x: 100, y: 0, width: 100, height: 100 })
    st().addLayer(a)
    st().addLayer(b)
    st().groupLayers([a.id, b.id], { x: 0, y: 0, width: 200, height: 100 })
    const g = st().selectedIds[0]
    st().resizeGroup(g, 100, 50)
    const grp = findLayer(proj(), g)!.layer as GroupLayer
    expect(grp.children.map((c) => [c.x, c.width])).toEqual([
      [0, 50],
      [50, 50],
    ])
  })
})
