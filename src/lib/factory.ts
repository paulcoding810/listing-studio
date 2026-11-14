import { getFrame, frameForPlatform } from '@/frames'
import { deviceAspect } from '@/features/device-paint'
import { getTarget } from '@/targets'
import { uid } from '@/lib/utils'
import type {
  Background,
  DeviceLayer,
  Fill,
  ImageLayer,
  Page,
  Project,
  Shadow,
  ShapeKind,
  ShapeLayer,
  Spread,
  TextLayer,
  Theme,
  ThemeColorKey,
  ZoomLayer,
} from '@/types/project'

export const DEFAULT_THEME: Theme = {
  colors: {
    primary: '#6366F1',
    secondary: '#EC4899',
    accent: '#F59E0B',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#FFFFFF',
    muted: '#CBD5E1',
  },
  fonts: { heading: 'Poppins', body: 'Inter' },
}

export const shadow = (o: Partial<Shadow> = {}): Shadow => ({
  enabled: true,
  color: '#000000',
  blur: 40,
  offsetX: 0,
  offsetY: 24,
  opacity: 0.35,
  ...o,
})

export const solid = (color: string, ref?: ThemeColorKey): Fill => (ref ? { kind: 'solid', color, ref } : { kind: 'solid', color })

export const linear = (angle: number, ...colors: string[]): Fill => ({
  kind: 'linear',
  angle,
  stops: colors.map((c, i) => ({ offset: colors.length === 1 ? 0 : i / (colors.length - 1), color: c })),
})

export const background = (fill: Fill, extra: Partial<Background> = {}): Background => ({ fill, ...extra })

export type TextPreset = 'hero' | 'heading' | 'subtitle' | 'body' | 'caption'

export const TEXT_PRESETS: Record<TextPreset, { label: string; size: number; weight: number; lineHeight: number; letterSpacing: number; font: 'heading' | 'body' }> = {
  hero: { label: 'Hero heading', size: 96, weight: 800, lineHeight: 1.05, letterSpacing: -1.5, font: 'heading' },
  heading: { label: 'Section heading', size: 64, weight: 700, lineHeight: 1.1, letterSpacing: -0.5, font: 'heading' },
  subtitle: { label: 'Subtitle', size: 40, weight: 500, lineHeight: 1.3, letterSpacing: 0, font: 'body' },
  body: { label: 'Body', size: 30, weight: 400, lineHeight: 1.45, letterSpacing: 0, font: 'body' },
  caption: { label: 'Small caption', size: 22, weight: 600, lineHeight: 1.3, letterSpacing: 2, font: 'body' },
}

export function createText(theme: Theme, opts: Partial<TextLayer> & { preset?: TextPreset; canvasWidth?: number } = {}): TextLayer {
  const { preset = 'heading', canvasWidth = 1080, ...rest } = opts
  const p = TEXT_PRESETS[preset]
  const scale = canvasWidth / 1080
  const width = rest.width ?? Math.round(canvasWidth * 0.84)
  return {
    id: uid(),
    type: 'text',
    name: p.label,
    x: Math.round((canvasWidth - width) / 2),
    y: 120,
    width,
    height: 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: preset === 'hero' ? 'Your headline here' : preset === 'caption' ? 'NEW FEATURE' : 'Add your text',
    fontFamily: theme.fonts[p.font],
    fontRef: p.font,
    fontSize: Math.round(p.size * scale),
    fontWeight: p.weight,
    italic: false,
    uppercase: preset === 'caption',
    color: theme.colors.text,
    colorRef: 'text',
    align: 'center',
    lineHeight: p.lineHeight,
    letterSpacing: p.letterSpacing,
    localizable: true,
    ...rest,
  }
}

export function createImage(assetId: string, w: number, h: number, opts: Partial<ImageLayer> = {}): ImageLayer {
  return {
    id: uid(),
    type: 'image',
    name: 'Image',
    x: 0,
    y: 0,
    width: w,
    height: h,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    assetId,
    fit: 'cover',
    cropZoom: 1,
    cropX: 0.5,
    cropY: 0.5,
    cornerRadius: 0,
    ...opts,
  }
}

const STAR = (n = 5, inner = 0.45) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? inner : 1
    const a = (Math.PI * i) / n - Math.PI / 2
    return [0.5 + 0.5 * r * Math.cos(a), 0.5 + 0.5 * r * Math.sin(a)]
  }).flat()

export function blobPoints(seed: number, n = 8): number[] {
  let s = seed * 9973 + 17
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n
    const r = 0.36 + rnd() * 0.14
    return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]
  }).flat()
}

