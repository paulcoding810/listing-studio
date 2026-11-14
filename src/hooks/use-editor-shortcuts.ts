import { useEffect } from 'react'
import { stageRegistry } from '@/features/canvas/stage-registry'
import { addText, copySelection, groupSelection, pasteClipboard, ungroupSelection, uploadImages } from '@/features/editor-actions'
import { findLayer, locatePage } from '@/lib/doc'
import { isTypingTarget } from '@/lib/utils'
import { redo, undo, useEditor } from '@/store/editor-store'
import { saveNow } from '@/store/persistence'
import { toast } from '@/components/ui/toast'

export function useEditorShortcuts(openExport: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || document.querySelector('[role="dialog"]')) return
      const st = useEditor.getState()
      if (!st.project) return
      const mod = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()
      const sel = st.selectedIds
      const handled = () => e.preventDefault()

      if (mod && k === 'z') {
        handled()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && k === 'y') {
        handled()
        redo()
      } else if (mod && k === 'd') {
        handled()
        if (sel.length) st.duplicateLayers(sel)
      } else if (mod && k === 's') {
        handled()
        void saveNow().then(() => toast.success('Saved'))
      } else if (mod && k === 'e') {
        handled()
        openExport()
      } else if (mod && k === 'g') {
        handled()
        if (e.shiftKey) ungroupSelection()
        else groupSelection()
      } else if (mod && k === 'a') {
        handled()
        const loc = st.activePageId ? locatePage(st.project, st.activePageId) : undefined
        if (loc) st.select(loc.page.layers.filter((l) => !l.locked && l.visible).map((l) => l.id))
      } else if (mod && k === 'c') {
        if (sel.length) {
          handled()
          copySelection()
        }
      } else if (mod && k === '0') {
        handled()
        stageRegistry.fit()
      } else if (mod && k === '1') {
        handled()
        const s = stageRegistry.get()
        const z = st.zoom
        if (s) st.setZoom(1, { x: s.width() / 2 - ((s.width() / 2 - st.pan.x) * 1) / z, y: s.height() / 2 - ((s.height() / 2 - st.pan.y) * 1) / z })
      } else if ((k === 'delete' || k === 'backspace') && sel.length) {
        handled()
        st.deleteLayers(sel)
      } else if (k === 'escape') {
        st.clearSelection()
      } else if (k.startsWith('arrow') && sel.length) {
        handled()
        const d = e.shiftKey ? 10 : 1
        const dx = k === 'arrowleft' ? -d : k === 'arrowright' ? d : 0
        const dy = k === 'arrowup' ? -d : k === 'arrowdown' ? d : 0
        const patches: Record<string, { x: number; y: number }> = {}
        sel.forEach((id) => {
          const l = findLayer(st.project!, id)?.layer
          if (l && !l.locked) patches[id] = { x: l.x + dx, y: l.y + dy }
        })
        st.updateLayers(patches)
      } else if (!mod && k === 't') {
        handled()
        addText('heading')
      } else if (!mod && (k === ']' || k === '[')) {
        handled()
        st.arrange(sel, k === ']' ? (e.shiftKey ? 'front' : 'forward') : e.shiftKey ? 'back' : 'backward')
      } else if (!mod && k === 'enter' && sel.length === 1) {
        const l = findLayer(st.project, sel[0])?.layer
        if (l?.type === 'text') {
          handled()
          st.setEditingText(l.id)
        }
      }
    }
    const onPaste = (e: ClipboardEvent) => {
      if (isTypingTarget(e.target)) return
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
      if (files.length) {
        e.preventDefault()
        void uploadImages(files)
      } else if (pasteClipboard()) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('paste', onPaste)
    }
  }, [openExport])
}
