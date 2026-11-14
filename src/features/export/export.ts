import JSZip from 'jszip'
import { getStore, getTarget } from '@/targets'
import { downloadBlob, slugify } from '@/lib/utils'
import { validateOutput, type Issue } from '@/lib/validation'
import type { Project } from '@/types/project'
import { composeVariant, getIconVariant } from '@/features/icons'
import { encodeRgbPng } from '@/lib/png'
import { canvasToBlob, hasTransparency, renderPageCanvas } from './render'

export interface ExportJob {
  spreadId: string
  pageIndex: number
  locale: string
  variantId?: string
}

export interface ExportOptions {
  format: 'png' | 'jpg'
  quality: number
  scale: number
  naming: string
  profile: 'zip' | 'fastlane'
  roundBrowserIcons?: boolean
}

export interface ExportedFile {
  path: string
  blob: Blob
  width: number
  height: number
  issues: Issue[]
}

export function fileName(project: Project, job: ExportJob, opts: ExportOptions) {
  const spread = project.spreads.find((s) => s.id === job.spreadId)!
  const page = spread.pages[job.pageIndex]
  const t = getTarget(spread.targetId)
  const variant = job.variantId ? getIconVariant(job.variantId) : undefined
  if (variant) {
    const raw = opts.profile === 'fastlane' && variant.fastlanePath ? variant.fastlanePath.replace('{locale}', job.locale) : variant.path
    return spread.pages.length > 1 ? raw.replace(/(\.png)$/, `-${job.pageIndex + 1}$1`) : raw
  }
  const multiLocale = project.locales.length > 1
  const ext = opts.format
  const name = opts.naming
    .replace(/\{index\}/g, String(job.pageIndex + 1).padStart(2, '0'))
    .replace(/\{page\}/g, slugify(page.name))
    .replace(/\{project\}/g, slugify(project.name))
    .replace(/\{store\}/g, t.store)
    .replace(/\{set\}/g, slugify(t.label))
    .replace(/\{locale\}/g, job.locale)
    .replace(/\{w\}/g, String(Math.round(spread.width * opts.scale)))
    .replace(/\{h\}/g, String(Math.round(spread.height * opts.scale)))
  if (opts.profile === 'fastlane' && t.fastlaneDir) {
    const dir = t.fastlaneDir.replace('{locale}', job.locale)
    if (/\/(featureGraphic|icon)$/.test(dir)) return `${dir}.${ext}`
    return `${dir}/${name}.${ext}`
  }
  const set = project.spreads.filter((s) => s.targetId === spread.targetId).length > 1 ? `${slugify(t.label)}-${project.spreads.indexOf(spread) + 1}` : slugify(t.label)
  return [t.store === 'custom' ? 'custom' : slugify(getStore(t.store).name), set, multiLocale ? job.locale : '', `${name}.${ext}`].filter(Boolean).join('/')
}

export async function exportImages(project: Project, jobs: ExportJob[], opts: ExportOptions, onProgress?: (done: number, total: number) => void): Promise<ExportedFile[]> {
  const out: ExportedFile[] = []
  let done = 0
  for (const job of jobs) {
    const spread = project.spreads.find((s) => s.id === job.spreadId)!
    const variant = job.variantId ? getIconVariant(job.variantId) : undefined
    if (variant) {
      const inner = variant.size - Math.round(variant.size * variant.pad) * 2
      const src = await renderPageCanvas(project, job.spreadId, job.pageIndex, { pixelRatio: inner / spread.width, locale: job.locale })
      const final = composeVariant(src, variant, opts.roundBrowserIcons !== false)
      const blob = variant.flatten ? await encodeRgbPng(final) : await canvasToBlob(final, 'png')
      const vt = variant.targetId ? getTarget(variant.targetId) : undefined
      out.push({
        path: fileName(project, job, opts),
        blob,
        width: final.width,
        height: final.height,
        issues: vt ? validateOutput(vt, { width: final.width, height: final.height, format: 'png', hasAlpha: variant.flatten ? false : hasTransparency(final), bytes: blob.size }) : [],
      })
      onProgress?.(++done, jobs.length)
      continue
    }
    const t = getTarget(spread.targetId)
    const flatten = opts.format === 'jpg' || t.alpha === 'forbidden'
    const canvas = await renderPageCanvas(project, job.spreadId, job.pageIndex, { pixelRatio: opts.scale, locale: job.locale })
    const alpha = !flatten && opts.format === 'png' ? hasTransparency(canvas) : false
    let final = canvas
    if (flatten) {
      final = document.createElement('canvas')
      final.width = canvas.width
      final.height = canvas.height
      const c = final.getContext('2d')!
      c.fillStyle = '#FFFFFF'
      c.fillRect(0, 0, final.width, final.height)
      c.drawImage(canvas, 0, 0)
    }
    const blob = flatten && opts.format === 'png' ? await encodeRgbPng(final) : await canvasToBlob(final, opts.format, opts.quality)
    out.push({
      path: fileName(project, job, opts),
      blob,
      width: final.width,
      height: final.height,
      issues: validateOutput(t, { width: final.width, height: final.height, format: opts.format, hasAlpha: t.alpha === 'forbidden' ? false : alpha, bytes: blob.size }).filter(
        (i) => !(t.alpha === 'required' && i.message.includes('Transparency')),
      ),
    })
    onProgress?.(++done, jobs.length)
  }
  return out
}

export async function deliver(project: Project, files: ExportedFile[]) {
  if (files.length === 1) {
    downloadBlob(files[0].blob, files[0].path.split('/').pop()!)
    return
  }
  const zip = new JSZip()
  const seen = new Map<string, number>()
  for (const f of files) {
    let p = f.path
    const n = seen.get(p) ?? 0
    if (n) p = p.replace(/(\.\w+)$/, `-${n + 1}$1`)
    seen.set(f.path, n + 1)
    zip.file(p, f.blob)
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  downloadBlob(blob, `${slugify(project.name)}-listing.zip`)
}
