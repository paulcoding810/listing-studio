import { useEffect, useRef, useState } from 'react'
import { renderPageCanvas } from '@/features/export/render'
import type { Project } from '@/types/project'

const cache = new Map<string, string>()

function pageKey(p: Project, spreadIdx: number, i: number, locale: string, width: number) {
  const s = p.spreads[spreadIdx]
  const page = s.pages[i]
  const usesShared = s.sharedLayers.length > 0 || (s.seamless && !page.background)
  return JSON.stringify([
    width,
    locale,
    p.theme,
    s.width,
    s.height,
    page.layers,
    page.background ?? s.background,
    s.seamless,
    usesShared ? [i, s.pages.length, s.sharedLayers] : 0,
    locale === p.locales[0] ? 0 : p.strings[locale],
  ])
}

export function usePageThumbs(project: Project | null, locale: string, width = 180) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const gen = useRef(0)
  useEffect(() => {
    if (!project) return
    const my = ++gen.current
    const t = setTimeout(async () => {
      const next: Record<string, string> = {}
      const jobs: Array<() => Promise<void>> = []
      project.spreads.forEach((s, si) =>
        s.pages.forEach((pg, i) => {
          const key = pageKey(project, si, i, locale, width)
          const hit = cache.get(key)
          if (hit) next[pg.id] = hit
          else
            jobs.push(async () => {
              const c = await renderPageCanvas(project, s.id, i, { pixelRatio: width / s.width, locale })
              const url = c.toDataURL('image/jpeg', 0.8)
              if (cache.size > 300) cache.clear()
              cache.set(key, url)
              next[pg.id] = url
            })
        }),
      )
      setThumbs((prev) => ({ ...prev, ...next }))
      for (const job of jobs) {
        if (gen.current !== my) return
        try {
          await job()
          setThumbs((prev) => ({ ...prev, ...next }))
        } catch (e) {
          console.warn('[thumbs]', e)
        }
      }
    }, 350)
    return () => clearTimeout(t)
  }, [project, locale, width])
  return thumbs
}
