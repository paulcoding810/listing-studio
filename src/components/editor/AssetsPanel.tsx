import { Circle, Minus, Pentagon, Sparkles, Square, Star, Trash2, Triangle, Type, Upload, ZoomIn } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { DEMO_SCREENS } from '@/demo/screens'
import { addDevice, addImage, addShape, addText, addZoom, selectedDeviceId, setDeviceScreen, uploadImages } from '@/features/editor-actions'
import { renderDeviceCanvas } from '@/features/device-paint'
import { FRAMES } from '@/frames'
import { loadAsset } from '@/lib/assets'
import { assetsDb } from '@/lib/db'
import { TEXT_PRESETS, type TextPreset } from '@/lib/factory'
import { importFontFile, useFonts } from '@/lib/fonts'
import type { AssetRecord, ShapeKind } from '@/types/project'
import { Section } from './controls'
import { AppIconAssets } from './AppIconAssets'

const thumbCache = new Map<string, string>()

function useAssetThumb(id: string) {
  const [url, setUrl] = useState(thumbCache.get(id))
  useEffect(() => {
    if (url) return
    let live = true
    loadAsset(id).then((img) => {
      if (!img || !live) return
      const c = document.createElement('canvas')
      const w = 160
      const iw = img instanceof HTMLImageElement ? img.naturalWidth : img.width
      const ih = img instanceof HTMLImageElement ? img.naturalHeight : img.height
      c.width = w
      c.height = Math.round((w * ih) / Math.max(1, iw))
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      const u = c.toDataURL('image/jpeg', 0.8)
      thumbCache.set(id, u)
      setUrl(u)
    })
    return () => {
      live = false
    }
  }, [id, url])
  return url
}


function AssetTile({ id, w, h, name, onDelete }: { id: string; w: number; h: number; name: string; onDelete?: () => void }) {
  const url = useAssetThumb(id)
  const use = () => {
    const dev = selectedDeviceId()
    if (dev) {
      setDeviceScreen(dev, id)
      toast.success('Screen updated')
    } else addImage(id, w, h)
  }
  return (
    <div className="group relative">
      <button
        type="button"
        draggable
        onDragStart={(e) => e.dataTransfer.setData('application/x-listing-asset', `${id}|${w}|${h}`)}
        onClick={use}
        title={`${name}. Click to add, or select a device first to set its screen.`}
        className="checker flex h-24 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border hover:border-accent"
      >
        {url ? <img src={url} alt={name} className="max-h-full max-w-full object-contain" draggable={false} /> : <span className="text-[10px] text-subtle">…</span>}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-1 top-1 cursor-pointer rounded bg-black/70 p-1 text-white opacity-0 hover:text-danger group-hover:opacity-100"
          aria-label="Delete upload"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  )
}

const frameThumbs = new Map<string, string>()
function FrameThumb({ id }: { id: string }) {
  const f = FRAMES.find((x) => x.id === id)!
  let url = frameThumbs.get(id)
  if (!url) {
    const c = renderDeviceCanvas(f, { frameColor: f.defaultColor, screenFit: 'cover', screenColor: '#2A2F3A' }, 90 / Math.max(f.w, f.h))
    url = c.toDataURL()
    frameThumbs.set(id, url)
  }
  return <img src={url} alt="" className="max-h-16 max-w-full object-contain" />
}

const SHAPES: Array<[ShapeKind, React.ReactNode, string]> = [
  ['rect', <Square key="r" />, 'Rectangle'],
  ['ellipse', <Circle key="e" />, 'Circle'],
  ['triangle', <Triangle key="t" />, 'Triangle'],
  ['star', <Star key="s" />, 'Star'],
  ['blob', <Sparkles key="b" />, 'Blob'],
  ['arc', <Pentagon key="a" />, 'Ring'],
  ['line', <Minus key="l" />, 'Line'],
]

export function AssetsPanel() {
  const [uploads, setUploads] = useState<AssetRecord[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const fontRef = useRef<HTMLInputElement>(null)
  const custom = useFonts((s) => s.custom)

  const reload = () => assetsDb.byKind('image').then((a) => setUploads(a.sort((x, y) => y.createdAt - x.createdAt)))
  useEffect(() => {
    void reload()
    const on = () => void reload()
    window.addEventListener('assets-changed', on)
    return () => window.removeEventListener('assets-changed', on)
  }, [])

  return (
    <div>
      <AppIconAssets />
      <Section title="Text">
        <div className="space-y-1">
          {(Object.keys(TEXT_PRESETS) as TextPreset[]).map((k) => {
            const p = TEXT_PRESETS[k]
            return (
              <button
                key={k}
                type="button"
                onClick={() => addText(k)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-left hover:border-border-strong"
              >
                <Type className="size-3.5 shrink-0 text-subtle" />
                <span style={{ fontSize: Math.max(11, Math.min(20, p.size / 5)), fontWeight: p.weight, letterSpacing: p.letterSpacing > 1 ? 1 : 0 }} className="truncate">
                  {p.label}
                </span>
              </button>
            )
          })}
        </div>
      </Section>
      <Section title="Uploads" action={<span className="text-[10px] text-subtle">PNG · JPG · WebP · SVG</span>}>
        <Button className="w-full" onClick={() => fileRef.current?.click()}>
          <Upload /> Upload images
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])]
            e.target.value = ''
            const dev = selectedDeviceId()
            void uploadImages(files, { deviceId: dev })
          }}
        />
        {uploads.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {uploads.map((a) => (
              <AssetTile
                key={a.id}
                id={a.id}
                w={a.width}
                h={a.height}
                name={a.name}
                onDelete={async () => {
                  await assetsDb.delete(a.id)
                  void reload()
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-subtle">Upload app screenshots or logos. You can also drag files onto the canvas or paste them.</p>
        )}
      </Section>
      <Section title="Device frames">
        <div className="grid grid-cols-3 gap-1.5">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => addDevice(f.id)}
              title={f.name}
              className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface p-1.5 hover:border-accent"
            >
              <FrameThumb id={f.id} />
            </button>
          ))}
        </div>
      </Section>
      <Section title="Shapes & effects">
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPES.map(([k, icon, label]) => (
            <button
              key={k}
              type="button"
              title={label}
              onClick={() => addShape(k)}
              className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted hover:border-accent hover:text-fg [&_svg]:size-4"
            >
              {icon}
            </button>
          ))}
          <button
            type="button"
            title="Zoom highlight"
            onClick={addZoom}
            className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted hover:border-accent hover:text-fg"
          >
            <ZoomIn className="size-4" />
          </button>
        </div>
      </Section>
      <Section title="Demo screens">
        <div className="grid grid-cols-3 gap-1.5">
          {DEMO_SCREENS.map((d) => (
            <AssetTile key={d.id} id={d.id} w={d.w * 2} h={d.h * 2} name={d.name} />
          ))}
        </div>
      </Section>
      <Section title="Fonts" defaultOpen={false}>
        <Button className="w-full" onClick={() => fontRef.current?.click()}>
          <Upload /> Upload font
        </Button>
        <input
          ref={fontRef}
          type="file"
          accept=".woff,.woff2,.ttf,.otf"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              const rec = await importFontFile(f)
              toast.success(`Font “${rec.family}” added`)
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Font upload failed')
            }
          }}
        />
        {custom.map((f) => (
          <div key={f.family} className="rounded-md bg-surface px-2.5 py-1.5 text-sm" style={{ fontFamily: `"${f.family}"` }}>
            {f.family}
          </div>
        ))}
      </Section>
    </div>
  )
}
