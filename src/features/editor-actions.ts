import { toast } from '@/components/ui/toast'
import { frameForPlatform, getFrame } from '@/frames'
import { deviceAspect } from '@/features/device-paint'
import { importImageFile, AssetError } from '@/lib/assets'
import { findLayer, walkLayers } from '@/lib/doc'
import { createDevice, createImage, createShape, createText, createZoom, type TextPreset } from '@/lib/factory'
import { getTarget } from '@/targets'
import { selectActive, useEditor } from '@/store/editor-store'
import type { Layer, Project, ShapeKind } from '@/types/project'
import { linkedIconId } from './canvas/linked-icon'
import { APPLE_RADIUS } from './icons'
import { nodeRectInParent } from './canvas/stage-registry'

let clipboard: Layer[] = []
let clipboardStrings: Record<string, Record<string, string>> = {}
let clipboardOverrides: Project['overrides'] = {}

const active = () => {
  const s = useEditor.getState()
  const loc = selectActive(s)
  return loc ? { s, ...loc } : undefined
}

export function addText(preset: TextPreset) {
  const a = active()
  if (!a) return
  const { spread } = a
  const l = createText(a.s.project!.theme, { preset, canvasWidth: spread.width })
  l.y = Math.round(spread.height * 0.4)
  a.s.addLayer(l)
}

export function addShape(kind: ShapeKind) {
  const a = active()
  if (!a) return
  const { spread } = a
  const size = Math.round(Math.min(spread.width, spread.height) * 0.3)
  const l = createShape(kind, a.s.project!.theme, {
    width: size,
    height: kind === 'line' ? Math.max(4, Math.round(size / 40)) : size,
    x: Math.round((spread.width - size) / 2),
    y: Math.round((spread.height - size) / 2),
  })
  a.s.addLayer(l)
}

export function addDevice(frameId?: string) {
  const a = active()
  if (!a) return
  const { spread } = a
  const f = frameId ? getFrame(frameId) : frameForPlatform(getTarget(spread.targetId).frame)
  a.s.addLayer(createDevice(f.id, spread.width, spread.height, { screenAssetId: undefined }))
}

export function addImage(assetId: string, w: number, h: number, at?: { x: number; y: number }) {
  const a = active()
  if (!a) return
  const { spread } = a
  const scale = Math.min(1, (spread.width * 0.7) / w, (spread.height * 0.7) / h)
  const width = Math.round(w * scale)
  const height = Math.round(h * scale)
  const l = createImage(assetId, width, height, {
    x: Math.round(at ? at.x - width / 2 : (spread.width - width) / 2),
    y: Math.round(at ? at.y - height / 2 : (spread.height - height) / 2),
  })
  a.s.addLayer(l)
}

export function addZoom() {
  const a = active()
  if (!a) return
  const { spread, page } = a
  const sel = a.s.selectedIds.map((id) => page.layers.find((l) => l.id === id)).find((l) => l?.type === 'image' || l?.type === 'device')
  const source = sel ?? [...page.layers].reverse().find((l) => l.type === 'device' || l.type === 'image')
  const size = Math.round(Math.min(spread.width, spread.height) * 0.36)
  const x = source ? Math.min(spread.width - size - 20, source.x + source.width * 0.55) : (spread.width - size) / 2
  const y = source ? source.y + source.height * 0.12 : spread.height * 0.3
  a.s.addLayer(createZoom(source?.id, Math.round(x), Math.round(y), size))
  if (!source) toast.info('Add a device or image, then pick it as the zoom source.')
}

export function selectedDeviceId(): string | undefined {
  const s = useEditor.getState()
  if (!s.project || s.selectedIds.length !== 1) return undefined
  const l = findLayer(s.project, s.selectedIds[0])?.layer
  return l?.type === 'device' ? l.id : undefined
}

export function setDeviceScreen(deviceId: string, assetId: string) {
  useEditor.getState().setLayerAsset(deviceId, 'screenAssetId', assetId)
}

const naturalOrder = (a: File, b: File) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })

async function importAll(files: File[]) {
  const recs = []
  for (const f of [...files].sort(naturalOrder)) {
    try {
      recs.push(await importImageFile(f))
    } catch (e) {
      toast.error(e instanceof AssetError ? e.message : `${f.name}: upload failed`)
    }
  }
  return recs
}

