import { Eye, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { getStore } from '@/targets'
import { projectFromTemplate, type TemplateDef } from '@/templates/builder'
import { useTemplatePreview } from '@/templates/preview'
import { useProjects } from '@/store/project-store'

function pageCount(t: TemplateDef) {
  return t.build().spreads.reduce((n, s) => n + s.pages.length, 0)
}

export function useUseTemplate() {
  const nav = useNavigate()
  const create = useProjects((s) => s.create)
  return async (t: TemplateDef) => {
    const p = await create(projectFromTemplate(t))
    toast.success(`Created “${p.name}” from template`)
    nav(`/editor/${p.id}`)
  }
}

export function TemplateCard({ t }: { t: TemplateDef }) {
  const urls = useTemplatePreview(t, 3, 300)
  const [preview, setPreview] = useState(false)
  const use = useUseTemplate()
  const store = getStore(t.store)
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-panel transition-colors hover:border-border-strong">
      <div className="relative flex h-44 items-center justify-center gap-1.5 overflow-hidden bg-surface px-3">
        {urls ? (
          urls.map((u, i) => <img key={i} src={u} alt="" className="max-h-36 min-w-0 rounded-md object-contain shadow-lg shadow-black/40" />)
        ) : (
          <Loader2 className="size-5 animate-spin text-subtle" />
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Button size="sm" onClick={() => setPreview(true)}>
            <Eye /> Preview
          </Button>
          <Button size="sm" variant="primary" onClick={() => use(t)}>
            Use template
          </Button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-[13px] font-medium">{t.name}</div>
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${store.color}22`, color: store.color }}>
            {store.short}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-subtle">
          {t.category} · {pageCount(t)} images
        </div>
      </div>
      <TemplatePreviewDialog t={t} open={preview} onOpenChange={setPreview} />
    </div>
  )
}

function TemplatePreviewDialog({ t, open, onOpenChange }: { t: TemplateDef; open: boolean; onOpenChange: (v: boolean) => void }) {
  const urls = useTemplatePreview(open ? t : undefined, 12, 640)
  const use = useUseTemplate()
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t.name}
      description={t.description}
      className="w-[min(1100px,calc(100vw-32px))]"
      footer={
        <Button variant="primary" onClick={() => use(t)}>
          Use template
        </Button>
      }
    >
      <div className="flex min-h-80 items-center gap-3 overflow-x-auto pb-2">
        {urls ? (
          urls.map((u, i) => <img key={i} src={u} alt={`Screen ${i + 1}`} className="max-h-[60vh] rounded-lg shadow-xl shadow-black/50" />)
        ) : (
          <Loader2 className="mx-auto size-6 animate-spin text-subtle" />
        )}
      </div>
    </Dialog>
  )
}
