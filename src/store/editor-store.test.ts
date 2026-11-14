import { beforeEach, describe, expect, it } from 'vitest'
import { textFor } from '@/features/canvas/render-context'
import { findLayer } from '@/lib/doc'
import { createBlankProject, createShape, createText, DEFAULT_THEME } from '@/lib/factory'
import type { Layer, Project, TextLayer } from '@/types/project'
import { redo, resetHistory, undo, useEditor } from './editor-store'

const st = () => useEditor.getState()
const proj = () => st().project as Project
const layer = (id: string) => findLayer(proj(), id)!.layer
const pageLayers = (i = 0) => proj().spreads[0].pages[i].layers

function setup(pages = 1, locales = ['en-US']) {
  const p = createBlankProject('t', 'google-play/phone', pages)
  p.locales = locales
  p.spreads[0].pages.forEach((pg) => (pg.layers = []))
  st().load(p)
  resetHistory()
  return p
}

function addRects(names: string[], page = 0) {
  st().setActivePage(proj().spreads[0].pages[page].id)
  return names.map((name) => {
    const l = createShape('rect', DEFAULT_THEME, { name })
    st().addLayer(l)
    return l.id
  })
}

function addText(text = 'Hello') {
  const l = createText(DEFAULT_THEME, { text })
  st().addLayer(l)
  return l.id
}

const names = (layers: Layer[]) => layers.map((l) => l.name).join(',')

describe('editor store regressions', () => {
  beforeEach(() => setup())

  it('falls back to the default locale after removing the active one', () => {
    setup(1, ['en-US', 'de-DE'])
    const id = addText()
    st().setLocale('de-DE')
    st().removeLocale('de-DE')
    expect(st().activeLocale).toBe('en-US')
    st().setLayerText(id, 'Goodbye')
    expect((layer(id) as TextLayer).text).toBe('Goodbye')
    expect(proj().strings['de-DE']).toBeUndefined()
  })

  it('treats a cleared translation as missing so the default text shows', () => {
    setup(1, ['en-US', 'de-DE'])
    const id = addText('Hello')
    st().setLocale('de-DE')
    st().setLayerText(id, 'x')
    st().setLayerText(id, '')
    expect(proj().strings['de-DE']?.[id]).toBeUndefined()
    expect(textFor({ project: proj(), locale: 'de-DE' }, layer(id) as TextLayer)).toBe('Hello')
  })

  it('keeps translations when pasting layers', () => {
    setup(1, ['en-US', 'de-DE'])
    const id = addText('Hello')
    st().setLocale('de-DE')
    st().setLayerText(id, 'Hallo')
    const snapshot = { 'de-DE': { [id]: 'Hallo' } }
    st().pasteLayers([structuredClone(layer(id))], snapshot)
    const pasted = st().selectedIds[0]
    expect(pasted).not.toBe(id)
    expect(proj().strings['de-DE'][pasted]).toBe('Hallo')
  })

  it('does not wipe translations of locked layers on delete', () => {
    setup(1, ['en-US', 'de-DE'])
    const id = addText('Hello')
    st().setLocale('de-DE')
    st().setLayerText(id, 'Hallo')
    st().updateLayer(id, { locked: true })
    st().select([id])
    st().deleteLayers([id])
    expect(layer(id)).toBeDefined()
    expect(proj().strings['de-DE'][id]).toBe('Hallo')
    expect(st().selectedIds).toEqual([id])
  })

  it('keeps a layer in place when dragged between an image and the shared list', () => {
    setup(3)
    const [shared, phone] = addRects(['shared', 'phone'], 1)
    st().updateLayer(phone, { x: 100 })
    st().moveToContainer(shared, 'shared')
    const w = proj().spreads[0].width
    st().moveLayerTo(phone, shared, 'after')
    expect(proj().spreads[0].sharedLayers.map((l) => l.id)).toContain(phone)
    expect(layer(phone).x).toBe(100 + w)
    const [other] = addRects(['other'], 1)
    st().moveLayerTo(phone, other, 'before')
    expect(pageLayers(1).map((l) => l.id)).toContain(phone)
    expect(layer(phone).x).toBe(100)
  })

  it('arranges multiple selected layers as a block, independent of selection order', () => {
    const [a, b, c] = addRects(['A', 'B', 'C'])
    st().arrange([a, b], 'forward')
    expect(names(pageLayers())).toBe('C,A,B')
    st().arrange([b, a], 'backward')
    expect(names(pageLayers())).toBe('A,B,C')
    st().arrange([b, c], 'back')
    expect(names(pageLayers())).toBe('B,C,A')
    st().arrange([c, b], 'front')
    expect(names(pageLayers())).toBe('A,B,C')
  })

  it('records an edit made right after undo and clears redo', () => {
    const [a] = addRects(['A'])
    resetHistory()
    st().updateLayer(a, { x: 10 })
    undo()
    st().updateLayer(a, { x: 20 })
    const h = useEditor.temporal.getState()
    expect(h.pastStates.length).toBe(1)
    expect(h.futureStates.length).toBe(0)
    const before = createShape('rect', DEFAULT_THEME).x
    redo()
    expect(layer(a).x).toBe(20)
    undo()
    expect(layer(a).x).toBe(before)
  })
})
