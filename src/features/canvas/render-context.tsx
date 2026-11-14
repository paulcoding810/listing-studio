import type Konva from 'konva'
import { createContext, useContext } from 'react'
import type { Layer, Project, TextLayer } from '@/types/project'

export interface RenderCtx {
  project: Project
  locale: string
  renderScale: number
  interactive: boolean
  selected: ReadonlySet<string>
  editingTextId: string | null
  fontEpoch: number
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void
}

export const RenderContext = createContext<RenderCtx | null>(null)

export function useRender(): RenderCtx {
  const c = useContext(RenderContext)
  if (!c) throw new Error('RenderContext missing')
  return c
}

export function textFor(ctx: Pick<RenderCtx, 'project' | 'locale'>, l: TextLayer): string {
  const locale = ctx.project.locales.includes(ctx.locale) ? ctx.locale : ctx.project.locales[0]
  const translated = locale !== ctx.project.locales[0] && l.localizable ? ctx.project.strings[locale]?.[l.id] : undefined
  const raw = translated || l.text
  return l.uppercase ? raw.toUpperCase() : raw
}

export function bucketScale(x: number) {
  const b = Math.pow(2, Math.ceil(Math.log2(Math.max(0.0625, x)) * 2) / 2)
  return Math.min(2, Math.max(0.25, b))
}

export type SiblingMap = ReadonlyMap<string, Layer>
