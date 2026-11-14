import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AssetRecord, BrandKit, Project } from '@/types/project'

interface StudioDB extends DBSchema {
  projects: { key: string; value: Project; indexes: { updatedAt: number } }
  assets: { key: string; value: AssetRecord; indexes: { kind: string } }
  thumbnails: { key: string; value: { id: string; blob: Blob; updatedAt: number } }
  brandKits: { key: string; value: BrandKit }
  settings: { key: string; value: unknown }
}

let dbPromise: Promise<IDBPDatabase<StudioDB>> | null = null

export function db() {
  dbPromise ??= openDB<StudioDB>('listing-studio', 1, {
    upgrade(d) {
      d.createObjectStore('projects', { keyPath: 'id' }).createIndex('updatedAt', 'updatedAt')
      d.createObjectStore('assets', { keyPath: 'id' }).createIndex('kind', 'kind')
      d.createObjectStore('thumbnails', { keyPath: 'id' })
      d.createObjectStore('brandKits', { keyPath: 'id' })
      d.createObjectStore('settings')
    },
  })
  return dbPromise
}

export const projectsDb = {
  async all() {
    return (await db()).getAll('projects')
  },
  async get(id: string) {
    return (await db()).get('projects', id)
  },
  async put(p: Project) {
    await (await db()).put('projects', p)
  },
  async delete(id: string) {
    const d = await db()
    const tx = d.transaction(['projects', 'thumbnails'], 'readwrite')
    await Promise.all([tx.objectStore('projects').delete(id), tx.objectStore('thumbnails').delete(id), tx.done])
  },
}

export const assetsDb = {
  async get(id: string) {
    return (await db()).get('assets', id)
  },
  async put(a: AssetRecord) {
    await (await db()).put('assets', a)
  },
  async byKind(kind: AssetRecord['kind']) {
    return (await db()).getAllFromIndex('assets', 'kind', kind)
  },
  async delete(id: string) {
    await (await db()).delete('assets', id)
  },
}

export const thumbsDb = {
  async get(id: string) {
    return (await db()).get('thumbnails', id)
  },
  async put(id: string, blob: Blob) {
    await (await db()).put('thumbnails', { id, blob, updatedAt: Date.now() })
  },
}

export const brandKitsDb = {
  async all() {
    return (await db()).getAll('brandKits')
  },
  async put(k: BrandKit) {
    await (await db()).put('brandKits', k)
  },
  async delete(id: string) {
    await (await db()).delete('brandKits', id)
  },
}

export const settingsDb = {
  async get<T>(key: string): Promise<T | undefined> {
    return (await (await db()).get('settings', key)) as T | undefined
  },
  async set(key: string, value: unknown) {
    await (await db()).put('settings', value, key)
  },
}

export async function clearAllData() {
  const d = await db()
  await Promise.all(
    (['projects', 'assets', 'thumbnails', 'brandKits', 'settings'] as const).map((s) => d.clear(s)),
  )
}
