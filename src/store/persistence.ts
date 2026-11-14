import { projectsDb, thumbsDb } from '@/lib/db'
import { debounce } from '@/lib/utils'
import { renderThumbnail } from '@/features/export/render'
import { useEditor } from './editor-store'
import { useProjects } from './project-store'
import type { Project } from '@/types/project'

let lastSaved: Project | null = null

async function save(p: Project) {
  if (p === lastSaved) return
  const { setSaveStatus } = useEditor.getState()
  setSaveStatus('saving')
  try {
    const stamped = { ...p, updatedAt: Date.now() }
    await projectsDb.put(stamped)
    lastSaved = p
    useProjects.getState().upsertSummary(stamped)
    if (useEditor.getState().project === p) setSaveStatus('saved', stamped.updatedAt)
    else setSaveStatus('dirty')
    thumb(stamped)
  } catch (e) {
    console.error('[save]', e)
    setSaveStatus('error')
  }
}

const thumb = debounce(async (p: Project) => {
  try {
    const sp = p.spreads[0]
    if (!sp) return
    const blob = await renderThumbnail(p, sp.id, 0, 360)
    await thumbsDb.put(p.id, blob)
    useProjects.getState().setThumb(p.id, blob)
  } catch (e) {
    console.warn('[thumb]', e)
  }
}, 1500)

const debouncedSave = debounce((p: Project) => void save(p), 700)

export function startAutosave() {
  return useEditor.subscribe((s, prev) => {
    if (!s.project || s.project === prev.project) return
    if (!prev.project || prev.project.id !== s.project.id) {
      lastSaved = s.project
      return
    }
    useEditor.getState().setSaveStatus('dirty')
    debouncedSave(s.project)
  })
}

export async function saveNow() {
  const p = useEditor.getState().project
  if (!p) return
  debouncedSave.cancel()
  lastSaved = null
  await save(p)
}

export function flushPendingSave() {
  const p = useEditor.getState().project
  if (p && p !== lastSaved) {
    debouncedSave.cancel()
    void save(p)
  }
}
