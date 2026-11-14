export type StoreId =
  | 'google-play'
  | 'app-store'
  | 'mac-app-store'
  | 'chrome-web-store'
  | 'edge-addons'
  | 'firefox-addons'
  | 'microsoft-store'
  | 'product-hunt'
  | 'icon'
  | 'custom'

export type AssetKind = 'screenshot' | 'feature-graphic' | 'promo-tile' | 'marquee' | 'icon' | 'banner' | 'custom'

export type FramePlatform = 'ios' | 'android' | 'ipad' | 'android-tablet' | 'browser' | 'desktop' | 'none'

export interface Size {
  w: number
  h: number
  label?: string
}

export interface SizeRange {
  minSide: number
  maxSide: number
  maxAspect: number
}

export interface TargetSpec {
  id: string
  store: StoreId
  kind: AssetKind
  label: string
  description?: string
  defaultSize: Size
  sizes?: Size[]
  range?: SizeRange
  formats: Array<'png' | 'jpg'>
  alpha: 'forbidden' | 'required' | 'allowed'
  count?: { min: number; max: number }
  maxBytes?: number
  frame: FramePlatform
  fastlaneDir?: string
  sourceUrl: string
  verifiedAt: string
}

export interface StoreInfo {
  id: StoreId
  name: string
  short: string
  tier: 1 | 2 | 3
  color: string
}
