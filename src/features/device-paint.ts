import { luminance, mix } from '@/lib/color'
import { sourceSize, type ImageSource } from '@/lib/assets'
import type { FrameDef } from '@/frames'

export interface PaintOptions {
  frameColor: string
  screen?: ImageSource
  screenFit: 'cover' | 'contain'
  screenColor: string
}

export function drawFitted(
  ctx: CanvasRenderingContext2D,
  img: ImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  fit: 'cover' | 'contain',
) {
  const { w: iw, h: ih } = sourceSize(img)
  if (!iw || !ih) return
  const s = fit === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih)
  const dw = iw * s
  const dh = ih * s
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

export function paintDevice(ctx: CanvasRenderingContext2D, f: FrameDef, o: PaintOptions) {
  const light = luminance(o.frameColor) > 0.4
  const { screen: s } = f

  const paintScreen = () => {
    ctx.save()
    rr(ctx, s.x, s.y, s.w, s.h, s.r)
    ctx.clip()
    ctx.fillStyle = o.screenColor
    ctx.fillRect(s.x, s.y, s.w, s.h)
    if (o.screen) drawFitted(ctx, o.screen, s.x, s.y, s.w, s.h, o.screenFit)
    ctx.restore()
  }

  if (f.style === 'phone' || f.style === 'tablet') {
    const btn = mix(o.frameColor, '#000', 0.25)
    ctx.fillStyle = btn
    if (f.style === 'phone') {
      rr(ctx, -3, f.h * 0.2, 6, f.h * 0.05, 3)
      ctx.fill()
      rr(ctx, -3, f.h * 0.28, 6, f.h * 0.09, 3)
      ctx.fill()
      rr(ctx, f.w - 3, f.h * 0.25, 6, f.h * 0.12, 3)
      ctx.fill()
    } else {
      rr(ctx, f.w * 0.75, -3, f.w * 0.1, 6, 3)
      ctx.fill()
    }
    const g = ctx.createLinearGradient(0, 0, f.w, f.h)
    g.addColorStop(0, mix(o.frameColor, '#fff', 0.25))
    g.addColorStop(0.5, o.frameColor)
    g.addColorStop(1, mix(o.frameColor, '#000', 0.2))
    rr(ctx, 0, 0, f.w, f.h, f.bodyRadius)
    ctx.fillStyle = g
    ctx.fill()
    const rim = f.style === 'phone' ? 4.5 : 5
    rr(ctx, rim, rim, f.w - rim * 2, f.h - rim * 2, f.bodyRadius - rim)
    ctx.fillStyle = '#050506'
    ctx.fill()
    paintScreen()
    const cx = s.x + s.w / 2
    if (f.cutout === 'island') {
      rr(ctx, cx - 56, s.y + 14, 112, 32, 16)
      ctx.fillStyle = '#000'
      ctx.fill()
    } else if (f.cutout === 'punch') {
      ctx.beginPath()
      ctx.arc(cx, s.y + 24, 11, 0, Math.PI * 2)
      ctx.fillStyle = '#000'
      ctx.fill()
    } else if (f.cutout === 'dot') {
      ctx.beginPath()
      ctx.arc(cx, (s.y - 0) / 2 + 2, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#1a1a1c'
      ctx.fill()
    }
    const gl = ctx.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h)
    gl.addColorStop(0, 'rgba(255,255,255,0.07)')
    gl.addColorStop(0.35, 'rgba(255,255,255,0)')
    ctx.save()
    rr(ctx, s.x, s.y, s.w, s.h, s.r)
    ctx.clip()
    ctx.fillStyle = gl
    ctx.fillRect(s.x, s.y, s.w, s.h)
    ctx.restore()
    return
  }

  if (f.style === 'browser' || f.style === 'window') {
    ctx.save()
    rr(ctx, 0, 0, f.w, f.h, f.bodyRadius)
    ctx.clip()
    ctx.fillStyle = o.frameColor
    ctx.fillRect(0, 0, f.w, s.y)
    const fg = light ? '#5F6368' : '#BDC1C6'
    const dots = ['#FF5F57', '#FEBC2E', '#28C840']
    dots.forEach((c, i) => {
      ctx.beginPath()
      ctx.arc(26 + i * 22, f.style === 'browser' ? 22 : 26, 7, 0, Math.PI * 2)
      ctx.fillStyle = c
      ctx.fill()
    })
    if (f.style === 'browser') {
      const tab = light ? '#FFFFFF' : '#3C3D41'
      rr(ctx, 100, 8, 240, 36, [10, 10, 0, 0])
      ctx.fillStyle = tab
      ctx.fill()
      rr(ctx, 116, 20, 14, 14, 4)
      ctx.fillStyle = mix(fg, tab, 0.4)
      ctx.fill()
      rr(ctx, 140, 23, 140, 8, 4)
      ctx.fill()
      ctx.fillStyle = tab
      ctx.fillRect(0, 44, f.w, s.y - 44)
      ;[0, 1, 2].forEach((i) => {
        ctx.beginPath()
        ctx.arc(28 + i * 34, 66, 7, 0, Math.PI * 2)
        ctx.strokeStyle = fg
        ctx.lineWidth = 2
        ctx.stroke()
      })
      rr(ctx, 130, 51, f.w - 260, 30, 15)
      ctx.fillStyle = light ? '#F1F3F4' : '#28292C'
      ctx.fill()
      rr(ctx, 152, 61, 220, 10, 5)
      ctx.fillStyle = mix(fg, light ? '#F1F3F4' : '#28292C', 0.5)
      ctx.fill()
      ;[0, 1].forEach((i) => {
        rr(ctx, f.w - 108 + i * 40, 54, 24, 24, 7)
        ctx.fillStyle = i === 0 ? '#8B5CF6' : mix(fg, tab, 0.6)
        ctx.fill()
      })
    } else {
      rr(ctx, f.w / 2 - 110, 18, 220, 14, 7)
      ctx.fillStyle = mix(fg, o.frameColor, 0.55)
      ctx.fill()
    }
    ctx.restore()
    ctx.save()
    rr(ctx, 0, 0, f.w, f.h, f.bodyRadius)
    ctx.clip()
    ctx.fillStyle = o.screenColor
    ctx.fillRect(s.x, s.y, s.w, s.h)
    if (o.screen) {
      ctx.beginPath()
      ctx.rect(s.x, s.y, s.w, s.h)
      ctx.clip()
      drawFitted(ctx, o.screen, s.x, s.y, s.w, s.h, o.screenFit)
    }
    ctx.restore()
    rr(ctx, 0.5, 0.5, f.w - 1, f.h - 1, f.bodyRadius)
    ctx.strokeStyle = light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    ctx.stroke()
    return
  }

  // laptop
  const lid = { x: s.x - 22, y: 0, w: s.w + 44, h: s.h + s.y + 22 }
  rr(ctx, lid.x, lid.y, lid.w, lid.h, [f.bodyRadius, f.bodyRadius, 6, 6])
  ctx.fillStyle = mix(o.frameColor, '#000', 0.35)
  ctx.fill()
  rr(ctx, lid.x + 4, lid.y + 4, lid.w - 8, lid.h - 8, [f.bodyRadius - 4, f.bodyRadius - 4, 4, 4])
  ctx.fillStyle = '#0A0A0B'
  ctx.fill()
  paintScreen()
  ctx.beginPath()
  ctx.arc(f.w / 2, 18, 4, 0, Math.PI * 2)
  ctx.fillStyle = '#222'
  ctx.fill()
  const baseY = lid.h
  const bg = ctx.createLinearGradient(0, baseY, 0, f.h)
  bg.addColorStop(0, mix(o.frameColor, '#fff', 0.25))
  bg.addColorStop(1, mix(o.frameColor, '#000', 0.3))
  ctx.beginPath()
  ctx.moveTo(0, baseY)
  ctx.lineTo(f.w, baseY)
  ctx.lineTo(f.w - 40, f.h)
  ctx.lineTo(40, f.h)
  ctx.closePath()
  ctx.fillStyle = bg
  ctx.fill()
  rr(ctx, f.w / 2 - 120, baseY, 240, 12, [0, 0, 10, 10])
  ctx.fillStyle = mix(o.frameColor, '#000', 0.2)
  ctx.fill()
}

export function renderDeviceCanvas(f: FrameDef, o: PaintOptions, scale: number): HTMLCanvasElement {
  const pad = 4
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round((f.w + pad * 2) * scale))
  c.height = Math.max(1, Math.round((f.h + pad * 2) * scale))
  const ctx = c.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.translate(pad, pad)
  paintDevice(ctx, f, o)
  return c
}

export const DEVICE_PAD = 4

export function screenRectInLayer(f: FrameDef, layerW: number, layerH: number) {
  const sx = layerW / (f.w + DEVICE_PAD * 2)
  const sy = layerH / (f.h + DEVICE_PAD * 2)
  return {
    x: (f.screen.x + DEVICE_PAD) * sx,
    y: (f.screen.y + DEVICE_PAD) * sy,
    w: f.screen.w * sx,
    h: f.screen.h * sy,
  }
}

export function deviceAspect(f: FrameDef) {
  return (f.w + DEVICE_PAD * 2) / (f.h + DEVICE_PAD * 2)
}
