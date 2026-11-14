import JSZip from 'jszip'
import { assetsDb, projectsDb } from '@/lib/db'
import { collectAssetIds, cloneProject } from '@/lib/doc'
import { downloadBlob, slugify } from '@/lib/utils'
import { isDemoAsset } from '@/demo/screens'
import type { AssetRecord, Project } from '@/types/project'

const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg' }

export async function exportBackup(projectId: string) {
  const p = await projectsDb.get(projectId)
  if (!p) throw new Error('Project not found')
  const zip = new JSZip()
  const assets: Array<Omit<AssetRecord, 'blob'> & { file: string }> = []
  for (const id of collectAssetIds(p)) {
    if (isDemoAsset(id)) continue
    const a = await assetsDb.get(id)
    if (!a) continue
    const file = `assets/${a.id}.${EXT[a.mime] ?? 'bin'}`
    zip.file(file, a.blob)
    const { blob: _blob, ...meta } = a
    void _blob
    assets.push({ ...meta, file })
  }
  zip.file('project.json', JSON.stringify({ format: 'listing-studio', version: 1, project: p, assets }, null, 2))
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, `${slugify(p.name)}.listingstudio.zip`)
}

export async function importBackup(file: File): Promise<Project> {
  const zip = await JSZip.loadAsync(file)
  const json = zip.file('project.json')
  if (!json) throw new Error('This file is not a Listing Studio backup.')
  const data = JSON.parse(await json.async('string')) as {
    format?: string
    project: Project
    assets: Array<Omit<AssetRecord, 'blob'> & { file: string }>
  }
  if (data.format !== 'listing-studio' || !data.project?.spreads) throw new Error('Unsupported backup format.')
  for (const a of data.assets ?? []) {
    if (await assetsDb.get(a.id)) continue
    const entry = zip.file(a.file)
    if (!entry) continue
    const raw = await entry.async('blob')
    const { file: _f, ...meta } = a
    void _f
    await assetsDb.put({ ...meta, blob: new Blob([raw], { type: a.mime }) })
  }
  const project = cloneProject(data.project, data.project.name)
  await projectsDb.put(project)
  return project
}