function fillToast(filled: number, before: number, after: number) {
  const extra = after - before
  toast.success(`Filled ${filled} frame${filled > 1 ? 's' : ''} in file-name order${extra > 0 ? `, added ${extra} image${extra > 1 ? 's' : ''} to the set` : ''}`)
}

function spreadPageCount(spreadId: string) {
  return useEditor.getState().project?.spreads.find((s) => s.id === spreadId)?.pages.length ?? 0
}

/** Uploads files; with a device target, fills that frame and the frames on the following images in order. */
export async function uploadImages(files: File[], opts: { at?: { x: number; y: number }; deviceId?: string; add?: boolean } = {}) {
  const recs = await importAll(files)
  const ids = recs.map((r) => r.id)
  if (!recs.length) return ids
  const st = useEditor.getState()
  const loc = opts.deviceId && st.project ? findLayer(st.project, opts.deviceId) : undefined
  if (loc && opts.deviceId) {
    const before = loc.spread.pages.length
    const filled = st.fillScreens({ deviceId: opts.deviceId }, ids)
    if (recs.length > 1) fillToast(filled, before, spreadPageCount(loc.spread.id))
    else toast.success('Screen updated')
    return ids
  }
  if (opts.add !== false) recs.forEach((r) => addImage(r.id, r.width, r.height, opts.at))
  toast.success(`${recs.length} image${recs.length > 1 ? 's' : ''} added`)
  return ids
}

export async function fillSetFromFiles(spreadId: string, files: File[]) {
  const recs = await importAll(files)
  if (!recs.length) return
  const before = spreadPageCount(spreadId)
  const filled = useEditor.getState().fillScreens({ spreadId }, recs.map((r) => r.id))
  fillToast(filled, before, spreadPageCount(spreadId))
}

export function iconSpreadOf(project: Project | null) {
  return project?.spreads.find((s) => getTarget(s.targetId).kind === 'icon')
}

function linkedIconLayer(iconSpreadId: string, w: number, h: number, opts: { x?: number; y?: number; size?: number } = {}) {
  const size = Math.round(opts.size ?? Math.min(w, h) * 0.36)
  return createImage(linkedIconId(iconSpreadId), size, size, {
    name: 'App icon (linked)',
    fit: 'cover',
    cornerRadius: Math.round(size * APPLE_RADIUS),
    x: Math.round(opts.x ?? (w - size) / 2),
    y: Math.round(opts.y ?? (h - size) / 2),
  })
}

export function addLinkedIcon() {
  const a = active()
  const icon = iconSpreadOf(a?.s.project ?? null)
  if (!a || !icon) return
  if (icon.id === a.spread.id) return toast.info('Open a screenshot, tile or graphic to place the icon on it.')
  a.s.addLayer(linkedIconLayer(icon.id, a.spread.width, a.spread.height))
}

const ICON_SURFACES = new Set(['promo-tile', 'marquee', 'feature-graphic', 'banner'])

/** Places the linked app icon on every promo tile and feature graphic that doesn't have it yet. */
export function placeIconOnGraphics() {
  const st = useEditor.getState()
  const icon = iconSpreadOf(st.project)
  if (!st.project || !icon) return 0
  const link = linkedIconId(icon.id)
  let placed = 0
  st.mutate((p) => {
    for (const sp of p.spreads) {
      if (!ICON_SURFACES.has(getTarget(sp.targetId).kind)) continue
      for (const page of sp.pages) {
        let has = false
        walkLayers(page.layers, (l) => (has ||= l.type === 'image' && l.assetId === link))
        if (has) continue
        const size = Math.round(sp.height * 0.36)
        page.layers.push(linkedIconLayer(icon.id, sp.width, sp.height, { size, x: sp.width * 0.06, y: (sp.height - size) / 2 }))
        placed++
      }
    }
  })
  return placed
}

export function copySelection() {
  const s = useEditor.getState()
  if (!s.project) return
  clipboard = s.selectedIds.map((id) => findLayer(s.project!, id)?.layer).filter((l): l is Layer => !!l).map((l) => structuredClone(l))
  const ids = new Set<string>()
  walkLayers(clipboard, (l) => ids.add(l.id))
  clipboardStrings = Object.fromEntries(
    Object.entries(s.project.strings).map(([loc, table]) => [loc, Object.fromEntries(Object.entries(table).filter(([id]) => ids.has(id)))]),
  )
  clipboardOverrides = Object.fromEntries(
    Object.entries(s.project.overrides ?? {}).map(([loc, table]) => [loc, structuredClone(Object.fromEntries(Object.entries(table).filter(([id]) => ids.has(id))))]),
  )
  if (clipboard.length) toast.info(`Copied ${clipboard.length} layer${clipboard.length > 1 ? 's' : ''}`)
}

