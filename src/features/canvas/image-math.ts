import type { ImageLayer } from '@/types/project'

export interface ImagePlacement {
  crop?: { x: number; y: number; width: number; height: number }
  x: number
  y: number
  width: number
  height: number
  toImage: (lx: number, ly: number) => { x: number; y: number }
  scale: number
}

export function placeImage(
  fit: ImageLayer['fit'],
  bw: number,
  bh: number,
  iw: number,
  ih: number,
  zoom = 1,
  fx = 0.5,
  fy = 0.5,
): ImagePlacement {
  if (!iw || !ih || !bw || !bh) return { x: 0, y: 0, width: bw, height: bh, toImage: (x, y) => ({ x, y }), scale: 1 }
  if (fit === 'stretch') {
    return { x: 0, y: 0, width: bw, height: bh, toImage: (x, y) => ({ x: (x * iw) / bw, y: (y * ih) / bh }), scale: (bw / iw + bh / ih) / 2 }
  }
  if (fit === 'contain') {
    const s = Math.min(bw / iw, bh / ih) * zoom
    const w = iw * s
    const h = ih * s
    const x = (bw - w) / 2
    const y = (bh - h) / 2
    if (zoom <= 1) return { x, y, width: w, height: h, toImage: (lx, ly) => ({ x: (lx - x) / s, y: (ly - y) / s }), scale: s }
  }
  const s = Math.max(bw / iw, bh / ih) * Math.max(1, zoom)
  const vw = bw / s
  const vh = bh / s
  const cx = (iw - vw) * fx
  const cy = (ih - vh) * fy
  return {
    crop: { x: cx, y: cy, width: vw, height: vh },
    x: 0,
    y: 0,
    width: bw,
    height: bh,
    toImage: (lx, ly) => ({ x: cx + lx / s, y: cy + ly / s }),
    scale: s,
  }
}
