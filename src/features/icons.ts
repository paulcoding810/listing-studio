export type IconMask = 'none' | 'play' | 'apple' | 'circle'

export interface IconVariant {
  id: string
  label: string
  group: string
  size: number
  pad: number
  flatten: boolean
  targetId?: string
  path: string
  fastlanePath?: string
  defaultOn: boolean
  browser?: boolean
}

export const ICON_VARIANTS: IconVariant[] = [
  { id: 'master', label: 'Master 1024 PNG', group: 'Source', size: 1024, pad: 0, flatten: false, path: 'icon/icon-1024.png', defaultOn: true },
  { id: 'apple', label: 'App Store 1024, opaque', group: 'Apple', size: 1024, pad: 0, flatten: true, targetId: 'app-store/icon', path: 'app-store/AppIcon-1024.png', defaultOn: true },
  {
    id: 'play',
    label: 'Google Play 512',
    group: 'Google Play',
    size: 512,
    pad: 0,
    flatten: false,
    targetId: 'google-play/icon',
    path: 'google-play/icon-512.png',
    fastlanePath: 'metadata/android/{locale}/images/icon.png',
    defaultOn: true,
  },
  { id: 'chrome', label: 'Chrome Web Store 128 (96 + padding)', group: 'Chrome', size: 128, pad: 16 / 128, flatten: false, targetId: 'chrome-web-store/icon', path: 'chrome-web-store/icon-128.png', defaultOn: true, browser: true },
  { id: 'ext-16', label: 'Extension manifest 16', group: 'Extension manifest', size: 16, pad: 0, flatten: false, path: 'extension/icons/icon16.png', defaultOn: false, browser: true },
  { id: 'ext-32', label: 'Extension manifest 32', group: 'Extension manifest', size: 32, pad: 0, flatten: false, path: 'extension/icons/icon32.png', defaultOn: false, browser: true },
  { id: 'ext-48', label: 'Extension manifest 48', group: 'Extension manifest', size: 48, pad: 0, flatten: false, path: 'extension/icons/icon48.png', defaultOn: false, browser: true },
  { id: 'ext-128', label: 'Extension manifest 128 (padded)', group: 'Extension manifest', size: 128, pad: 16 / 128, flatten: false, path: 'extension/icons/icon128.png', defaultOn: false, browser: true },
]

export const getIconVariant = (id: string) => ICON_VARIANTS.find((v) => v.id === id)

export const isMasterIcon = (targetId: string) => targetId === 'icon/master'

export const PLAY_RADIUS = 0.3
export const APPLE_RADIUS = 0.2237

export function maskPath(ctx: CanvasRenderingContext2D, mask: IconMask, size: number) {
  ctx.beginPath()
  if (mask === 'play') ctx.roundRect(0, 0, size, size, size * PLAY_RADIUS)
  else if (mask === 'circle') ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  else if (mask === 'apple') {
    const n = 5
    const r = size / 2
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * Math.PI * 2
      const c = Math.cos(t)
      const s = Math.sin(t)
      const x = r + r * Math.sign(c) * Math.abs(c) ** (2 / n)
      const y = r + r * Math.sign(s) * Math.abs(s) ** (2 / n)
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.closePath()
  } else ctx.rect(0, 0, size, size)
}

export function composeVariant(src: HTMLCanvasElement, v: IconVariant, roundBrowser = true): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = v.size
  out.height = v.size
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  if (v.flatten) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, v.size, v.size)
  }
  const inset = Math.round(v.size * v.pad)
  const inner = v.size - inset * 2
  ctx.save()
  if (v.browser && roundBrowser) {
    ctx.translate(inset, inset)
    maskPath(ctx, 'apple', inner)
    ctx.clip()
    ctx.translate(-inset, -inset)
  }
  ctx.drawImage(src, inset, inset, inner, inner)
  ctx.restore()
  return out
}
