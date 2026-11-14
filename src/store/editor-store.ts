import { create, useStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import { cloneLayer, clonePage, copyStrings, deepClone, findLayer, locatePage, remapZoomSources, retargetSpread, walkLayers } from '@/lib/doc'
import { createPage, createSpread, seedSpread } from '@/lib/factory'
import { getTarget } from '@/targets'
import { uid } from '@/lib/utils'
import type { Background, GroupLayer, Layer, Page, Project, Spread, Theme } from '@/types/project'

export type ViewMode = 'page' | 'spread'
export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

type Rect = { x: number; y: number; width: number; height: number }
type LayerPatch = Partial<Omit<Layer, 'type' | 'id'>> & Record<string, unknown>

export interface EditorState {
  project: Project | null
  activePageId: string | null
  selectedIds: string[]
  viewMode: ViewMode
  zoom: number
  pan: { x: number; y: number }
  showGrid: boolean
  activeLocale: string
  saveStatus: SaveStatus
  lastSavedAt?: number
  editingTextId: string | null

  load: (p: Project) => void
  close: () => void
  mutate: (fn: (p: Project) => void) => void
  rename: (name: string) => void

  setActivePage: (id: string) => void
  setViewMode: (m: ViewMode) => void
  setZoom: (z: number, pan?: { x: number; y: number }) => void
  setPan: (pan: { x: number; y: number }) => void
  toggleGrid: () => void
  setLocale: (l: string) => void
  setSaveStatus: (s: SaveStatus, at?: number) => void
  setEditingText: (id: string | null) => void

  select: (ids: string[]) => void
  toggleSelect: (id: string) => void
  clearSelection: () => void

  updateLayer: (id: string, patch: LayerPatch) => void
  updateLayers: (patches: Record<string, LayerPatch>) => void
  setLayerText: (id: string, text: string) => void
  addLayer: (layer: Layer, where?: 'page' | 'shared') => void
  deleteLayers: (ids: string[]) => void
  duplicateLayers: (ids: string[], offset?: number) => void
  pasteLayers: (layers: Layer[]) => void
  groupLayers: (ids: string[], bbox: Rect) => void
  ungroup: (id: string) => void
  arrange: (id: string, dir: 'forward' | 'backward' | 'front' | 'back') => void
  moveLayerTo: (id: string, targetId: string, position: 'before' | 'after') => void
  moveToContainer: (id: string, where: 'shared' | 'page') => void
  renameLayer: (id: string, name: string) => void

  addPage: (spreadId: string) => void
  duplicatePage: (pageId: string) => void
  deletePage: (pageId: string) => void
  movePage: (pageId: string, toIndex: number) => void
  renamePage: (pageId: string, name: string) => void
  addSpread: (targetId: string, pages: number) => void
  deleteSpread: (spreadId: string) => void
  updateSpread: (spreadId: string, patch: Partial<Spread>) => void
  retarget: (spreadId: string, targetId: string, width: number, height: number) => void
  setBackground: (spreadId: string, pageId: string | null, bg: Background | undefined) => void
  applyBackgroundToAll: (spreadId: string, pageId: string) => void
  setTheme: (theme: Theme) => void
}

function leadingThrottle<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let last = 0
  return (...a: A) => {
    const now = performance.now()
    if (now - last > ms) fn(...a)
    last = now
  }
}

const activeContainer = (s: EditorState, p: Project, where: 'page' | 'shared'): { spread: Spread; layers: Layer[] } | undefined => {
  const loc = s.activePageId ? locatePage(p, s.activePageId) : undefined
  if (!loc) return undefined
  return { spread: loc.spread, layers: where === 'shared' ? loc.spread.sharedLayers : loc.page.layers }
}

