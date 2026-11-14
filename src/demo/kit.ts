export type Ctx = CanvasRenderingContext2D

export interface TextOpts {
  size?: number
  weight?: number
  color?: string
  align?: CanvasTextAlign
  font?: string
  baseline?: CanvasTextBaseline
  maxWidth?: number
}

export class Kit {
  c: Ctx
  w: number
  h: number
  font: string

  constructor(c: Ctx, w: number, h: number, font = 'Inter') {
    this.c = c
    this.w = w
    this.h = h
    this.font = font
  }

  fill(color: string | CanvasGradient) {
    this.c.fillStyle = color
    this.c.fillRect(0, 0, this.w, this.h)
  }

  rr(x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke?: string) {
    const c = this.c
    c.beginPath()
    c.roundRect(x, y, w, h, r)
    c.fillStyle = fill
    c.fill()
    if (stroke) {
      c.strokeStyle = stroke
      c.lineWidth = 1
      c.stroke()
    }
  }

  circle(x: number, y: number, r: number, fill: string | CanvasGradient) {
    this.c.beginPath()
    this.c.arc(x, y, r, 0, Math.PI * 2)
    this.c.fillStyle = fill
    this.c.fill()
  }

  text(s: string, x: number, y: number, o: TextOpts = {}) {
    const c = this.c
    c.font = `${o.weight ?? 400} ${o.size ?? 14}px "${o.font ?? this.font}", system-ui, sans-serif`
    c.fillStyle = o.color ?? '#111'
    c.textAlign = o.align ?? 'left'
    c.textBaseline = o.baseline ?? 'alphabetic'
    c.fillText(s, x, y, o.maxWidth)
  }

  lin(x0: number, y0: number, x1: number, y1: number, stops: string[]) {
    const g = this.c.createLinearGradient(x0, y0, x1, y1)
    stops.forEach((s, i) => g.addColorStop(i / Math.max(1, stops.length - 1), s))
    return g
  }

  statusBar(color: string, time = '9:41') {
    this.text(time, 32, 32, { size: 15, weight: 600, color })
    const c = this.c
    c.fillStyle = color
    ;[0, 1, 2, 3].forEach((i) => c.fillRect(this.w - 96 + i * 5, 26 - i * 2.5, 3, 6 + i * 2.5))
    c.beginPath()
    c.arc(this.w - 62, 32, 7, Math.PI * 1.25, Math.PI * 1.75)
    c.lineWidth = 2
    c.strokeStyle = color
    c.stroke()
    c.beginPath()
    c.roundRect(this.w - 48, 21, 24, 12, 3)
    c.stroke()
    c.fillRect(this.w - 46, 23, 17, 8)
  }

  ring(cx: number, cy: number, r: number, width: number, frac: number, color: string, track: string) {
    const c = this.c
    c.lineCap = 'round'
    c.lineWidth = width
    c.strokeStyle = track
    c.beginPath()
    c.arc(cx, cy, r, 0, Math.PI * 2)
    c.stroke()
    c.strokeStyle = color
    c.beginPath()
    c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac)
    c.stroke()
  }

  linePath(pts: Array<[number, number]>, color: string, width: number) {
    const c = this.c
    c.beginPath()
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
    c.lineJoin = 'round'
    c.lineCap = 'round'
    c.lineWidth = width
    c.strokeStyle = color
    c.stroke()
  }

  area(pts: Array<[number, number]>, bottom: number, fill: string | CanvasGradient) {
    const c = this.c
    c.beginPath()
    c.moveTo(pts[0][0], bottom)
    pts.forEach(([x, y]) => c.lineTo(x, y))
    c.lineTo(pts[pts.length - 1][0], bottom)
    c.closePath()
    c.fillStyle = fill
    c.fill()
  }

  avatar(x: number, y: number, r: number, color: string, initials: string) {
    this.circle(x, y, r, color)
    this.text(initials, x, y + r * 0.35, { size: r * 0.9, weight: 700, color: '#fff', align: 'center' })
  }

  bars(x: number, y: number, w: number, h: number, values: number[], color: string, track?: string, active?: number) {
    const gap = w / values.length
    const bw = gap * 0.55
    values.forEach((v, i) => {
      const bx = x + i * gap + (gap - bw) / 2
      if (track) this.rr(bx, y, bw, h, bw / 2, track)
      this.rr(bx, y + h * (1 - v), bw, h * v, bw / 2, i === active ? color : track ? color : color)
    })
  }

  tabBar(y: number, items: number, active: number, bg: string, on: string, off: string) {
    this.c.fillStyle = bg
    this.c.fillRect(0, y, this.w, this.h - y)
    const gap = this.w / items
    for (let i = 0; i < items; i++) {
      const cx = gap * i + gap / 2
      this.rr(cx - 11, y + 16, 22, 22, 7, i === active ? on : off)
      this.rr(cx - 14, y + 46, 28, 5, 2.5, i === active ? on : off)
    }
    this.rr(this.w / 2 - 67, this.h - 12, 134, 5, 2.5, on)
  }

  seeded(seed: number) {
    let s = seed
    return () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
  }

  wave(n: number, seed: number, min = 0.2, max = 0.9) {
    const r = this.seeded(seed)
    let v = (min + max) / 2
    return Array.from({ length: n }, () => {
      v = Math.min(max, Math.max(min, v + (r() - 0.45) * 0.22))
      return v
    })
  }
}
