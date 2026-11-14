export type ThemeColorKey = 'primary' | 'secondary' | 'accent' | 'background' | 'surface' | 'text' | 'muted'
export type ThemeFontKey = 'heading' | 'body'

export interface Theme {
  colors: Record<ThemeColorKey, string>
  fonts: Record<ThemeFontKey, string>
}

export interface ColorStop {
  offset: number
  color: string
  ref?: ThemeColorKey
}

export type Fill =
  | { kind: 'solid'; color: string; ref?: ThemeColorKey }
  | { kind: 'linear'; angle: number; stops: ColorStop[] }
  | { kind: 'radial'; cx: number; cy: number; r: number; stops: ColorStop[] }

export type PatternKind = 'none' | 'dots' | 'grid' | 'diagonal' | 'waves' | 'noise'

export interface Background {
  fill: Fill
  image?: { assetId: string; opacity: number; blur: number; fit: 'cover' | 'contain' }
  pattern?: { kind: PatternKind; color: string; size: number; opacity: number }
}

export interface Shadow {
  enabled: boolean
  color: string
  blur: number
  offsetX: number
  offsetY: number
  opacity: number
}

export type LayerType = 'text' | 'image' | 'shape' | 'device' | 'zoom' | 'group'

export interface BaseLayer {
  id: string
  type: LayerType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  shadow?: Shadow
}

export interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontFamily: string
  fontRef?: ThemeFontKey
  fontSize: number
  fontWeight: number
  italic: boolean
  uppercase: boolean
  color: string
  colorRef?: ThemeColorKey
  align: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  stroke?: { color: string; width: number }
  localizable: boolean
}

export type ImageFit = 'cover' | 'contain' | 'stretch'

export interface ImageLayer extends BaseLayer {
  type: 'image'
  assetId: string
  fit: ImageFit
  cropZoom: number
  cropX: number
  cropY: number
  cornerRadius: number
  border?: { color: string; width: number }
}

export type ShapeKind = 'rect' | 'ellipse' | 'line' | 'triangle' | 'star' | 'blob' | 'arc'

export interface ShapeLayer extends BaseLayer {
  type: 'shape'
  shape: ShapeKind
  fill: Fill
  stroke?: { color: string; width: number; dash?: number }
  cornerRadius: number
  points?: number[]
  blur?: number
}

export type PerspectivePreset = 'straight' | 'slight' | 'left' | 'right' | 'floating' | 'dramatic' | 'custom'

export interface Perspective {
  preset: PerspectivePreset
  rotateX: number
  rotateY: number
  depth: number
}

export interface DeviceLayer extends BaseLayer {
  type: 'device'
  frameId: string
  frameColor: string
  screenAssetId?: string
  screenFit: 'cover' | 'contain'
  screenColor: string
  perspective: Perspective
  reflection: number
}

export interface ZoomLayer extends BaseLayer {
  type: 'zoom'
  sourceId?: string
  focusX: number
  focusY: number
  zoom: number
  borderColor: string
  borderWidth: number
  connector: boolean
  connectorColor: string
}

export interface GroupLayer extends BaseLayer {
  type: 'group'
  children: Layer[]
}

export type Layer = TextLayer | ImageLayer | ShapeLayer | DeviceLayer | ZoomLayer | GroupLayer

export interface Page {
  id: string
  name: string
  layers: Layer[]
  background?: Background
}

export interface Spread {
  id: string
  name: string
  targetId: string
  width: number
  height: number
  seamless: boolean
  background: Background
  sharedLayers: Layer[]
  pages: Page[]
}

export interface LayerOverride {
  screenAssetId?: string
  assetId?: string
  fontSize?: number
}

export type OverrideKey = keyof LayerOverride

export interface Project {
  id: string
  version: 1
  name: string
  createdAt: number
  updatedAt: number
  theme: Theme
  spreads: Spread[]
  locales: string[]
  strings: Record<string, Record<string, string>>
  overrides?: Record<string, Record<string, LayerOverride>>
  templateId?: string
  brandKitId?: string
}

export interface AssetRecord {
  id: string
  name: string
  kind: 'image' | 'font'
  mime: string
  width: number
  height: number
  size: number
  createdAt: number
  blob: Blob
  family?: string
}

export interface BrandKit {
  id: string
  name: string
  theme: Theme
  logoAssetId?: string
  createdAt: number
  updatedAt: number
}

export interface ProjectSummary {
  id: string
  name: string
  updatedAt: number
  createdAt: number
  pageCount: number
  targets: string[]
}
