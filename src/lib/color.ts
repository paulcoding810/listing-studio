export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export function parseColor(input: string): RGBA {
  const s = input.trim()
  if (s.startsWith('#')) {
    let h = s.slice(1)
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
    const n = parseInt(h.slice(0, 6), 16)
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a }
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const [r, g, b, a = '1'] = m[1].split(/[\s,/]+/).filter(Boolean)
    return { r: +r, g: +g, b: +b, a: +a }
  }
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  return { r: 0, g: 0, b: 0, a: 1 }
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0')

export function toHex({ r, g, b }: RGBA): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`
}

export function toCss(c: RGBA): string {
  if (c.a >= 1) return toHex(c)
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${+c.a.toFixed(3)})`
}

export function withAlpha(color: string, alpha: number): string {
  return toCss({ ...parseColor(color), a: alpha })
}

export function luminance(color: string): number {
  const { r, g, b } = parseColor(color)
  const f = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export function mix(a: string, b: string, t: number): string {
  const x = parseColor(a)
  const y = parseColor(b)
  return toCss({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t, a: x.a + (y.a - x.a) * t })
}

export const readableOn = (bg: string) => (luminance(bg) > 0.45 ? '#0F172A' : '#FFFFFF')
