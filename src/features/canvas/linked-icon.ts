import { useEffect, useSyncExternalStore } from 'react'
import { isLinkedIcon, LINKED_ICON_PREFIX } from '@/lib/doc'
import type { Project } from '@/types/project'

export const LINKED_ICON_SIZE = 512

type Renderer = (project: Project, spreadId: string) => Promise<HTMLCanvasElement>

const cache = new Map<string, HTMLCanvasElement>()
const pending = new Set<string>()
const listeners = new Set<() => void>()
let renderer: Renderer | null = null

export const linkedIconId = (spreadId: string) => LINKED_ICON_PREFIX + spreadId
export const linkedSpreadId = (assetId: string) => (isLinkedIcon(assetId) ? assetId.slice(LINKED_ICON_PREFIX.length) : undefined)

export function setLinkedIconRenderer(fn: Renderer) {
  renderer = fn
}

export function linkedIconKey(project: Project, spreadId: string): string | undefined {
  const spread = project.spreads.find((s) => s.id === spreadId)
  if (!spread || !spread.pages[0]) return undefined
  return JSON.stringify([spreadId, spread.width, spread.background, spread.sharedLayers, spread.pages[0].layers, project.theme])
}

export function getLinkedIcon(project: Project, spreadId: string): HTMLCanvasElement | undefined {
  const key = linkedIconKey(project, spreadId)
  return key ? cache.get(key) : undefined
}

export function storeLinkedIcon(project: Project, spreadId: string, canvas: HTMLCanvasElement) {
  const key = linkedIconKey(project, spreadId)
  if (!key) return
  if (cache.size > 40) cache.clear()
  cache.set(key, canvas)
  listeners.forEach((l) => l())
}

export async function ensureLinkedIcon(project: Project, spreadId: string, render: Renderer | null = renderer) {
  const key = linkedIconKey(project, spreadId)
  if (!key || cache.has(key) || pending.has(key) || !render) return
  pending.add(key)
  try {
    storeLinkedIcon(project, spreadId, await render(project, spreadId))
  } catch (e) {
    console.warn('[linked icon]', e)
  } finally {
    pending.delete(key)
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useLinkedIcon(project: Project, assetId: string | undefined) {
  const spreadId = assetId ? linkedSpreadId(assetId) : undefined
  const img = useSyncExternalStore(subscribe, () => (spreadId ? getLinkedIcon(project, spreadId) : undefined))
  const key = spreadId ? linkedIconKey(project, spreadId) : undefined
  useEffect(() => {
    if (spreadId && key && !img) {
      const t = setTimeout(() => void ensureLinkedIcon(project, spreadId), 120)
      return () => clearTimeout(t)
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const exists = !!spreadId && project.spreads.some((s) => s.id === spreadId)
  return { isLinked: !!spreadId, img, exists }
}

export function collectLinkedIcons(project: Project): string[] {
  const ids = new Set<string>()
  const visit = (id?: string) => {
    const sid = id ? linkedSpreadId(id) : undefined
    if (sid) ids.add(sid)
  }
  const walk = (layers: Project['spreads'][number]['pages'][number]['layers']) =>
    layers.forEach((l) => {
      if (l.type === 'image') visit(l.assetId)
      if (l.type === 'group') walk(l.children)
    })
  project.spreads.forEach((s) => {
    walk(s.sharedLayers)
    s.pages.forEach((p) => walk(p.layers))
  })
  for (const t of Object.values(project.overrides ?? {})) for (const o of Object.values(t)) visit(o.assetId)
  return [...ids]
}
