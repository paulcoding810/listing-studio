import { current, isDraft } from 'immer'
import { uid } from '@/lib/utils'
import type { Layer, Page, Project, Spread } from '@/types/project'

export function deepClone<T>(v: T): T {
  return structuredClone(isDraft(v) ? (current(v as never) as T) : v)
}

export interface LayerLocation {
  layer: Layer
  container: Layer[]
  index: number
  spread: Spread
  page?: Page
  parent?: Layer
}

export function walkLayers(layers: Layer[], fn: (l: Layer, container: Layer[], index: number, parent?: Layer) => void, parent?: Layer) {
  layers.forEach((l, i) => {
    fn(l, layers, i, parent)
    if (l.type === 'group') walkLayers(l.children, fn, l)
  })
}

export function findLayer(project: Project, id: string): LayerLocation | undefined {
  for (const spread of project.spreads) {
    let hit: LayerLocation | undefined
    walkLayers(spread.sharedLayers, (layer, container, index, parent) => {
      if (!hit && layer.id === id) hit = { layer, container, index, spread, parent }
    })
    if (hit) return hit
    for (const page of spread.pages) {
      walkLayers(page.layers, (layer, container, index, parent) => {
        if (!hit && layer.id === id) hit = { layer, container, index, spread, page, parent }
      })
      if (hit) return hit
    }
  }
  return undefined
}

export function allLayers(project: Project): Layer[] {
  const out: Layer[] = []
  for (const s of project.spreads) {
    walkLayers(s.sharedLayers, (l) => out.push(l))
    s.pages.forEach((p) => walkLayers(p.layers, (l) => out.push(l)))
  }
  return out
}

export function collectAssetIds(project: Project): string[] {
  const ids = new Set<string>()
  const add = (id?: string) => id && ids.add(id)
  for (const s of project.spreads) {
    add(s.background.image?.assetId)
    s.pages.forEach((p) => add(p.background?.image?.assetId))
  }
  allLayers(project).forEach((l) => {
    if (l.type === 'image') add(l.assetId)
    if (l.type === 'device') add(l.screenAssetId)
  })
  return [...ids]
}

export function cloneLayer(l: Layer, idMap?: Map<string, string>): Layer {
  const copy = deepClone(l)
  const reid = (x: Layer) => {
    const nid = uid()
    idMap?.set(x.id, nid)
    x.id = nid
    if (x.type === 'group') x.children.forEach(reid)
  }
  reid(copy)
  return copy
}

export function remapZoomSources(layers: Layer[], idMap: Map<string, string>) {
  walkLayers(layers, (l) => {
    if (l.type === 'zoom' && l.sourceId && idMap.has(l.sourceId)) l.sourceId = idMap.get(l.sourceId)
  })
}

export function clonePage(p: Page, strings?: Project['strings']): Page {
  const idMap = new Map<string, string>()
  const layers = p.layers.map((l) => cloneLayer(l, idMap))
  remapZoomSources(layers, idMap)
  if (strings) copyStrings(strings, idMap)
  return { ...deepClone(p), id: uid(), name: `${p.name} copy`, layers }
}

export function copyStrings(strings: Project['strings'], idMap: Map<string, string>) {
  for (const table of Object.values(strings)) {
    for (const [from, to] of idMap) if (table[from] !== undefined) table[to] = table[from]
  }
}

export function cloneProject(p: Project, name: string): Project {
  const copy = deepClone(p)
  const idMap = new Map<string, string>()
  copy.spreads.forEach((s) => {
    s.id = uid()
    s.sharedLayers = s.sharedLayers.map((l) => cloneLayer(l, idMap))
    remapZoomSources(s.sharedLayers, idMap)
    s.pages.forEach((pg) => {
      pg.id = uid()
      pg.layers = pg.layers.map((l) => cloneLayer(l, idMap))
      remapZoomSources(pg.layers, idMap)
    })
  })
  const strings: Project['strings'] = {}
  for (const [loc, table] of Object.entries(copy.strings)) {
    strings[loc] = {}
    for (const [k, v] of Object.entries(table)) strings[loc][idMap.get(k) ?? k] = v
  }
  const now = Date.now()
  return { ...copy, id: uid(), name, strings, createdAt: now, updatedAt: now }
}

export function scaleLayer(l: Layer, sx: number, sy: number) {
  const s = Math.min(sx, sy)
  l.x *= sx
  l.y *= sy
  if (l.type === 'text') {
    l.width *= sx
    l.fontSize *= s
    if (l.stroke) l.stroke.width *= s
  } else if (l.type === 'group') {
    l.width *= sx
    l.height *= sy
    l.children.forEach((c) => scaleLayer(c, sx, sy))
  } else if (l.type === 'device' || l.type === 'zoom') {
    const cx = l.x + (l.width * sx) / 2
    const cy = l.y + (l.height * sy) / 2
    l.width *= s
    l.height *= s
    l.x = cx - l.width / 2
    l.y = cy - l.height / 2
  } else {
    l.width *= sx
    l.height *= sy
    if (l.type === 'image') l.cornerRadius *= s
    if (l.type === 'shape') l.cornerRadius *= s
  }
  if (l.shadow) {
    l.shadow.blur *= s
    l.shadow.offsetX *= s
    l.shadow.offsetY *= s
  }
}

export function retargetSpread(spread: Spread, width: number, height: number) {
  const sx = width / spread.width
  const sy = height / spread.height
  spread.sharedLayers.forEach((l) => scaleLayer(l, sx, sy))
  spread.pages.forEach((p) => p.layers.forEach((l) => scaleLayer(l, sx, sy)))
  spread.width = width
  spread.height = height
}

export function pageIndex(spread: Spread, pageId: string) {
  return spread.pages.findIndex((p) => p.id === pageId)
}

export function locatePage(project: Project, pageId: string): { spread: Spread; page: Page; index: number } | undefined {
  for (const spread of project.spreads) {
    const index = pageIndex(spread, pageId)
    if (index >= 0) return { spread, page: spread.pages[index], index }
  }
  return undefined
}

export function totalPages(project: Project) {
  return project.spreads.reduce((n, s) => n + s.pages.length, 0)
}
