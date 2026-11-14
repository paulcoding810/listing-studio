import { Loader2, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Segmented, Select, Switch } from '@/components/ui/primitives'
import { renderPageCanvas } from '@/features/export/render'
import { getStore, getTarget } from '@/targets'
import { useEditor } from '@/store/editor-store'
import { localeName } from './LocalizationDialog'
import { APPLE_RADIUS, PLAY_RADIUS } from '@/features/icons'

type Rendered = Record<string, string[]>

export function PreviewDialog({ open, onOpenChange, initialMode = 'gallery' }: { open: boolean; onOpenChange: (v: boolean) => void; initialMode?: 'gallery' | 'listing' }) {
  const project = useEditor((s) => s.project)
  const editorLocale = useEditor((s) => s.activeLocale)
  const [mode, setMode] = useState(initialMode)
  const [gaps, setGaps] = useState(true)
  const [locale, setLocale] = useState(editorLocale)
  const [images, setImages] = useState<Rendered | null>(null)

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setLocale(editorLocale)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !project) return
    let live = true
    setImages(null)
    ;(async () => {
      const out: Rendered = {}
      for (const s of project.spreads) {
        out[s.id] = []
        for (let i = 0; i < s.pages.length; i++) {
          const c = await renderPageCanvas(project, s.id, i, { pixelRatio: Math.min(1, 900 / s.height), locale })
          out[s.id].push(c.toDataURL('image/jpeg', 0.9))
          if (!live) return
        }
      }
      if (live) setImages(out)
    })()
    return () => {
      live = false
    }
  }, [open, project, locale])

  if (!project) return null
  const iconSpread = project.spreads.find((s) => getTarget(s.targetId).kind === 'icon')
  const shotSpreads = project.spreads.filter((s) => s !== iconSpread)
  const firstStore = getTarget((shotSpreads[0] ?? project.spreads[0]).targetId).store
  const iconUrl = iconSpread ? images?.[iconSpread.id]?.[0] : undefined
  const iconRadius = `${(firstStore === 'app-store' || firstStore === 'mac-app-store' ? APPLE_RADIUS : PLAY_RADIUS) * 100}%`
  const store = getStore(firstStore)
  const browserish = ['chrome-web-store', 'edge-addons', 'firefox-addons', 'product-hunt', 'mac-app-store', 'microsoft-store'].includes(firstStore)

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Preview"
      className="h-[90vh] w-[min(1400px,calc(100vw-32px))]"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented
          className="w-64"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'gallery', label: 'Gallery' },
            { value: 'listing', label: 'Store listing mock' },
          ]}
        />
        {mode === 'gallery' && (
          <label className="flex items-center gap-2 text-xs text-muted">
            <Switch checked={gaps} onChange={setGaps} /> Show gaps
          </label>
        )}
        {project.locales.length > 1 && (
          <Select className="w-52" value={locale} onChange={setLocale} options={project.locales.map((l) => ({ value: l, label: localeName(l) }))} />
        )}
      </div>
      {!images ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-subtle" />
        </div>
      ) : mode === 'gallery' ? (
        <div className="space-y-8">
          {project.spreads.map((s) => (
            <div key={s.id}>
              <div className="mb-2 text-xs text-muted">
                {getStore(getTarget(s.targetId).store).name} · {getTarget(s.targetId).label}
              </div>
              <div className="flex overflow-x-auto pb-3" style={{ gap: gaps ? 16 : 0 }}>
                {images[s.id]?.map((u, i) => (
                  <img key={i} src={u} alt={`${i + 1}`} className="shrink-0 shadow-xl shadow-black/40" style={{ height: s === iconSpread ? 200 : s.width > s.height ? 300 : 560, borderRadius: s === iconSpread ? iconRadius : gaps ? 12 : 0 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
          <p className="mb-4 rounded-md bg-slate-100 px-3 py-1.5 text-center text-[11px] text-slate-500">Approximate layout for review only. Not an actual {store.name} page.</p>
          <div className="flex items-center gap-4">
            {iconUrl ? (
              <img src={iconUrl} alt="App icon" className="size-20 shadow-md" style={{ borderRadius: iconRadius }} />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-2xl text-3xl font-bold text-white" style={{ background: project.theme.colors.primary }}>
                {project.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="text-xl font-semibold">{project.name}</div>
              <div className="text-sm" style={{ color: project.theme.colors.primary }}>
                Your Company
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-0.5">
                  4.8 <Star className="size-3 fill-slate-500" />
                </span>
                <span>10K+ downloads</span>
                <span>Everyone</span>
              </div>
            </div>
            <button type="button" className="rounded-full px-6 py-2 text-sm font-semibold text-white" style={{ background: project.theme.colors.primary }}>
              {browserish ? 'Add to browser' : 'Install'}
            </button>
          </div>
          {shotSpreads.map((s) => (
            <div key={s.id} className="mt-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images[s.id]?.map((u, i) => (
                  <img key={i} src={u} alt="" className="shrink-0 rounded-lg border border-slate-200" style={{ height: s.width > s.height ? (browserish ? 320 : 170) : 300 }} />
                ))}
              </div>
            </div>
          ))}
          <div className="mt-6 space-y-2">
            <div className="text-base font-semibold">About this {browserish ? 'extension' : 'app'}</div>
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      )}
    </Dialog>
  )
}
