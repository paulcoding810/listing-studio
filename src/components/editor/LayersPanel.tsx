import { ArrowDownToLine, ArrowUpToLine, ChevronRight, Circle, CopyPlus, Eye, EyeOff, Folder, Image, Lock, Smartphone, Trash2, Type, Unlock, ZoomIn } from 'lucide-react'
import { useState } from 'react'
import { Tip } from '@/components/ui/primitives'
import { locatePage } from '@/lib/doc'
import { cn } from '@/lib/utils'
import { useEditor } from '@/store/editor-store'
import type { Layer } from '@/types/project'

const ICONS = { text: Type, image: Image, shape: Circle, device: Smartphone, zoom: ZoomIn, group: Folder }

function LayerRow({ layer, depth, drag, setDrag }: { layer: Layer; depth: number; drag: string | null; setDrag: (id: string | null) => void }) {
  const selected = useEditor((s) => s.selectedIds.includes(layer.id))
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [over, setOver] = useState<'above' | 'below' | null>(null)
  const st = useEditor.getState()
  const Icon = ICONS[layer.type]
  return (
    <>
      <div
        draggable={!editing}
        onDragStart={(e) => {
          e.stopPropagation()
          setDrag(layer.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragEnd={() => setDrag(null)}
        onDragOver={(e) => {
          if (!drag || drag === layer.id) return
          e.preventDefault()
          e.stopPropagation()
          const r = e.currentTarget.getBoundingClientRect()
          setOver(e.clientY < r.top + r.height / 2 ? 'above' : 'below')
        }}
        onDragLeave={() => setOver(null)}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (drag && drag !== layer.id) st.moveLayerTo(drag, layer.id, over === 'above' ? 'after' : 'before')
          setOver(null)
          setDrag(null)
        }}
        onClick={(e) => (e.shiftKey || e.metaKey ? st.toggleSelect(layer.id) : st.select([layer.id]))}
        className={cn(
          'group relative flex h-8 cursor-pointer items-center gap-1.5 rounded-md pr-1.5 text-[12px]',
          selected ? 'bg-accent-soft text-fg' : 'text-muted hover:bg-surface hover:text-fg',
          !layer.visible && 'opacity-50',
          over === 'above' && 'before:absolute before:inset-x-1 before:-top-px before:h-0.5 before:bg-accent',
          over === 'below' && 'after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:bg-accent',
        )}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        {layer.type === 'group' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(!open)
            }}
            className="cursor-pointer"
            aria-label="Toggle group"
          >
            <ChevronRight className={cn('size-3 transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-3" />
        )}
        <Icon className={cn('size-3.5 shrink-0', selected && 'text-accent')} />
        {editing ? (
          <input
            autoFocus
            defaultValue={layer.name}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              st.renameLayer(layer.id, e.target.value)
              setEditing(false)
            }}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur()
            }}
            className="h-6 min-w-0 flex-1 rounded border border-accent bg-bg px-1 text-[12px] text-fg outline-none"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate" onDoubleClick={() => setEditing(true)}>
            {layer.type === 'text' && layer.name.match(/^(Headline|Subtitle|Hero heading|Section heading|Body|Small caption|Subtitle)$/) ? layer.text.split('\n')[0] || layer.name : layer.name}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            st.updateLayer(layer.id, { locked: !layer.locked })
          }}
          className={cn('cursor-pointer rounded p-0.5 hover:text-fg', layer.locked ? 'text-fg' : 'opacity-0 group-hover:opacity-100')}
          aria-label={layer.locked ? 'Unlock' : 'Lock'}
        >
          {layer.locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            st.updateLayer(layer.id, { visible: !layer.visible })
          }}
          className={cn('cursor-pointer rounded p-0.5 hover:text-fg', layer.visible ? 'opacity-0 group-hover:opacity-100' : 'text-fg')}
          aria-label={layer.visible ? 'Hide' : 'Show'}
        >
          {layer.visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
        </button>
      </div>
      {layer.type === 'group' &&
        open &&
        [...layer.children].reverse().map((c) => <LayerRow key={c.id} layer={c} depth={depth + 1} drag={drag} setDrag={setDrag} />)}
    </>
  )
}

export function LayersPanel() {
  const project = useEditor((s) => s.project)
  const activePageId = useEditor((s) => s.activePageId)
  const selectedIds = useEditor((s) => s.selectedIds)
  const [drag, setDrag] = useState<string | null>(null)
  if (!project || !activePageId) return null
  const loc = locatePage(project, activePageId)
  if (!loc) return null
  const st = useEditor.getState()
  const sel = selectedIds.length > 0
  const selectedShared = selectedIds.some((id) => loc.spread.sharedLayers.some((l) => l.id === id))

  const action = (label: string, icon: React.ReactNode, fn: () => void, disabled = !sel) => (
    <Tip label={label}>
      <button type="button" disabled={disabled} onClick={fn} className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface hover:text-fg disabled:opacity-30" aria-label={label}>
        {icon}
      </button>
    </Tip>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
        {action('Duplicate', <CopyPlus className="size-3.5" />, () => st.duplicateLayers(selectedIds))}
        {action('Bring to front', <ArrowUpToLine className="size-3.5" />, () => st.arrange(selectedIds, 'front'))}
        {action('Send to back', <ArrowDownToLine className="size-3.5" />, () => st.arrange(selectedIds, 'back'))}
        {action('Delete', <Trash2 className="size-3.5" />, () => st.deleteLayers(selectedIds))}
        <div className="flex-1" />
        {loc.spread.pages.length > 1 &&
          (selectedShared ? (
            <button type="button" onClick={() => selectedIds.forEach((id) => st.moveToContainer(id, 'page'))} className="cursor-pointer rounded-md px-2 py-1 text-[11px] text-muted hover:bg-surface hover:text-fg">
              Move to this image
            </button>
          ) : (
            <Tip label="Shared layers span every image in the set, great for seamless designs">
              <button type="button" disabled={!sel} onClick={() => selectedIds.forEach((id) => st.moveToContainer(id, 'shared'))} className="cursor-pointer rounded-md px-2 py-1 text-[11px] text-muted hover:bg-surface hover:text-fg disabled:opacity-30">
                Share across set
              </button>
            </Tip>
          ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="mb-1 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle">{loc.page.name}</div>
        {loc.page.layers.length === 0 && <p className="px-2 py-3 text-xs text-subtle">No layers yet. Add text, shapes or images from the Assets tab.</p>}
        {[...loc.page.layers].reverse().map((l) => (
          <LayerRow key={l.id} layer={l} depth={0} drag={drag} setDrag={setDrag} />
        ))}
        {loc.spread.sharedLayers.length > 0 && (
          <>
            <div className="mb-1 mt-4 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle">Shared across set</div>
            {[...loc.spread.sharedLayers].reverse().map((l) => (
              <LayerRow key={l.id} layer={l} depth={0} drag={drag} setDrag={setDrag} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
