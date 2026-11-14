import type { ColorStop, Fill, Theme, ThemeColorKey } from '@/types/project'

export const resolveColor = (theme: Theme, color: string, ref?: ThemeColorKey) => (ref ? theme.colors[ref] : color)

const stopsArray = (stops: ColorStop[], theme: Theme) =>
  [...stops].sort((a, b) => a.offset - b.offset).flatMap((s) => [s.offset, resolveColor(theme, s.color, s.ref)])

export function linearPoints(angle: number, w: number, h: number) {
  const a = (angle * Math.PI) / 180
  const dx = Math.sin(a)
  const dy = -Math.cos(a)
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2
  const cx = w / 2
  const cy = h / 2
  return { start: { x: cx - dx * half, y: cy - dy * half }, end: { x: cx + dx * half, y: cy + dy * half } }
}

export function konvaFill(fill: Fill, w: number, h: number, theme: Theme, ox = 0, oy = 0): Record<string, unknown> {
  if (fill.kind === 'solid') return { fill: resolveColor(theme, fill.color, fill.ref), fillPriority: 'color' }
  if (fill.kind === 'linear') {
    const { start, end } = linearPoints(fill.angle, w, h)
    return {
      fillPriority: 'linear-gradient',
      fillLinearGradientStartPoint: { x: start.x + ox, y: start.y + oy },
      fillLinearGradientEndPoint: { x: end.x + ox, y: end.y + oy },
      fillLinearGradientColorStops: stopsArray(fill.stops, theme),
    }
  }
  const c = { x: fill.cx * w + ox, y: fill.cy * h + oy }
  return {
    fillPriority: 'radial-gradient',
    fillRadialGradientStartPoint: c,
    fillRadialGradientEndPoint: c,
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: Math.max(1, fill.r * Math.max(w, h)),
    fillRadialGradientColorStops: stopsArray(fill.stops, theme),
  }
}

export function canvasFill(ctx: CanvasRenderingContext2D, fill: Fill, w: number, h: number, theme: Theme): string | CanvasGradient {
  if (fill.kind === 'solid') return resolveColor(theme, fill.color, fill.ref)
  let g: CanvasGradient
  if (fill.kind === 'linear') {
    const { start, end } = linearPoints(fill.angle, w, h)
    g = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
  } else {
    g = ctx.createRadialGradient(fill.cx * w, fill.cy * h, 0, fill.cx * w, fill.cy * h, Math.max(1, fill.r * Math.max(w, h)))
  }
  ;[...fill.stops].sort((a, b) => a.offset - b.offset).forEach((s) => g.addColorStop(Math.min(1, Math.max(0, s.offset)), resolveColor(theme, s.color, s.ref)))
  return g
}

export function fillPreviewCss(fill: Fill, theme: Theme): string {
  if (fill.kind === 'solid') return resolveColor(theme, fill.color, fill.ref)
  const stops = [...fill.stops]
    .sort((a, b) => a.offset - b.offset)
    .map((s) => `${resolveColor(theme, s.color, s.ref)} ${Math.round(s.offset * 100)}%`)
    .join(', ')
  if (fill.kind === 'linear') return `linear-gradient(${fill.angle}deg, ${stops})`
  return `radial-gradient(circle at ${fill.cx * 100}% ${fill.cy * 100}%, ${stops})`
}

export function primaryColor(fill: Fill, theme: Theme): string {
  if (fill.kind === 'solid') return resolveColor(theme, fill.color, fill.ref)
  return resolveColor(theme, fill.stops[0]?.color ?? '#000', fill.stops[0]?.ref)
}
