import { frameForPlatform, getFrame } from '@/frames'
import { PERSPECTIVE_PRESETS } from '@/features/perspective'
import { createDevice, createPage, createProject, createShape, createText, createZoom, shadow } from '@/lib/factory'
import { uid } from '@/lib/utils'
import { getTarget } from '@/targets'
import type { StoreId } from '@/types/target'
import type { Background, DeviceLayer, Layer, PerspectivePreset, Project, Spread, Theme } from '@/types/project'

export type TemplateCategory =
  | 'Minimal'
  | 'Gradient'
  | 'Dark Premium'
  | '3D Showcase'
  | 'Finance'
  | 'Fitness'
  | 'Productivity'
  | 'Social Media'
  | 'E-commerce'
  | 'Education'
  | 'Browser Extension'
  | 'Desktop App'
  | 'App Icon'

export const CATEGORIES: TemplateCategory[] = [
  'Minimal',
  'Gradient',
  'Dark Premium',
  '3D Showcase',
  'Finance',
  'Fitness',
  'Productivity',
  'Social Media',
  'E-commerce',
  'Education',
  'Browser Extension',
  'Desktop App',
  'App Icon',
]

export interface TemplateDef {
  id: string
  name: string
  category: TemplateCategory
  description: string
  store: StoreId
  build: () => { theme: Theme; spreads: Spread[] }
}

export interface PageSpec {
  title: string
  subtitle?: string
  screen?: string
  layout?: 'top' | 'bottom' | 'tilt-left' | 'tilt-right' | 'duo' | 'zoom'
  screen2?: string
  extra?: (ctx: { W: number; H: number; theme: Theme; device?: DeviceLayer }) => Layer[]
}

export interface SetSpec {
  targetId: string
  theme: Theme
  background: Background
  seamless?: boolean
  frameId?: string
  frameColor?: string
  align?: 'left' | 'center'
  uppercase?: boolean
  titleScale?: number
  pages: PageSpec[]
  shared?: (ctx: { W: number; H: number; theme: Theme; count: number }) => Layer[]
  perspective?: PerspectivePreset
}

const persp = (p: PerspectivePreset) => (p === 'custom' ? { preset: p, rotateX: 0, rotateY: 0, depth: 3 } : { preset: p, ...PERSPECTIVE_PRESETS[p] })

