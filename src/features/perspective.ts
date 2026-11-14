import type { Perspective, PerspectivePreset } from '@/types/project'

export const PERSPECTIVE_PRESETS: Record<Exclude<PerspectivePreset, 'custom'>, Omit<Perspective, 'preset'>> = {
  straight: { rotateX: 0, rotateY: 0, depth: 3 },
  slight: { rotateX: 4, rotateY: -10, depth: 3 },
  left: { rotateX: 0, rotateY: 28, depth: 2.4 },
  right: { rotateX: 0, rotateY: -28, depth: 2.4 },
  floating: { rotateX: 14, rotateY: -14, depth: 2.6 },
  dramatic: { rotateX: 20, rotateY: -38, depth: 1.8 },
}

export const isFlat = (p: Perspective) => Math.abs(p.rotateX) < 0.1 && Math.abs(p.rotateY) < 0.1

const STRIPS = 72

function passY(src: HTMLCanvasElement, deg: number, depth: number): HTMLCanvasElement {
  const w = src.width
  const h = src.height
  const a = (deg * Math.PI) / 180
  const D = depth * Math.max(w, h)
  const proj = (x: number) => {
    const xc = x - w / 2
    const z = xc * Math.sin(a)
    const f = D / (D + z)
    return { x: xc * Math.cos(a) * f, f }
  }
  const l = proj(0)
  const r = proj(w)
  const minX = Math.min(l.x, r.x)
  const maxX = Math.max(l.x, r.x)
  const maxF = Math.max(l.f, r.f)
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.ceil(maxX - minX))
  out.height = Math.max(1, Math.ceil(h * maxF))
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  const sw = w / STRIPS
  for (let i = 0; i < STRIPS; i++) {
    const x0 = i * sw
    const p0 = proj(x0)
    const p1 = proj(x0 + sw)
    const f = (p0.f + p1.f) / 2
    const dh = h * f
    const dx = Math.min(p0.x, p1.x) - minX
    const dw = Math.abs(p1.x - p0.x)
    ctx.drawImage(src, x0, 0, sw, h, dx, (out.height - dh) / 2, dw + 0.6, dh)
  }
  return out
}

function transpose(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = src.height
  out.height = src.width
  const ctx = out.getContext('2d')!
  ctx.setTransform(0, 1, 1, 0, 0, 0)
  ctx.drawImage(src, 0, 0)
  return out
}

export function warpPerspective(src: HTMLCanvasElement, p: Perspective, outW: number, outH: number): HTMLCanvasElement {
  let c = src
  if (Math.abs(p.rotateY) >= 0.1) c = passY(c, p.rotateY, p.depth)
  if (Math.abs(p.rotateX) >= 0.1) c = transpose(passY(transpose(c), -p.rotateX, p.depth))
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(outW))
  out.height = Math.max(1, Math.round(outH))
  const ctx = out.getContext('2d')!
  const s = Math.min(out.width / c.width, out.height / c.height)
  const dw = c.width * s
  const dh = c.height * s
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(c, (out.width - dw) / 2, (out.height - dh) / 2, dw, dh)
  return out
}

export function reflectionCanvas(src: HTMLCanvasElement, fraction = 0.35): HTMLCanvasElement {
  const h = Math.max(1, Math.round(src.height * fraction))
  const out = document.createElement('canvas')
  out.width = src.width
  out.height = h
  const ctx = out.getContext('2d')!
  ctx.save()
  ctx.translate(0, src.height)
  ctx.scale(1, -1)
  ctx.drawImage(src, 0, 0)
  ctx.restore()
  ctx.globalCompositeOperation = 'destination-in'
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, 'rgba(0,0,0,0.55)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, out.width, h)
  return out
}
