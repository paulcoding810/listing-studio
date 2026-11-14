import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { getStore } from '@/targets'
import { TEMPLATES } from '@/templates'
import type { TemplateDef } from '@/templates/builder'
import { useTemplatePreview } from '@/templates/preview'
import { useEditor } from '@/store/editor-store'

function applyTemplate(t: TemplateDef, mode: 'replace' | 'append') {
  const { theme, spreads } = t.build()
  const st = useEditor.getState()
  st.mutate((p) => {
    if (mode === 'replace') {
      p.spreads = spreads
      p.theme = theme
      p.strings = {}
      p.templateId = t.id
    } else p.spreads.push(...spreads)
  })
  st.setActivePage(spreads[0].pages[0].id)
  toast.success(mode === 'replace' ? `Applied “${t.name}”` : `Added “${t.name}” as a new set`)
}

function Item({ t }: { t: TemplateDef }) {
  const urls = useTemplatePreview(t, 3, 300)
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-surface p-2">
      <div className="flex h-24 items-center justify-center gap-1 overflow-hidden">
        {urls ? urls.map((u, i) => <img key={i} src={u} alt="" className="max-h-24 min-w-0 rounded object-contain" />) : <Loader2 className="size-4 animate-spin text-subtle" />}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">{t.name}</div>
          <div className="text-[10px] text-subtle">
            {getStore(t.store).short} · {t.category}
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        <Button size="sm" className="flex-1" onClick={() => applyTemplate(t, 'append')}>
          Add as set
        </Button>
        <Button size="sm" variant="primary" className="flex-1" onClick={() => setConfirm(true)}>
          Replace
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Replace project design?"
        message="All images in this project will be replaced by the template. You can undo this."
        confirmLabel="Replace"
        onConfirm={() => applyTemplate(t, 'replace')}
      />
    </div>
  )
}

export function TemplatesPanel() {
  return (
    <div className="space-y-2 p-3">
      {TEMPLATES.map((t) => (
        <Item key={t.id} t={t} />
      ))}
    </div>
  )
}
