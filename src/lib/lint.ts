import { isLinkedIcon, localizedLayer, walkLayers } from '@/lib/doc'
import { PLACEHOLDER_TEXTS } from '@/lib/factory'
import { getTarget } from '@/targets'
import type { Layer, Project } from '@/types/project'

export interface ContentWarning {
  spreadId: string
  pageId: string
  pageIndex: number
  layerId?: string
  locale?: string
  message: string
}

const PLACEHOLDERS = new Set(PLACEHOLDER_TEXTS.map((t) => t.toLowerCase()))

/** Flags unfinished content: empty frames, placeholder text, missing translations and broken icon links. */
export function lintProject(project: Project, pages?: Set<string>, locales: string[] = project.locales): ContentWarning[] {
  const out: ContentWarning[] = []
  const def = project.locales[0]
  const spreadIds = new Set(project.spreads.map((s) => s.id))
  for (const spread of project.spreads) {
    if (getTarget(spread.targetId).kind === 'icon') continue
    spread.pages.forEach((page, pageIndex) => {
      if (pages && !pages.has(page.id)) return
      const base = { spreadId: spread.id, pageId: page.id, pageIndex }
      const visit = (raw: Layer) => {
        if (!raw.visible) return
        for (const locale of locales) {
          const l = localizedLayer(project, locale, raw)
          const tag = locale === def ? '' : ` (${locale})`
          if (l.type === 'device' && !l.screenAssetId) {
            out.push({ ...base, layerId: l.id, locale, message: `“${l.name}” has no screenshot${tag}` })
            if (locale === def) break
          }
          if (l.type === 'image' && isLinkedIcon(l.assetId) && !spreadIds.has(l.assetId.slice(5))) {
            out.push({ ...base, layerId: l.id, message: 'Linked app icon set was deleted' })
            break
          }
          if (l.type === 'text') {
            const translated = locale !== def && l.localizable ? project.strings[locale]?.[l.id] : undefined
            const text = (translated || l.text).trim()
            if (PLACEHOLDERS.has(text.toLowerCase())) {
              out.push({ ...base, layerId: l.id, locale, message: `Placeholder text “${text}”${tag}` })
              break
            }
            if (locale !== def && l.localizable && l.text.trim() && !translated)
              out.push({ ...base, layerId: l.id, locale, message: `“${l.text.split('\n')[0].slice(0, 32)}” is not translated (${locale})` })
          }
        }
      }
      walkLayers(page.layers, (l) => l.type !== 'group' && visit(l))
    })
  }
  return dedupe(out)
}

function dedupe(list: ContentWarning[]) {
  const seen = new Set<string>()
  return list.filter((w) => {
    const k = `${w.pageId}|${w.message}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
