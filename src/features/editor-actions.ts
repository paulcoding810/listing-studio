import { toast } from '@/components/ui/toast'
import { frameForPlatform, getFrame } from '@/frames'
import { deviceAspect } from '@/features/device-paint'
import { importImageFile, AssetError } from '@/lib/assets'
import { findLayer } from '@/lib/doc'
import { createDevice, createImage, createShape, createText, createZoom, type TextPreset } from '@/lib/factory'
import { getTarget } from '@/targets'
import { selectActive, useEditor } from '@/store/editor-store'
import type { Layer, ShapeKind } from '@/types/project'
import { nodeRectInParent } from './canvas/stage-registry'

let clipboard: Layer[] = []

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

export function setDeviceScreen(deviceId: string, assetId: string) {
  useEditor.getState().updateLayer(deviceId, { screenAssetId: assetId })
}

export async function uploadImages(files: File[], opts: { at?: { x: number; y: number }; deviceId?: string; add?: boolean } = {}) {
  const added: string[] = []
  for (const f of files) {
    try {
      const rec = await importImageFile(f)
      added.push(rec.id)
      if (opts.deviceId && added.length === 1) setDeviceScreen(opts.deviceId, rec.id)
      else if (opts.add !== false) addImage(rec.id, rec.width, rec.height, opts.at)
    } catch (e) {
      toast.error(e instanceof AssetError ? e.message : `${f.name}: upload failed`)
    }
  }
  if (added.length) toast.success(`${added.length} image${added.length > 1 ? 's' : ''} added`)
  return added
}

export function copySelection() {
  const s = useEditor.getState()
  if (!s.project) return
  clipboard = s.selectedIds.map((id) => findLayer(s.project!, id)?.layer).filter((l): l is Layer => !!l).map((l) => structuredClone(l))
  if (clipboard.length) toast.info(`Copied ${clipboard.length} layer${clipboard.length > 1 ? 's' : ''}`)
}

export function pasteClipboard() {
  if (clipboard.length) useEditor.getState().pasteLayers(clipboard)
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
