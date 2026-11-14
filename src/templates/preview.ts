import { useEffect, useState } from 'react'
import { renderPageCanvas } from '@/features/export/render'
import { projectFromTemplate, type TemplateDef } from './builder'

const cache = new Map<string, Promise<string[]>>()

export function templatePreview(t: TemplateDef, max = 3, height = 300): Promise<string[]> {
  const key = `${t.id}|${max}|${height}`
  let p = cache.get(key)
  if (!p) {
    p = (async () => {
      const project = projectFromTemplate(t)
      const out: string[] = []
      for (const spread of project.spreads) {
        for (let i = 0; i < spread.pages.length && out.length < max; i++) {
          const c = await renderPageCanvas(project, spread.id, i, { pixelRatio: height / spread.height })
          out.push(c.toDataURL('image/jpeg', 0.85))
        }
      }
      return out
    })()
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return p
}

export function useTemplatePreview(t: TemplateDef | undefined, max = 3, height = 300) {
  const [urls, setUrls] = useState<string[] | null>(null)
  useEffect(() => {
    if (!t) return
    let live = true
    templatePreview(t, max, height).then((u) => live && setUrls(u)).catch(() => live && setUrls([]))
    return () => {
      live = false
    }
  }, [t, max, height])
  return urls
}