export function pasteClipboard() {
  if (clipboard.length) useEditor.getState().pasteLayers(clipboard, clipboardStrings, clipboardOverrides)
  return clipboard.length > 0
}

export function groupSelection() {
  const s = useEditor.getState()
  const ids = s.selectedIds
  if (ids.length < 2) return
  const rects = ids.map(nodeRectInParent).filter((r) => !!r)
  if (rects.length !== ids.length) return
  const x = Math.min(...rects.map((r) => r.x))
  const y = Math.min(...rects.map((r) => r.y))
  const r = Math.max(...rects.map((r) => r.x + r.width))
  const b = Math.max(...rects.map((r) => r.y + r.height))
  s.groupLayers(ids, { x, y, width: r - x, height: b - y })
}

export function ungroupSelection() {
  const s = useEditor.getState()
  s.selectedIds.forEach((id) => s.ungroup(id))
}

export type AlignKind = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom' | 'hdistribute' | 'vdistribute'

export function alignSelection(kind: AlignKind) {
  const s = useEditor.getState()
  const a = active()
  if (!a || !s.project) return
  const ids = s.selectedIds
  const items = ids.map((id) => ({ id, r: nodeRectInParent(id), l: findLayer(s.project!, id)?.layer })).filter((i) => i.r && i.l) as Array<{
    id: string
    r: { x: number; y: number; width: number; height: number }
    l: Layer
  }>
  if (!items.length) return
  const single = items.length === 1
  const bounds = single
    ? { x: 0, y: 0, width: a.spread.width, height: a.spread.height }
    : (() => {
        const x = Math.min(...items.map((i) => i.r.x))
        const y = Math.min(...items.map((i) => i.r.y))
        return { x, y, width: Math.max(...items.map((i) => i.r.x + i.r.width)) - x, height: Math.max(...items.map((i) => i.r.y + i.r.height)) - y }
      })()
  const patches: Record<string, { x?: number; y?: number }> = {}
  const move = (i: (typeof items)[number], dx: number, dy: number) => (patches[i.id] = { x: Math.round(i.l.x + dx), y: Math.round(i.l.y + dy) })
  if (kind === 'hdistribute' || kind === 'vdistribute') {
    if (items.length < 3) return
    const horiz = kind === 'hdistribute'
    const sorted = [...items].sort((p, q) => (horiz ? p.r.x - q.r.x : p.r.y - q.r.y))
    const total = sorted.reduce((n, i) => n + (horiz ? i.r.width : i.r.height), 0)
    const gap = ((horiz ? bounds.width : bounds.height) - total) / (sorted.length - 1)
    let cur = horiz ? bounds.x : bounds.y
    sorted.forEach((i) => {
      move(i, horiz ? cur - i.r.x : 0, horiz ? 0 : cur - i.r.y)
      cur += (horiz ? i.r.width : i.r.height) + gap
    })
  } else {
    items.forEach((i) => {
      const dx =
        kind === 'left' ? bounds.x - i.r.x : kind === 'right' ? bounds.x + bounds.width - (i.r.x + i.r.width) : kind === 'hcenter' ? bounds.x + bounds.width / 2 - (i.r.x + i.r.width / 2) : 0
      const dy =
        kind === 'top' ? bounds.y - i.r.y : kind === 'bottom' ? bounds.y + bounds.height - (i.r.y + i.r.height) : kind === 'vcenter' ? bounds.y + bounds.height / 2 - (i.r.y + i.r.height / 2) : 0
      move(i, dx, dy)
    })
  }
  s.updateLayers(patches)
}

export function fitDeviceRatio(id: string) {
  const s = useEditor.getState()
  const l = s.project ? findLayer(s.project, id)?.layer : undefined
  if (l?.type !== 'device') return
  const aspect = deviceAspect(getFrame(l.frameId))
  s.updateLayer(id, { height: Math.round(l.width / aspect) })
}