export const SHAPE_LABELS: Record<ShapeKind, string> = {
  rect: 'Rectangle',
  ellipse: 'Circle',
  line: 'Line',
  triangle: 'Triangle',
  star: 'Star',
  blob: 'Blob',
  arc: 'Arc',
}

export function createShape(kind: ShapeKind, theme: Theme, opts: Partial<ShapeLayer> = {}): ShapeLayer {
  const base: ShapeLayer = {
    id: uid(),
    type: 'shape',
    name: SHAPE_LABELS[kind],
    shape: kind,
    x: 100,
    y: 100,
    width: 320,
    height: kind === 'line' ? 8 : 320,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: kind === 'line' ? { kind: 'solid', color: theme.colors.text, ref: 'text' } : { kind: 'solid', color: theme.colors.primary, ref: 'primary' },
    cornerRadius: kind === 'rect' ? 32 : 0,
  }
  if (kind === 'star') base.points = STAR()
  if (kind === 'triangle') base.points = [0.5, 0, 1, 1, 0, 1]
  if (kind === 'blob') base.points = blobPoints(Math.floor(Math.random() * 1000))
  if (kind === 'line') base.points = [0, 0.5, 1, 0.5]
  return { ...base, ...opts }
}

export function createDevice(frameId: string, canvasW: number, canvasH: number, opts: Partial<DeviceLayer> = {}): DeviceLayer {
  const f = getFrame(frameId)
  const aspect = deviceAspect(f)
  const portrait = aspect < 1
  let height = portrait ? canvasH * 0.62 : (canvasW * 0.78) / aspect
  let width = height * aspect
  if (width > canvasW * 0.9) {
    width = canvasW * 0.9
    height = width / aspect
  }
  return {
    id: uid(),
    type: 'device',
    name: f.name,
    x: Math.round((canvasW - width) / 2),
    y: Math.round(canvasH - height - canvasH * 0.06),
    width: Math.round(width),
    height: Math.round(height),
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    frameId: f.id,
    frameColor: f.defaultColor,
    screenFit: 'cover',
    screenColor: '#111827',
    perspective: { preset: 'straight', rotateX: 0, rotateY: 0, depth: 3 },
    reflection: 0,
    shadow: shadow(),
    ...opts,
  }
}

export function createZoom(sourceId: string | undefined, x: number, y: number, size: number, opts: Partial<ZoomLayer> = {}): ZoomLayer {
  return {
    id: uid(),
    type: 'zoom',
    name: 'Zoom highlight',
    x,
    y,
    width: size,
    height: size,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    sourceId,
    focusX: 0.5,
    focusY: 0.35,
    zoom: 2.2,
    borderColor: '#FFFFFF',
    borderWidth: 10,
    connector: true,
    connectorColor: '#FFFFFF',
    shadow: shadow({ blur: 50, offsetY: 20, opacity: 0.4 }),
    ...opts,
  }
}

export function createPage(name: string, layers: Page['layers'] = []): Page {
  return { id: uid(), name, layers }
}

export function createSpread(targetId: string, theme: Theme, pageCount = 1, opts: Partial<Spread> = {}): Spread {
  const t = getTarget(targetId)
  return {
    id: uid(),
    name: t.label,
    targetId,
    width: t.defaultSize.w,
    height: t.defaultSize.h,
    seamless: false,
    background: background({ kind: 'solid', color: theme.colors.background, ref: 'background' }),
    sharedLayers: [],
    pages: Array.from({ length: pageCount }, (_, i) => createPage(`Screen ${i + 1}`)),
    ...opts,
  }
}

export function createProject(name: string, spreads: Spread[], theme: Theme = DEFAULT_THEME): Project {
  const now = Date.now()
  return {
    id: uid(),
    version: 1,
    name,
    createdAt: now,
    updatedAt: now,
    theme: structuredClone(theme),
    spreads,
    locales: ['en-US'],
    strings: {},
  }
}

export function createBlankProject(name: string, targetId: string, pages = 1, theme = DEFAULT_THEME): Project {
  const spread = createSpread(targetId, theme, pages)
  const t = getTarget(targetId)
  spread.pages.forEach((p) => {
    p.layers.push(
      createText(theme, { preset: 'heading', canvasWidth: spread.width, y: Math.round(spread.height * 0.07), text: 'Your headline here' }),
    )
    if (t.frame !== 'none') {
      const f = frameForPlatform(t.frame)
      p.layers.push(createDevice(f.id, spread.width, spread.height))
    }
  })
  return createProject(name, [spread], theme)
}
