import { assetsDb } from '@/lib/db'
import { uid } from '@/lib/utils'
import { isDemoAsset, renderDemoAsset } from '@/demo/screens'
import type { AssetRecord } from '@/types/project'

export type ImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif']
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024
const MAX_SIDE = 4096

export class AssetError extends Error {}

const cache = new Map<string, ImageSource>()
const pending = new Map<string, Promise<ImageSource | undefined>>()
const listeners = new Set<() => void>()

export function subscribeAssets(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function getCachedAsset(id: string | undefined): ImageSource | undefined {
  return id ? cache.get(id) : undefined
}

export function loadAsset(id: string): Promise<ImageSource | undefined> {
  const hit = cache.get(id)
  if (hit) return Promise.resolve(hit)
  let p = pending.get(id)
  if (!p) {
    p = (async () => {
      try {
        let img: ImageSource | undefined
        if (isDemoAsset(id)) img = await renderDemoAsset(id)
        else {
          const rec = await assetsDb.get(id)
          if (rec) img = await blobToImage(rec.blob)
        }
        if (img) {
          cache.set(id, img)
          listeners.forEach((l) => l())
        }
        return img
      } catch (e) {
        console.warn('[assets] failed to load', id, e)
        return undefined
      } finally {
        pending.delete(id)
      }
    })()
    pending.set(id, p)
  }
  return p
}

export async function preloadAssets(ids: Iterable<string>) {
  await Promise.all([...new Set(ids)].map((id) => loadAsset(id)))
}

export function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      resolve(img)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new AssetError('This image could not be decoded.'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new AssetError('Could not encode image.'))), type, quality),
  )
}

export async function importImageFile(file: File): Promise<AssetRecord> {
  const type = file.type || guessMime(file.name)
  if (!ACCEPTED.includes(type)) throw new AssetError(`${file.name}: unsupported format. Use PNG, JPG, WebP, SVG or GIF.`)
  if (file.size > MAX_UPLOAD_BYTES) throw new AssetError(`${file.name} is larger than 40 MB.`)

  let blob: Blob = file
  const img = await blobToImage(file)
  let width = img.naturalWidth || 1024
  let height = img.naturalHeight || 1024
  const isSvg = type === 'image/svg+xml'
  const long = Math.max(width, height)

  if (isSvg || long > MAX_SIDE) {
    const scale = isSvg ? Math.max(1, 1024 / long) : MAX_SIDE / long
    width = Math.round(width * scale)
    height = Math.round(height * scale)
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    c.getContext('2d')!.drawImage(img, 0, 0, width, height)
    const outType = type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
    blob = await canvasToBlob(c, outType, 0.92)
  }

  const rec: AssetRecord = {
    id: `img_${uid()}`,
    name: file.name.replace(/\.[^.]+$/, ''),
    kind: 'image',
    mime: blob.type || type,
    width,
    height,
    size: blob.size,
    createdAt: Date.now(),
    blob,
  }
  await assetsDb.put(rec)
  window.dispatchEvent(new Event('assets-changed'))
  cache.set(rec.id, blob === file ? img : await blobToImage(blob))
  listeners.forEach((l) => l())
  return rec
}

function guessMime(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  return (
    { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif', avif: 'image/avif' }[
      ext ?? ''
    ] ?? ''
  )
}

export function sourceSize(img: ImageSource): { w: number; h: number } {
  if (img instanceof HTMLImageElement) return { w: img.naturalWidth, h: img.naturalHeight }
  return { w: img.width, h: img.height }
}
