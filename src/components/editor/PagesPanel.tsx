import { AlertCircle, CheckCircle2, Copy, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { RenameDialog } from '@/components/dashboard/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { Select } from '@/components/ui/primitives'
import { NumberField } from './controls'
import { usePageThumbs } from '@/hooks/use-page-thumbs'
import { cn } from '@/lib/utils'
import { validateCount, validateSize } from '@/lib/validation'
import { STORES, getStore, getTarget, TARGETS } from '@/targets'
import { useEditor } from '@/store/editor-store'
import type { Spread } from '@/types/project'

function SpreadStatus({ spread }: { spread: Spread }) {
  const t = getTarget(spread.targetId)
  const issues = [...validateSize(t, spread.width, spread.height), ...validateCount(t, spread.pages.length)]
  const errors = issues.filter((i) => i.level === 'error')
  const ok = issues.length === 0
  return (
    <span title={issues.map((i) => i.message).join('\n') || 'Meets store requirements'} className={cn('flex items-center', ok ? 'text-success' : errors.length ? 'text-danger' : 'text-warning')}>
      {ok ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
    </span>
  )
}

export function AddSetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [targetId, setTargetId] = useState('google-play/feature-graphic')
  const [pages, setPages] = useState(1)
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add image set"
      description="A set is a group of images sharing one size and background, such as phone screenshots or a feature graphic."
      footer={
        <Button
          variant="primary"
          onClick={() => {
            useEditor.getState().addSpread(targetId, pages)
            onOpenChange(false)
          }}
        >
          Add set
        </Button>
      }
    >
      <div className="space-y-3">
        <Select
          value={targetId}
          onChange={(v) => {
            setTargetId(v)
            const t = getTarget(v)
            setPages(t.kind === 'screenshot' ? 3 : 1)
          }}
          options={TARGETS.map((t) => ({ value: t.id, group: getStore(t.store).name, label: `${t.label} · ${t.defaultSize.w}×${t.defaultSize.h}` }))}
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">Images</span>
          <NumberField value={pages} min={1} max={10} onChange={setPages} className="w-24 flex-none" />
        </div>
        <p className="text-xs text-muted">{STORES.length} stores supported. Sizes can be changed later from the canvas properties.</p>
      </div>
    </Dialog>
  )
}

export function PagesPanel() {
  const project = useEditor((s) => s.project)
  const activePageId = useEditor((s) => s.activePageId)
  const locale = useEditor((s) => s.activeLocale)
  const thumbs = usePageThumbs(project, locale)
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [drag, setDrag] = useState<{ id: string; spread: string } | null>(null)
  const [over, setOver] = useState<string | null>(null)
  if (!project) return null
  const st = useEditor.getState()
  const total = project.spreads.reduce((n, s) => n + s.pages.length, 0)

  return (
    <div className="space-y-4 p-3">
      {project.spreads.map((spread) => {
        const t = getTarget(spread.targetId)
        const store = getStore(t.store)
        return (
          <div key={spread.id}>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: store.color }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{t.store === 'custom' ? 'Custom' : store.short} · {t.label}</div>
                <div className="text-[10px] text-subtle">
                  {spread.width}×{spread.height} · {spread.pages.length} image{spread.pages.length === 1 ? '' : 's'}
                </div>
              </div>
              <SpreadStatus spread={spread} />
              <Menu
                trigger={
                  <button type="button" className="cursor-pointer rounded p-1 text-muted hover:bg-surface hover:text-fg" aria-label="Set actions">
                    <MoreHorizontal className="size-3.5" />
                  </button>
                }
              >
                <MenuItem onSelect={() => st.addPage(spread.id)}>
                  <Plus /> Add image
                </MenuItem>
                <MenuSeparator />
                <MenuItem danger onSelect={() => st.deleteSpread(spread.id)}>
                  <Trash2 /> Delete set
                </MenuItem>
              </Menu>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {spread.pages.map((p, i) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => {
                    setDrag({ id: p.id, spread: spread.id })
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    if (drag?.spread !== spread.id) return
                    e.preventDefault()
                    setOver(p.id)
                  }}
                  onDragEnd={() => {
                    setDrag(null)
                    setOver(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (drag && drag.spread === spread.id) st.movePage(drag.id, i)
                    setDrag(null)
                    setOver(null)
                  }}
                  className={cn('group relative', over === p.id && drag?.id !== p.id && 'before:absolute before:-left-1 before:top-0 before:h-full before:w-0.5 before:rounded before:bg-accent')}
                >
                  <button
                    type="button"
                    onClick={() => st.setActivePage(p.id)}
                    className={cn(
                      'checker flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-colors',
                      p.id === activePageId ? 'border-accent' : 'border-transparent hover:border-border-strong',
                    )}
                    style={{ aspectRatio: `${spread.width} / ${spread.height}`, maxHeight: 220 }}
                  >
                    {thumbs[p.id] ? <img src={thumbs[p.id]} alt="" className="h-full w-full object-contain" draggable={false} /> : <span className="text-[10px] text-subtle">…</span>}
                  </button>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] text-subtle">{i + 1}</span>
                    <span className="truncate text-[11px] text-muted">{p.name}</span>
                    <Menu
                      trigger={
                        <button type="button" className="ml-auto cursor-pointer rounded p-0.5 text-subtle opacity-0 hover:text-fg group-hover:opacity-100" aria-label="Image actions">
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      }
                    >
                      <MenuItem onSelect={() => setRenaming({ id: p.id, name: p.name })}>
                        <Pencil /> Rename
                      </MenuItem>
                      <MenuItem onSelect={() => st.duplicatePage(p.id)}>
                        <Copy /> Duplicate
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem danger onSelect={() => total > 1 && st.deletePage(p.id)}>
                        <Trash2 /> Delete
                      </MenuItem>
                    </Menu>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => st.addPage(spread.id)}
                className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-subtle hover:border-border-strong hover:text-fg"
                style={{ aspectRatio: `${spread.width} / ${spread.height}`, maxHeight: 220 }}
                aria-label="Add image"
              >
                <Plus className="size-5" />
              </button>
            </div>
          </div>
        )
      })}
      <Button className="w-full" onClick={() => setAdding(true)}>
        <Plus /> Add set (another store or size)
      </Button>
      <AddSetDialog open={adding} onOpenChange={setAdding} />
      <RenameDialog
        open={!!renaming}
        onOpenChange={(v) => !v && setRenaming(null)}
        initial={renaming?.name ?? ''}
        title="Rename image"
        onSubmit={(n) => renaming && st.renamePage(renaming.id, n)}
      />
    </div>
  )
}
