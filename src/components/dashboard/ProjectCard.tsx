import { Copy, Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { toast } from '@/components/ui/toast'
import { exportBackup } from '@/lib/backup'
import { timeAgo } from '@/lib/utils'
import { getStore, getTarget } from '@/targets'
import { useProjects } from '@/store/project-store'
import type { ProjectSummary } from '@/types/project'
import { ConfirmDialog, RenameDialog } from './ConfirmDialog'

export function ProjectCard({ p }: { p: ProjectSummary }) {
  const nav = useNavigate()
  const thumb = useProjects((s) => s.thumbs[p.id])
  const { rename, duplicate, remove } = useProjects()
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const stores = [...new Set(p.targets.map((t) => getTarget(t).store))]

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-panel transition-colors hover:border-border-strong">
      <button type="button" onClick={() => nav(`/editor/${p.id}`)} className="block w-full cursor-pointer">
        <div className="checker flex aspect-[4/3] items-center justify-center overflow-hidden bg-surface">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]" />
          ) : (
            <span className="text-xs text-subtle">No preview yet</span>
          )}
        </div>
      </button>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium">{p.name}</div>
          <div className="mt-0.5 text-[11px] text-subtle">
            {p.pageCount} {p.pageCount === 1 ? 'image' : 'images'} · edited {timeAgo(p.updatedAt)}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {stores.map((s) => (
              <span key={s} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${getStore(s).color}22`, color: getStore(s).color }}>
                {getStore(s).short}
              </span>
            ))}
          </div>
        </div>
        <Menu
          trigger={
            <button type="button" className="cursor-pointer rounded-md p-1 text-muted hover:bg-surface hover:text-fg" aria-label="Project actions">
              <MoreHorizontal className="size-4" />
            </button>
          }
        >
          <MenuItem onSelect={() => setRenaming(true)}>
            <Pencil /> Rename
          </MenuItem>
          <MenuItem
            onSelect={async () => {
              await duplicate(p.id)
              toast.success('Project duplicated')
            }}
          >
            <Copy /> Duplicate
          </MenuItem>
          <MenuItem onSelect={() => exportBackup(p.id).catch((e) => toast.error(String(e.message ?? e)))}>
            <Download /> Export backup
          </MenuItem>
          <MenuSeparator />
          <MenuItem danger onSelect={() => setDeleting(true)}>
            <Trash2 /> Delete
          </MenuItem>
        </Menu>
      </div>
      <RenameDialog open={renaming} onOpenChange={setRenaming} initial={p.name} title="Rename project" onSubmit={(n) => rename(p.id, n)} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete project?"
        message={`“${p.name}” will be permanently removed from this browser.`}
        onConfirm={() => remove(p.id).then(() => toast.info('Project deleted'))}
      />
    </div>
  )
}
