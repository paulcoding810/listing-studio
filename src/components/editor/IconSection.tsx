import { ImagePlus, LayoutTemplate } from 'lucide-react'
import { placeIconEverywhere } from './AppIconAssets'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'
import { renderPageCanvas } from '@/features/export/render'
import { APPLE_RADIUS, PLAY_RADIUS, type IconMask } from '@/features/icons'
import { createImage } from '@/lib/factory'
import { loadAsset, sourceSize } from '@/lib/assets'
import { useEditor } from '@/store/editor-store'
import { useProjects } from '@/store/project-store'
import type { Project, Spread } from '@/types/project'
import { Section } from './controls'

function useIconRender(project: Project, spread: Spread, pageIndex: number) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let live = true
    const t = setTimeout(async () => {
      try {
        const c = await renderPageCanvas(project, spread.id, pageIndex, { pixelRatio: 256 / spread.width })
        if (live) setUrl(c.toDataURL('image/png'))
      } catch (e) {
        console.warn('[icon preview]', e)
      }
    }, 300)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [project, spread, pageIndex])
  return url
}

function Tile({ url, label, radius, pad = 0, bg, size = 64 }: { url?: string; label: string; radius: string; pad?: number; bg: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center justify-center rounded-lg p-2" style={{ background: bg }}>
        <div style={{ width: size, height: size, padding: size * pad }}>
          {url ? <img src={url} alt={label} className="size-full" style={{ borderRadius: radius, boxShadow: radius !== '0' ? '0 2px 6px rgba(0,0,0,0.25)' : undefined }} /> : <div className="size-full rounded bg-surface-2" />}
        </div>
      </div>
      <span className="text-[10px] text-subtle">{label}</span>
    </div>
  )
}

export function IconSection({ project, spread, pageId }: { project: Project; spread: Spread; pageId: string }) {
  const mask = useEditor((s) => s.iconMask)
  const kits = useProjects((s) => s.brandKits)
  const pageIndex = Math.max(0, spread.pages.findIndex((p) => p.id === pageId))
  const url = useIconRender(project, spread, pageIndex)
  const kit = kits.find((k) => k.id === project.brandKitId && k.logoAssetId) ?? kits.find((k) => k.logoAssetId)

  const insertLogo = async () => {
    if (!kit?.logoAssetId) return
    const img = await loadAsset(kit.logoAssetId)
    if (!img) return toast.error('Logo could not be loaded')
    const { w, h } = sourceSize(img)
    const box = spread.width * 0.56
    const s = Math.min(box / w, box / h)
    const width = Math.round(w * s)
    const height = Math.round(h * s)
    useEditor.getState().addLayer(
      createImage(kit.logoAssetId, width, height, { name: `${kit.name} logo`, fit: 'contain', x: Math.round((spread.width - width) / 2), y: Math.round((spread.height - height) / 2) }),
    )
  }

  return (
    <Section title="App icon">
      <p className="text-[11px] leading-snug text-subtle">
        Design a full square with square corners. Google Play and Apple round the corners and add shadows themselves.
      </p>
      <div className="space-y-1">
        <span className="text-xs text-muted">Mask preview on canvas</span>
        <Segmented<IconMask>
          value={mask}
          onChange={(m) => useEditor.getState().setIconMask(m)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'play', label: 'Play' },
            { value: 'apple', label: 'Apple' },
            { value: 'circle', label: 'Circle' },
          ]}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <Tile url={url} label="Google Play" radius={`${PLAY_RADIUS * 100}%`} bg="#F1F5F9" />
        <Tile url={url} label="App Store" radius={`${APPLE_RADIUS * 100}%`} bg="#F1F5F9" />
        <Tile url={url} label="Chrome 128" radius={`${APPLE_RADIUS * 100}%`} pad={16 / 128} bg="#F1F5F9" />
        <Tile url={url} label="Dark mode" radius={`${APPLE_RADIUS * 100}%`} bg="#0B0B0F" />
        <Tile url={url} label="48 px" radius={`${PLAY_RADIUS * 100}%`} bg="#F1F5F9" size={24} />
        <Tile url={url} label="16 px" radius={`${APPLE_RADIUS * 100}%`} bg="#F1F5F9" size={16} />
      </div>
      <Button size="sm" className="w-full" onClick={placeIconEverywhere}>
        <LayoutTemplate /> Place on promo tiles & feature graphic
      </Button>
      {kit ? (
        <Button size="sm" className="w-full" onClick={insertLogo}>
          <ImagePlus /> Insert {kit.name} logo
        </Button>
      ) : (
        <p className="text-[11px] text-subtle">Add a logo to a brand kit to insert it here in one click.</p>
      )}
    </Section>
  )
}
