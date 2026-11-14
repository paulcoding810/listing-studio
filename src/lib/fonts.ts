import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import '@fontsource/montserrat/900.css'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/800.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/dm-sans/800.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import { create } from 'zustand'
import { assetsDb } from '@/lib/db'
import { uid } from '@/lib/utils'
import type { AssetRecord, Layer, Project } from '@/types/project'

export interface FontInfo {
  family: string
  weights: number[]
  category: 'sans' | 'serif' | 'display' | 'mono'
  custom?: boolean
}

export const BUILTIN_FONTS: FontInfo[] = [
  { family: 'Inter', weights: [400, 500, 600, 700, 800], category: 'sans' },
  { family: 'Poppins', weights: [400, 600, 700, 800], category: 'sans' },
  { family: 'Montserrat', weights: [400, 600, 700, 800, 900], category: 'sans' },
  { family: 'DM Sans', weights: [400, 500, 700, 800], category: 'sans' },
  { family: 'Outfit', weights: [400, 600, 700, 800], category: 'display' },
  { family: 'Space Grotesk', weights: [400, 500, 600, 700], category: 'display' },
  { family: 'Playfair Display', weights: [400, 600, 700, 800], category: 'serif' },
  { family: 'JetBrains Mono', weights: [400, 700], category: 'mono' },
  { family: 'Georgia', weights: [400, 700], category: 'serif' },
  { family: 'Arial', weights: [400, 700], category: 'sans' },
]

interface FontState {
  epoch: number
  custom: FontInfo[]
  bump: () => void
  addCustom: (f: FontInfo) => void
}

export const useFonts = create<FontState>((set) => ({
  epoch: 0,
  custom: [],
  bump: () => set((s) => ({ epoch: s.epoch + 1 })),
  addCustom: (f) => set((s) => ({ custom: [...s.custom.filter((c) => c.family !== f.family), f] })),
}))

const loaded = new Set<string>()

export async function loadFont(family: string, weight = 400, italic = false) {
  const key = `${family}|${weight}|${italic}`
  if (loaded.has(key)) return
  try {
    await document.fonts.load(`${italic ? 'italic ' : ''}${weight} 32px "${family}"`)
  } catch {
    /* system font or unavailable */
  }
  if (!loaded.has(key)) {
    loaded.add(key)
    scheduleBump()
  }
}

let bumpTimer: ReturnType<typeof setTimeout> | undefined
function scheduleBump() {
  clearTimeout(bumpTimer)
  bumpTimer = setTimeout(() => useFonts.getState().bump(), 30)
}

export function collectFonts(project: Project): Array<{ family: string; weight: number; italic: boolean }> {
  const out = new Map<string, { family: string; weight: number; italic: boolean }>()
  const visit = (l: Layer) => {
    if (l.type === 'text') {
      const family = l.fontRef ? project.theme.fonts[l.fontRef] : l.fontFamily
      out.set(`${family}|${l.fontWeight}|${l.italic}`, { family, weight: l.fontWeight, italic: l.italic })
    }
    if (l.type === 'group') l.children.forEach(visit)
  }
  project.spreads.forEach((s) => {
    s.sharedLayers.forEach(visit)
    s.pages.forEach((p) => p.layers.forEach(visit))
  })
  return [...out.values()]
}

export async function ensureProjectFonts(project: Project) {
  await Promise.all(collectFonts(project).map((f) => loadFont(f.family, f.weight, f.italic)))
  await document.fonts.ready
}

async function registerFontAsset(rec: AssetRecord) {
  if (!rec.family) return
  const face = new FontFace(rec.family, await rec.blob.arrayBuffer())
  await face.load()
  document.fonts.add(face)
  useFonts.getState().addCustom({ family: rec.family, weights: [400, 700], category: 'display', custom: true })
}

export async function loadCustomFonts() {
  const fonts = await assetsDb.byKind('font')
  await Promise.all(fonts.map((f) => registerFontAsset(f).catch((e) => console.warn('[fonts]', f.name, e))))
  if (fonts.length) useFonts.getState().bump()
}

export async function importFontFile(file: File): Promise<AssetRecord> {
  if (!/\.(woff2?|ttf|otf)$/i.test(file.name)) throw new Error(`${file.name}: use a WOFF, WOFF2, TTF or OTF font.`)
  const family = file.name.replace(/\.[^.]+$/, '').replace(/[-_](Regular|Bold|Medium|Light|Black|Variable.*)$/i, '').replace(/[-_]+/g, ' ')
  const rec: AssetRecord = {
    id: `font_${uid()}`,
    name: file.name,
    kind: 'font',
    mime: file.type || 'font/ttf',
    width: 0,
    height: 0,
    size: file.size,
    createdAt: Date.now(),
    blob: file,
    family,
  }
  await registerFontAsset(rec)
  await assetsDb.put(rec)
  useFonts.getState().bump()
  return rec
}
