import type Konva from 'konva'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Layer as KLayer, Stage } from 'react-konva'
import { preloadAssets } from '@/lib/assets'
import { collectAssetIds } from '@/lib/doc'
import { ensureProjectFonts, useFonts } from '@/lib/fonts'
import { PageScene } from '@/features/canvas/page-content'
import { RenderContext, type RenderCtx } from '@/features/canvas/render-context'
import type { Project } from '@/types/project'

export interface RenderOptions {
  pixelRatio?: number
  locale?: string
  background?: string
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job)
  queue = run.catch(() => undefined)
  return run
}

export async function prepareProject(project: Project) {
  await Promise.all([preloadAssets(collectAssetIds(project)), ensureProjectFonts(project)])
}

export function renderPageCanvas(project: Project, spreadId: string, pageIndex: number, opts: RenderOptions = {}): Promise<HTMLCanvasElement> {
  return enqueue(async () => {
    const spread = project.spreads.find((s) => s.id === spreadId)
    if (!spread || !spread.pages[pageIndex]) throw new Error('Page not found')
    await prepareProject(project)
    const pixelRatio = opts.pixelRatio ?? 1
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;opacity:0'
    document.body.appendChild(host)
    const root = createRoot(host)
    let stage: Konva.Stage | null = null
    const ctx: RenderCtx = {
      project,
      locale: opts.locale ?? project.locales[0],
      renderScale: Math.min(2, pixelRatio),
      interactive: false,
      selected: new Set(),
      editingTextId: null,
      fontEpoch: useFonts.getState().epoch,
    }
    try {
      flushSync(() =>
        root.render(
          <Stage ref={(s) => void (stage = s)} width={spread.width} height={spread.height} listening={false}>
            <KLayer listening={false}>
              <RenderContext.Provider value={ctx}>
                <PageScene spread={spread} index={pageIndex} />
              </RenderContext.Provider>
            </KLayer>
          </Stage>,
        ),
      )
      for (let i = 0; i < 20 && !(stage as Konva.Stage | null)?.getLayers()[0]?.hasChildren(); i++) await nextFrame()
      const st = stage as Konva.Stage | null
      if (!st) throw new Error('Renderer failed to mount')
      const out = st.toCanvas({ pixelRatio })
      if (!opts.background) return out
      const flat = document.createElement('canvas')
      flat.width = out.width
      flat.height = out.height
      const fctx = flat.getContext('2d')!
      fctx.fillStyle = opts.background
      fctx.fillRect(0, 0, flat.width, flat.height)
      fctx.drawImage(out, 0, 0)
      return flat
    } finally {
      root.unmount()
      host.remove()
    }
  })
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: 'png' | 'jpg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed'))), format === 'png' ? 'image/png' : 'image/jpeg', quality),
  )
}

export async function renderThumbnail(project: Project, spreadId: string, pageIndex: number, width = 240): Promise<Blob> {
  const spread = project.spreads.find((s) => s.id === spreadId)!
  const canvas = await renderPageCanvas(project, spreadId, pageIndex, { pixelRatio: width / spread.width })
  return canvasToBlob(canvas, 'jpg', 0.82)
}

export function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false
  const { width: w, height: h } = canvas
  const step = Math.max(1, Math.floor(Math.min(w, h) / 64))
  const data = ctx.getImageData(0, 0, w, h).data
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] < 255) return true
  return false
}
