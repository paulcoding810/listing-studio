import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/input'
import { Select } from '@/components/ui/primitives'
import { NumberField } from '@/components/editor/controls'
import { retargetSpread } from '@/lib/doc'
import { createBlankProject } from '@/lib/factory'
import { cn } from '@/lib/utils'
import { STORES, getTarget, targetsForStore } from '@/targets'
import { useProjects } from '@/store/project-store'
import type { StoreId } from '@/types/target'

export function NewProjectDialog({ open, onOpenChange, initialStore = 'google-play' }: { open: boolean; onOpenChange: (v: boolean) => void; initialStore?: StoreId }) {
  const nav = useNavigate()
  const create = useProjects((s) => s.create)
  const [name, setName] = useState('Untitled project')
  const [store, setStore] = useState<StoreId>(initialStore)
  const targets = useMemo(() => targetsForStore(store), [store])
  const [targetId, setTargetId] = useState(targets[0].id)
  const target = getTarget(targetId)
  const [sizeKey, setSizeKey] = useState(`${target.defaultSize.w}x${target.defaultSize.h}`)
  const [custom, setCustom] = useState({ w: 1080, h: 1080 })
  const [pages, setPages] = useState(4)

  const pickStore = (s: StoreId) => {
    setStore(s)
    const t = targetsForStore(s)[0]
    setTargetId(t.id)
    setSizeKey(`${t.defaultSize.w}x${t.defaultSize.h}`)
    setPages(t.kind === 'screenshot' ? Math.min(4, t.count?.max ?? 4) : 1)
  }
  const pickTarget = (id: string) => {
    const t = getTarget(id)
    setTargetId(id)
    setSizeKey(`${t.defaultSize.w}x${t.defaultSize.h}`)
    setPages(t.kind === 'screenshot' ? Math.min(4, t.count?.max ?? 4) : 1)
  }

  const sizes = target.sizes ?? [target.defaultSize]
  const submit = async () => {
    const [w, h] = store === 'custom' ? [custom.w, custom.h] : sizeKey.split('x').map(Number)
    const p = createBlankProject(name.trim() || 'Untitled project', targetId, pages)
    const sp = p.spreads[0]
    if (w !== sp.width || h !== sp.height) {
      retargetSpread(sp, w, h)
    }
    await create(p)
    onOpenChange(false)
    nav(`/editor/${p.id}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New project"
      description="Pick where the graphics will be published. You can add more stores and sizes later."
      className="w-[min(680px,calc(100vw-32px))]"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            Create project
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <div className="space-y-1.5">
          <Label>Store</Label>
          <div className="grid grid-cols-3 gap-2">
            {STORES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pickStore(s.id)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors',
                  store === s.id ? 'border-accent bg-accent-soft text-fg' : 'border-border bg-surface text-muted hover:text-fg',
                )}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Asset</Label>
            <Select value={targetId} onChange={pickTarget} options={targets.map((t) => ({ value: t.id, label: t.label }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Size</Label>
            {store === 'custom' ? (
              <div className="flex gap-2">
                <NumberField prefix="W" value={custom.w} min={16} max={8192} onChange={(w) => setCustom((c) => ({ ...c, w }))} />
                <NumberField prefix="H" value={custom.h} min={16} max={8192} onChange={(h) => setCustom((c) => ({ ...c, h }))} />
              </div>
            ) : (
              <Select
                value={sizeKey}
                onChange={setSizeKey}
                options={sizes.map((s) => ({ value: `${s.w}x${s.h}`, label: `${s.w} × ${s.h}${s.label ? ` · ${s.label}` : ''}` }))}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="w-24">Images</Label>
          <NumberField value={pages} min={1} max={target.count?.max ?? 10} onChange={setPages} className="w-24 flex-none" />
          {target.description && <p className="text-xs text-muted">{target.description}</p>}
        </div>
      </div>
    </Dialog>
  )
}
