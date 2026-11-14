import { ArrowDownToLine, ArrowUpToLine, ChevronDown, ChevronUp, ClipboardPaste, Copy, CopyPlus, Eye, Group, Lock, Trash2, Ungroup, Unlock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { copySelection, groupSelection, pasteClipboard, ungroupSelection } from '@/features/editor-actions'
import { findLayer } from '@/lib/doc'
import { modKey } from '@/lib/utils'
import { useEditor } from '@/store/editor-store'

export function CanvasContextMenu({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const project = useEditor((s) => s.project)
  const ids = useEditor((s) => s.selectedIds)
  const layers = project ? ids.map((id) => findLayer(project, id)?.layer).filter((l) => !!l) : []
  const single = layers.length === 1 ? layers[0] : undefined
  const st = useEditor.getState()

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', esc)
    }
  }, [onClose])

  const item = (icon: React.ReactNode, label: string, fn: () => void, opts: { shortcut?: string; danger?: boolean; disabled?: boolean } = {}) => (
    <button
      type="button"
      disabled={opts.disabled}
      onClick={() => {
        fn()
        onClose()
      }}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-accent-soft disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-3.5 ${opts.danger ? 'text-danger' : 'text-fg [&_svg]:text-muted'}`}
    >
      {icon}
      {label}
      {opts.shortcut && <span className="ml-auto pl-4 text-[11px] text-subtle">{opts.shortcut}</span>}
    </button>
  )
  const sep = <div className="my-1 h-px bg-border" />

  return (
    <div ref={ref} className="absolute z-20 w-56 rounded-lg border border-border bg-panel p-1 shadow-2xl shadow-black/60" style={{ left: x, top: y }}>
      {layers.length === 0 ? (
        item(<ClipboardPaste />, 'Paste', () => pasteClipboard(), { shortcut: `${modKey}V` })
      ) : (
        <>
          {item(<Copy />, 'Copy', copySelection, { shortcut: `${modKey}C` })}
          {item(<ClipboardPaste />, 'Paste', () => pasteClipboard(), { shortcut: `${modKey}V` })}
          {item(<CopyPlus />, 'Duplicate', () => st.duplicateLayers(ids), { shortcut: `${modKey}D` })}
          {sep}
          {item(<ArrowUpToLine />, 'Bring to front', () => ids.forEach((id) => st.arrange(id, 'front')), { shortcut: ']' })}
          {item(<ChevronUp />, 'Bring forward', () => ids.forEach((id) => st.arrange(id, 'forward')))}
          {item(<ChevronDown />, 'Send backward', () => ids.forEach((id) => st.arrange(id, 'backward')))}
          {item(<ArrowDownToLine />, 'Send to back', () => ids.forEach((id) => st.arrange(id, 'back')), { shortcut: '[' })}
          {sep}
          {item(<Group />, 'Group', groupSelection, { shortcut: `${modKey}G`, disabled: layers.length < 2 })}
          {item(<Ungroup />, 'Ungroup', ungroupSelection, { shortcut: `${modKey}⇧G`, disabled: single?.type !== 'group' })}
          {item(single?.locked ? <Unlock /> : <Lock />, single?.locked ? 'Unlock' : 'Lock', () => layers.forEach((l) => st.updateLayer(l.id, { locked: !l.locked })))}
          {item(<Eye />, 'Hide', () => layers.forEach((l) => st.updateLayer(l.id, { visible: false })))}
          {sep}
          {item(<Trash2 />, 'Delete', () => st.deleteLayers(ids), { shortcut: 'Del', danger: true })}
        </>
      )}
    </div>
  )
}