export const useEditor = create<EditorState>()(
  temporal(
    immer((set, get) => ({
      project: null,
      activePageId: null,
      selectedIds: [],
      viewMode: 'page',
      zoom: 0.4,
      pan: { x: 0, y: 0 },
      showGrid: false,
      activeLocale: 'en-US',
      saveStatus: 'idle',
      editingTextId: null,

      load: (p) =>
        set((s) => {
          s.project = p
          s.activePageId = p.spreads[0]?.pages[0]?.id ?? null
          s.selectedIds = []
          s.activeLocale = p.locales[0] ?? 'en-US'
          s.saveStatus = 'saved'
          s.lastSavedAt = p.updatedAt
          s.viewMode = 'page'
        }),
      close: () =>
        set((s) => {
          s.project = null
          s.activePageId = null
          s.selectedIds = []
        }),
      mutate: (fn) =>
        set((s) => {
          if (s.project) fn(s.project as Project)
        }),
      rename: (name) =>
        set((s) => {
          if (s.project) s.project.name = name.trim() || 'Untitled project'
        }),

      setActivePage: (id) =>
        set((s) => {
          if (s.activePageId !== id) {
            s.activePageId = id
            s.selectedIds = []
          }
        }),
      setViewMode: (m) =>
        set((s) => {
          s.viewMode = m
        }),
      setZoom: (z, pan) =>
        set((s) => {
          s.zoom = Math.min(8, Math.max(0.05, z))
          if (pan) s.pan = pan
        }),
      setPan: (pan) =>
        set((s) => {
          s.pan = pan
        }),
      toggleGrid: () =>
        set((s) => {
          s.showGrid = !s.showGrid
        }),
      setLocale: (l) =>
        set((s) => {
          s.activeLocale = l
        }),
      setSaveStatus: (st, at) =>
        set((s) => {
          s.saveStatus = st
          if (at) s.lastSavedAt = at
        }),
      setEditingText: (id) =>
        set((s) => {
          s.editingTextId = id
        }),

      select: (ids) =>
        set((s) => {
          s.selectedIds = ids
        }),
      toggleSelect: (id) =>
        set((s) => {
          s.selectedIds = s.selectedIds.includes(id) ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id]
        }),
      clearSelection: () =>
        set((s) => {
          if (s.selectedIds.length) s.selectedIds = []
        }),

      updateLayer: (id, patch) => get().updateLayers({ [id]: patch }),
      updateLayers: (patches) =>
        set((s) => {
          if (!s.project) return
          for (const [id, patch] of Object.entries(patches)) {
            const loc = findLayer(s.project as Project, id)
            if (loc) Object.assign(loc.layer, patch)
          }
        }),
      setLayerText: (id, text) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const loc = findLayer(p, id)
          if (!loc || loc.layer.type !== 'text') return
          const def = p.locales[0]
          if (s.activeLocale === def || !loc.layer.localizable) loc.layer.text = text
          else (p.strings[s.activeLocale] ??= {})[id] = text
        }),
      addLayer: (layer, where = 'page') =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const c = activeContainer(s as EditorState, p, where)
          if (!c) return
          c.layers.push(layer)
          s.selectedIds = [layer.id]
        }),
      deleteLayers: (ids) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          for (const id of ids) {
            const loc = findLayer(p, id)
            if (loc && !loc.layer.locked) loc.container.splice(loc.container.indexOf(loc.layer), 1)
          }
          for (const t of Object.values(p.strings)) ids.forEach((id) => delete t[id])
          s.selectedIds = s.selectedIds.filter((id) => !ids.includes(id))
        }),
      duplicateLayers: (ids, offset = 32) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const next: string[] = []
          const idMap = new Map<string, string>()
          for (const id of ids) {
            const loc = findLayer(p, id)
            if (!loc) continue
            const copy = cloneLayer(loc.layer as Layer, idMap)
            copy.x += offset
            copy.y += offset
            copy.name = `${loc.layer.name} copy`
            copy.locked = false
            loc.container.splice(loc.container.indexOf(loc.layer) + 1, 0, copy)
            next.push(copy.id)
          }
          copyStrings(p.strings, idMap)
          s.selectedIds = next
        }),
      pasteLayers: (layers) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const c = activeContainer(s as EditorState, p, 'page')
          if (!c) return
          const idMap = new Map<string, string>()
          const copies = layers.map((l) => {
            const copy = cloneLayer(l, idMap)
            copy.x += 32
            copy.y += 32
            return copy
          })
          remapZoomSources(copies, idMap)
          c.layers.push(...copies)
          s.selectedIds = copies.map((l) => l.id)
        }),
      groupLayers: (ids, bbox) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p || ids.length < 2) return
          const locs = ids.map((id) => findLayer(p, id)).filter((l) => !!l)
          const container = locs[0]?.container
          if (!container || locs.some((l) => l.container !== container)) return
          const ordered = locs.sort((a, b) => container.indexOf(a.layer) - container.indexOf(b.layer))
          const insertAt = container.indexOf(ordered[ordered.length - 1].layer)
          const children = ordered.map((l) => {
            const c = deepClone(l.layer) as Layer
            c.x -= bbox.x
            c.y -= bbox.y
            return c
          })
          const group: GroupLayer = {
            id: uid(),
            type: 'group',
            name: 'Group',
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            children,
          }
          container.splice(insertAt + 1, 0, group)
          for (const l of ordered) container.splice(container.indexOf(l.layer), 1)
          s.selectedIds = [group.id]
        }),
      ungroup: (id) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const loc = findLayer(p, id)
          if (!loc || loc.layer.type !== 'group') return
          const g = loc.layer
          const r = (g.rotation * Math.PI) / 180
          const kids = g.children.map((c) => {
            const k = deepClone(c) as Layer
            k.x = g.x + c.x * Math.cos(r) - c.y * Math.sin(r)
            k.y = g.y + c.x * Math.sin(r) + c.y * Math.cos(r)
            k.rotation = c.rotation + g.rotation
            k.opacity = c.opacity * g.opacity
            return k
          })
          const idx = loc.container.indexOf(g)
          loc.container.splice(idx, 1, ...kids)
          s.selectedIds = kids.map((k) => k.id)
        }),
      arrange: (id, dir) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const loc = findLayer(p, id)
          if (!loc) return
          const c = loc.container
          const i = c.indexOf(loc.layer)
          const [item] = c.splice(i, 1)
          const to = dir === 'front' ? c.length : dir === 'back' ? 0 : dir === 'forward' ? Math.min(c.length, i + 1) : Math.max(0, i - 1)
          c.splice(to, 0, item)
        }),
      moveLayerTo: (id, targetId, position) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p || id === targetId) return
          const from = findLayer(p, id)
          const to = findLayer(p, targetId)
          if (!from || !to) return
          let isAncestor = false
          if (from.layer.type === 'group') walkLayers(from.layer.children, (l) => (isAncestor ||= l.id === targetId))
          if (isAncestor) return
          const [item] = from.container.splice(from.container.indexOf(from.layer), 1)
          if (to.parent?.id !== from.parent?.id && to.parent?.type === 'group') {
            item.x -= to.parent.x
            item.y -= to.parent.y
          }
          if (from.parent?.type === 'group' && to.parent?.id !== from.parent.id) {
            item.x += from.parent.x
            item.y += from.parent.y
          }
          const ti = to.container.indexOf(to.layer)
          to.container.splice(position === 'after' ? ti + 1 : ti, 0, item)
        }),

      moveToContainer: (id, where) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p || !s.activePageId) return
          const from = findLayer(p, id)
          const active = locatePage(p, s.activePageId)
          if (!from || !active || from.parent) return
          const toShared = where === 'shared'
          if (toShared === !from.page) return
          const sp = from.spread
          const pageLoc = toShared ? locatePage(p, from.page!.id)! : active
          if (pageLoc.spread.id !== sp.id) return
          const [item] = from.container.splice(from.index, 1)
          const off = pageLoc.index * sp.width
          item.x += toShared ? off : -off
          ;(toShared ? sp.sharedLayers : pageLoc.page.layers).push(item)
        }),
      renameLayer: (id, name) =>
        set((s) => {
          const loc = s.project ? findLayer(s.project as Project, id) : undefined
          if (loc && name.trim()) loc.layer.name = name.trim()
        }),

      addPage: (spreadId) =>
        set((s) => {
          const sp = s.project?.spreads.find((x) => x.id === spreadId)
          if (!sp) return
          const page = createPage(`Screen ${sp.pages.length + 1}`)
          sp.pages.push(page)
          s.activePageId = page.id
          s.selectedIds = []
        }),
      duplicatePage: (pageId) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const loc = locatePage(p, pageId)
          if (!loc) return
          const copy = clonePage(loc.page, p.strings)
          loc.spread.pages.splice(loc.index + 1, 0, copy)
          s.activePageId = copy.id
          s.selectedIds = []
        }),
      deletePage: (pageId) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const loc = locatePage(p, pageId)
          if (!loc) return
          const total = p.spreads.reduce((n, x) => n + x.pages.length, 0)
          if (total <= 1) return
          loc.spread.pages.splice(loc.index, 1)
          if (!loc.spread.pages.length) p.spreads.splice(p.spreads.indexOf(loc.spread), 1)
          if (s.activePageId === pageId) {
            const sp = p.spreads.find((x) => x.id === loc.spread.id) ?? p.spreads[0]
            s.activePageId = sp.pages[Math.min(loc.index, sp.pages.length - 1)]?.id ?? p.spreads[0].pages[0].id
          }
          s.selectedIds = []
        }),
      movePage: (pageId, toIndex) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const loc = locatePage(p, pageId)
          if (!loc) return
          const [pg] = loc.spread.pages.splice(loc.index, 1)
          loc.spread.pages.splice(Math.max(0, Math.min(toIndex, loc.spread.pages.length)), 0, pg)
        }),
      renamePage: (pageId, name) =>
        set((s) => {
          const loc = s.project ? locatePage(s.project as Project, pageId) : undefined
          if (loc) loc.page.name = name.trim() || loc.page.name
        }),
      addSpread: (targetId, pages) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p) return
          const sp = seedSpread(createSpread(targetId, p.theme, pages), p.theme)
          sp.background = deepClone(p.spreads[0]?.background ?? sp.background)
          p.spreads.push(sp)
          s.activePageId = sp.pages[0].id
          s.selectedIds = []
        }),
      deleteSpread: (spreadId) =>
        set((s) => {
          const p = s.project as Project | null
          if (!p || p.spreads.length <= 1) return
          const i = p.spreads.findIndex((x) => x.id === spreadId)
          if (i < 0) return
          p.spreads.splice(i, 1)
          s.activePageId = p.spreads[Math.max(0, i - 1)].pages[0].id
          s.selectedIds = []
        }),
      updateSpread: (spreadId, patch) =>
        set((s) => {
          const sp = s.project?.spreads.find((x) => x.id === spreadId)
          if (sp) Object.assign(sp, patch)
        }),
      retarget: (spreadId, targetId, width, height) =>
        set((s) => {
          const sp = s.project?.spreads.find((x) => x.id === spreadId) as Spread | undefined
          if (!sp) return
          retargetSpread(sp, width, height)
          sp.targetId = targetId
          sp.name = getTarget(targetId).label
        }),
      setBackground: (spreadId, pageId, bg) =>
        set((s) => {
          const sp = s.project?.spreads.find((x) => x.id === spreadId)
          if (!sp) return
          if (!pageId) {
            if (bg) sp.background = bg
            return
          }
          const pg = sp.pages.find((x) => x.id === pageId) as Page | undefined
          if (pg) pg.background = bg
        }),
      applyBackgroundToAll: (spreadId, pageId) =>
        set((s) => {
          const sp = s.project?.spreads.find((x) => x.id === spreadId)
          const pg = sp?.pages.find((x) => x.id === pageId)
          if (!sp || !pg) return
          const bg = deepClone(pg.background ?? sp.background)
          sp.background = bg
          sp.pages.forEach((x) => delete x.background)
        }),
      setTheme: (theme) =>
        set((s) => {
          if (s.project) s.project.theme = theme
        }),
    })),
    {
      partialize: (s) => ({ project: s.project }),
      equality: (a, b) => a.project === b.project,
      limit: 100,
      handleSet: (handleSet) => leadingThrottle(handleSet, 450),
    },
  ),
)

export function useHistory<T>(selector: (s: { pastStates: unknown[]; futureStates: unknown[] }) => T) {
  return useStore(useEditor.temporal, selector)
}

export const undo = () => {
  useEditor.temporal.getState().undo()
  sanitizeSelection()
}
export const redo = () => {
  useEditor.temporal.getState().redo()
  sanitizeSelection()
}

function sanitizeSelection() {
  const s = useEditor.getState()
  const p = s.project
  if (!p) return
  const valid = s.selectedIds.filter((id) => findLayer(p, id))
  const pageOk = s.activePageId && locatePage(p, s.activePageId)
  useEditor.setState({
    selectedIds: valid,
    activePageId: pageOk ? s.activePageId : (p.spreads[0]?.pages[0]?.id ?? null),
  })
}

export function resetHistory() {
  useEditor.temporal.getState().clear()
}

export function selectActive(s: EditorState) {
  if (!s.project || !s.activePageId) return undefined
  return locatePage(s.project, s.activePageId)
}
