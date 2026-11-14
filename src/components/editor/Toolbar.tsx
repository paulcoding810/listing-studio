import { ArrowLeft, Check, CloudOff, Columns3, Download, Eye, Grid3x3, Loader2, Maximize, Minus, Plus, Redo2, Smartphone, Square, Store, Type, Undo2, Upload } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Select, Tip } from '@/components/ui/primitives'
import { stageRegistry } from '@/features/canvas/stage-registry'
import { addDevice, addText, uploadImages } from '@/features/editor-actions'
import { cn, modKey, timeAgo } from '@/lib/utils'
import { redo, undo, useEditor, useHistory } from '@/store/editor-store'
import { localeName } from './LocalizationDialog'

function SaveStatus() {
  const status = useEditor((s) => s.saveStatus)
  const at = useEditor((s) => s.lastSavedAt)
  const map = {
    idle: { icon: Check, text: 'Saved', cls: 'text-subtle' },
    saved: { icon: Check, text: at ? `Saved ${timeAgo(at)}` : 'Saved', cls: 'text-subtle' },
    dirty: { icon: Loader2, text: 'Unsaved changes', cls: 'text-subtle' },
    saving: { icon: Loader2, text: 'Saving…', cls: 'text-muted' },
    error: { icon: CloudOff, text: 'Save failed', cls: 'text-danger' },
  }[status]
  return (
    <span className={cn('hidden items-center gap-1.5 text-xs lg:flex', map.cls)}>
      <map.icon className={cn('size-3.5', status === 'saving' && 'animate-spin')} />
      {map.text}
    </span>
  )
}

const icon = 'size-8'

export function Toolbar({ onExport, onPreview }: { onExport: () => void; onPreview: (m: 'gallery' | 'listing') => void }) {
  const project = useEditor((s) => s.project)
  const zoom = useEditor((s) => s.zoom)
  const viewMode = useEditor((s) => s.viewMode)
  const showGrid = useEditor((s) => s.showGrid)
  const locale = useEditor((s) => s.activeLocale)
  const canUndo = useHistory((s) => s.pastStates.length > 0)
  const canRedo = useHistory((s) => s.futureStates.length > 0)
  const fileRef = useRef<HTMLInputElement>(null)
  if (!project) return null
  const st = useEditor.getState()
  const zoomBy = (f: number) => {
    const el = stageRegistry.get()
    const w = el?.width() ?? 1000
    const h = el?.height() ?? 800
    const next = Math.max(0.03, Math.min(8, zoom * f))
    st.setZoom(next, { x: w / 2 - ((w / 2 - st.pan.x) * next) / zoom, y: h / 2 - ((h / 2 - st.pan.y) * next) / zoom })
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border bg-panel px-2">
      <Tip label="Back to dashboard">
        <Link to="/" className="flex h-8 items-center gap-1.5 rounded-md px-1.5 text-muted hover:bg-surface hover:text-fg" aria-label="Back to dashboard">
          <ArrowLeft className="size-4" />
          <Logo size={22} />
        </Link>
      </Tip>
      <input
        key={project.id + project.name}
        defaultValue={project.name}
        onBlur={(e) => e.target.value.trim() !== project.name && st.rename(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-8 w-40 rounded-md bg-transparent px-2 text-[13px] font-medium outline-none hover:bg-surface focus:bg-surface lg:w-56"
        aria-label="Project name"
      />
      <div className="mx-1 h-5 w-px bg-border" />
      <Tip label={`Undo (${modKey}Z)`}>
        <Button variant="ghost" size="icon" className={icon} disabled={!canUndo} onClick={undo} aria-label="Undo">
          <Undo2 />
        </Button>
      </Tip>
      <Tip label={`Redo (${modKey}⇧Z)`}>
        <Button variant="ghost" size="icon" className={icon} disabled={!canRedo} onClick={redo} aria-label="Redo">
          <Redo2 />
        </Button>
      </Tip>
      <div className="mx-1 h-5 w-px bg-border" />
      <Tip label="Add text (T)">
        <Button variant="ghost" size="icon" className={icon} onClick={() => addText('heading')} aria-label="Add text">
          <Type />
        </Button>
      </Tip>
      <Tip label="Upload image">
        <Button variant="ghost" size="icon" className={icon} onClick={() => fileRef.current?.click()} aria-label="Upload image">
          <Upload />
        </Button>
      </Tip>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          e.target.value = ''
          void uploadImages(files)
        }}
      />
      <Tip label="Add device frame">
        <Button variant="ghost" size="icon" className={icon} onClick={() => addDevice()} aria-label="Add device">
          <Smartphone />
        </Button>
      </Tip>

      <div className="flex-1" />

      <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
        <Tip label="Single image">
          <button type="button" onClick={() => st.setViewMode('page')} className={cn('flex h-6 cursor-pointer items-center gap-1 rounded px-2 text-xs', viewMode === 'page' ? 'bg-surface-2 text-fg' : 'text-muted')}>
            <Square className="size-3.5" /> <span className="hidden xl:inline">Image</span>
          </button>
        </Tip>
        <Tip label="Whole set side by side (seamless editing)">
          <button type="button" onClick={() => st.setViewMode('spread')} className={cn('flex h-6 cursor-pointer items-center gap-1 rounded px-2 text-xs', viewMode === 'spread' ? 'bg-surface-2 text-fg' : 'text-muted')}>
            <Columns3 className="size-3.5" /> <span className="hidden xl:inline">Set</span>
          </button>
        </Tip>
      </div>
      <Tip label="Grid & center guides">
        <Button variant="ghost" size="icon" className={cn(icon, showGrid && 'bg-accent-soft text-fg')} onClick={st.toggleGrid} aria-label="Toggle grid">
          <Grid3x3 />
        </Button>
      </Tip>
      <div className="flex items-center">
        <Button variant="ghost" size="icon-sm" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out">
          <Minus />
        </Button>
        <Tip label={`Fit (${modKey}0)`}>
          <button type="button" onClick={() => stageRegistry.fit()} className="w-12 cursor-pointer text-center text-xs tabular-nums text-muted hover:text-fg">
            {Math.round(zoom * 100)}%
          </button>
        </Tip>
        <Button variant="ghost" size="icon-sm" onClick={() => zoomBy(1.25)} aria-label="Zoom in">
          <Plus />
        </Button>
        <Tip label="Fit to screen">
          <Button variant="ghost" size="icon-sm" onClick={() => stageRegistry.fit()} aria-label="Fit to screen">
            <Maximize />
          </Button>
        </Tip>
      </div>
      {project.locales.length > 1 && (
        <Select className="h-7 w-36 text-xs" value={locale} onChange={st.setLocale} options={project.locales.map((l) => ({ value: l, label: localeName(l) }))} />
      )}

      <div className="flex-1" />

      <SaveStatus />
      <Tip label="Preview the full gallery">
        <Button variant="ghost" size="sm" onClick={() => onPreview('gallery')}>
          <Eye /> <span className="hidden lg:inline">Preview</span>
        </Button>
      </Tip>
      <Tip label="Preview as a store listing">
        <Button variant="ghost" size="sm" onClick={() => onPreview('listing')}>
          <Store /> <span className="hidden lg:inline">Listing</span>
        </Button>
      </Tip>
      <Button variant="primary" size="sm" onClick={onExport}>
        <Download /> Export
      </Button>
    </header>
  )
}
