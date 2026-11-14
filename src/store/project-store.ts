import { create } from 'zustand'
import { cloneProject, totalPages } from '@/lib/doc'
import { brandKitsDb, projectsDb, thumbsDb } from '@/lib/db'
import type { BrandKit, Project, ProjectSummary } from '@/types/project'

const summarize = (p: Project): ProjectSummary => ({
  id: p.id,
  name: p.name,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  pageCount: totalPages(p),
  targets: [...new Set(p.spreads.map((s) => s.targetId))],
})

interface ProjectsState {
  loaded: boolean
  projects: ProjectSummary[]
  thumbs: Record<string, string>
  brandKits: BrandKit[]
  refresh: () => Promise<void>
  create: (p: Project) => Promise<Project>
  rename: (id: string, name: string) => Promise<void>
  duplicate: (id: string) => Promise<Project | undefined>
  remove: (id: string) => Promise<void>
  setThumb: (id: string, blob: Blob) => void
  upsertSummary: (p: Project) => void
  saveKit: (k: BrandKit) => Promise<void>
  deleteKit: (id: string) => Promise<void>
}

export const useProjects = create<ProjectsState>((set, get) => ({
  loaded: false,
  projects: [],
  thumbs: {},
  brandKits: [],
  refresh: async () => {
    const [all, kits] = await Promise.all([projectsDb.all(), brandKitsDb.all()])
    const thumbs: Record<string, string> = { ...get().thumbs }
    await Promise.all(
      all.map(async (p) => {
        if (thumbs[p.id]) return
        const t = await thumbsDb.get(p.id)
        if (t) thumbs[p.id] = URL.createObjectURL(t.blob)
      }),
    )
    set({
      loaded: true,
      projects: all.map(summarize).sort((a, b) => b.updatedAt - a.updatedAt),
      thumbs,
      brandKits: kits.sort((a, b) => b.updatedAt - a.updatedAt),
    })
  },
  create: async (p) => {
    await projectsDb.put(p)
    get().upsertSummary(p)
    return p
  },
  rename: async (id, name) => {
    const p = await projectsDb.get(id)
    if (!p) return
    p.name = name.trim() || p.name
    p.updatedAt = Date.now()
    await projectsDb.put(p)
    get().upsertSummary(p)
  },
  duplicate: async (id) => {
    const p = await projectsDb.get(id)
    if (!p) return undefined
    const copy = cloneProject(p, `${p.name} copy`)
    await projectsDb.put(copy)
    const t = await thumbsDb.get(id)
    if (t) {
      await thumbsDb.put(copy.id, t.blob)
      set((s) => ({ thumbs: { ...s.thumbs, [copy.id]: URL.createObjectURL(t.blob) } }))
    }
    get().upsertSummary(copy)
    return copy
  },
  remove: async (id) => {
    await projectsDb.delete(id)
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
  },
  setThumb: (id, blob) => {
    const prev = get().thumbs[id]
    if (prev) URL.revokeObjectURL(prev)
    set((s) => ({ thumbs: { ...s.thumbs, [id]: URL.createObjectURL(blob) } }))
  },
  upsertSummary: (p) =>
    set((s) => ({
      projects: [summarize(p), ...s.projects.filter((x) => x.id !== p.id)].sort((a, b) => b.updatedAt - a.updatedAt),
    })),
  saveKit: async (k) => {
    await brandKitsDb.put(k)
    set((s) => ({ brandKits: [k, ...s.brandKits.filter((x) => x.id !== k.id)] }))
  },
  deleteKit: async (id) => {
    await brandKitsDb.delete(id)
    set((s) => ({ brandKits: s.brandKits.filter((k) => k.id !== id) }))
  },
}))