export function buildSet(s: SetSpec): Spread {
  const t = getTarget(s.targetId)
  const W = t.defaultSize.w
  const H = t.defaultSize.h
  const k = W / 1080
  const frame = s.frameId ? getFrame(s.frameId) : frameForPlatform(t.frame)
  const portrait = H > W
  const pages = s.pages.map((ps, i) => {
    const layers: Layer[] = []
    const align = s.align ?? 'center'
    const margin = Math.round(W * 0.08)
    const titleSize = Math.round((portrait ? 88 : 64) * k * (s.titleScale ?? 1))
    const titleLines = ps.title.split('\n').length
    const textW = W - margin * 2
    const bottomText = ps.layout === 'bottom'
    const titleY = bottomText ? Math.round(H * 0.74) : Math.round(H * (portrait ? 0.065 : 0.09))
    layers.push(
      createText(s.theme, {
        preset: 'hero',
        name: 'Headline',
        text: ps.title,
        x: margin,
        y: titleY,
        width: textW,
        fontSize: titleSize,
        align,
        uppercase: !!s.uppercase,
        canvasWidth: W,
      }),
    )
    const subY = titleY + titleLines * titleSize * 1.08 + 24 * k
    if (ps.subtitle) {
      layers.push(
        createText(s.theme, {
          preset: 'subtitle',
          name: 'Subtitle',
          text: ps.subtitle,
          x: margin,
          y: Math.round(subY),
          width: textW,
          fontSize: Math.round((portrait ? 38 : 30) * k),
          align,
          color: s.theme.colors.muted,
          colorRef: 'muted',
          canvasWidth: W,
        }),
      )
    }
    let device: DeviceLayer | undefined
    if (ps.screen !== undefined) {
      const top = bottomText ? H * 0.06 : subY + (ps.subtitle ? 110 * k : 50 * k)
      const avail = bottomText ? H * 0.64 : H - top + H * 0.08
      device = createDevice(frame.id, W, H, { screenAssetId: ps.screen || undefined, frameColor: s.frameColor ?? frame.defaultColor })
      const aspect = device.width / device.height
      let h = portrait ? Math.min(avail, H * 0.72) : avail * 0.95
      let w = h * aspect
      if (w > W * (portrait ? 0.78 : 0.82)) {
        w = W * (portrait ? 0.78 : 0.82)
        h = w / aspect
      }
      device.width = Math.round(w)
      device.height = Math.round(h)
      device.x = Math.round((W - w) / 2)
      device.y = Math.round(top)
      device.shadow = shadow({ blur: 60 * k, offsetY: 30 * k, opacity: 0.35 })
      if (ps.layout === 'tilt-left' || ps.layout === 'tilt-right') {
        device.perspective = persp(ps.layout === 'tilt-left' ? 'left' : 'right')
        device.x += ps.layout === 'tilt-left' ? -W * 0.04 : W * 0.04
      } else if (s.perspective) device.perspective = persp(s.perspective)
      if (ps.layout === 'duo' && ps.screen2) {
        const back = structuredClone(device)
        back.id = uid()
        back.screenAssetId = ps.screen2
        back.width = Math.round(w * 0.86)
        back.height = Math.round(h * 0.86)
        back.x = Math.round(W * 0.5)
        back.y = Math.round(top + h * 0.1)
        back.rotation = 8
        device.x = Math.round(W * 0.08)
        device.rotation = -6
        layers.push(back)
      }
      layers.push(device)
      if (ps.layout === 'zoom') {
        const size = Math.round(W * 0.38)
        layers.push(createZoom(device.id, Math.round(W - size - margin * 0.4), Math.round(top + h * 0.12), size, { focusX: 0.5, focusY: 0.38, zoom: 2 }))
      }
    }
    if (ps.extra) layers.push(...ps.extra({ W, H, theme: s.theme, device }))
    const page = createPage(`Screen ${i + 1}`, layers)
    return page
  })
  return {
    id: uid(),
    name: t.label,
    targetId: t.id,
    width: W,
    height: H,
    seamless: !!s.seamless,
    background: s.background,
    sharedLayers: s.shared ? s.shared({ W, H, theme: s.theme, count: pages.length }) : [],
    pages,
  }
}

export const glow = (theme: Theme, x: number, y: number, size: number, color: keyof Theme['colors'], opacity = 0.55) =>
  createShape('ellipse', theme, {
    name: 'Glow',
    x: x - size / 2,
    y: y - size / 2,
    width: size,
    height: size,
    fill: { kind: 'radial', cx: 0.5, cy: 0.5, r: 0.5, stops: [{ offset: 0, color: theme.colors[color], ref: color }, { offset: 1, color: 'rgba(0,0,0,0)' }] },
    opacity,
  })

export const blob = (theme: Theme, x: number, y: number, size: number, color: keyof Theme['colors'], opacity = 1, blur = 0) => {
  const b = createShape('blob', theme, { x, y, width: size, height: size, fill: { kind: 'solid', color: theme.colors[color], ref: color }, opacity, blur })
  return b
}

export const pill = (theme: Theme, text: string, x: number, y: number, k: number, color: keyof Theme['colors'] = 'accent'): Layer[] => {
  const w = Math.round((text.length * 15 + 60) * k)
  const h = Math.round(52 * k)
  return [
    createShape('rect', theme, { name: 'Badge', x, y, width: w, height: h, cornerRadius: h / 2, fill: { kind: 'solid', color: theme.colors[color], ref: color } }),
    createText(theme, {
      preset: 'caption',
      name: 'Badge label',
      text,
      x,
      y: y + Math.round(13 * k),
      width: w,
      fontSize: Math.round(22 * k),
      color: '#FFFFFF',
      colorRef: undefined,
      letterSpacing: 1.5,
      canvasWidth: 1080,
    }),
  ]
}

export function projectFromTemplate(t: TemplateDef, name?: string): Project {
  const { theme, spreads } = t.build()
  const p = createProject(name ?? t.name, spreads, theme)
  p.templateId = t.id
  return p
}
