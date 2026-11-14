import { Shape } from 'react-konva'
import { canvasFill } from './fill'
import { nativeScale } from './nodes'
import { useRender } from './render-context'
import { useAsset } from './use-asset'
import { drawFitted } from '@/features/device-paint'
import type { Background } from '@/types/project'

function drawPattern(n: CanvasRenderingContext2D, p: NonNullable<Background['pattern']>, w: number, h: number) {
  if (p.kind === 'none') return
  n.save()
  n.globalAlpha *= p.opacity
  n.fillStyle = p.color
  n.strokeStyle = p.color
  const s = Math.max(4, p.size)
  if (p.kind === 'dots') {
    for (let y = s / 2; y < h; y += s) for (let x = s / 2; x < w; x += s) {
      n.beginPath()
      n.arc(x, y, Math.max(1, s * 0.09), 0, Math.PI * 2)
      n.fill()
    }
  } else if (p.kind === 'grid') {
    n.lineWidth = Math.max(1, s * 0.03)
    n.beginPath()
    for (let x = 0; x <= w; x += s) {
      n.moveTo(x, 0)
      n.lineTo(x, h)
    }
    for (let y = 0; y <= h; y += s) {
      n.moveTo(0, y)
      n.lineTo(w, y)
    }
    n.stroke()
  } else if (p.kind === 'diagonal') {
    n.lineWidth = Math.max(1, s * 0.12)
    n.beginPath()
    for (let x = -h; x < w; x += s) {
      n.moveTo(x, h)
      n.lineTo(x + h, 0)
    }
    n.stroke()
  } else if (p.kind === 'waves') {
    n.lineWidth = Math.max(1, s * 0.06)
    for (let y = 0; y < h + s; y += s) {
      n.beginPath()
      for (let x = 0; x <= w; x += 8) n.lineTo(x, y + Math.sin((x / s) * Math.PI) * s * 0.25)
      n.stroke()
    }
  } else if (p.kind === 'noise') {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const count = Math.min(60000, Math.round((w * h) / (s * s) * 6))
    for (let i = 0; i < count; i++) n.fillRect(rnd() * w, rnd() * h, s * 0.12, s * 0.12)
  }
  n.restore()
}

interface Props {
  bg: Background
  x?: number
  width: number
  height: number
  offsetX?: number
  totalWidth: number
  pageId?: string
}

export function BackgroundNode({ bg, x = 0, width, height, offsetX = 0, totalWidth, pageId }: Props) {
  const { project } = useRender()
  const img = useAsset(bg.image?.assetId)
  return (
    <Shape
      name="background"
      pageId={pageId}
      x={x}
      width={width}
      height={height}
      fill="#000"
      sceneFunc={(ctx, shape) => {
        const n = ctx._context
        n.save()
        n.beginPath()
        n.rect(0, 0, width, height)
        n.clip()
        n.translate(-offsetX, 0)
        n.fillStyle = canvasFill(n, bg.fill, totalWidth, height, project.theme)
        n.fillRect(0, 0, totalWidth, height)
        if (img && bg.image) {
          n.save()
          n.globalAlpha *= bg.image.opacity
          if (bg.image.blur) n.filter = `blur(${bg.image.blur * nativeScale(ctx, shape)}px)`
          const bleed = bg.image.blur ? bg.image.blur * 2 : 0
          drawFitted(n, img, -bleed, -bleed, totalWidth + bleed * 2, height + bleed * 2, bg.image.fit)
          n.restore()
        }
        if (bg.pattern && bg.pattern.kind !== 'none') drawPattern(n, bg.pattern, totalWidth, height)
        n.restore()
      }}
      hitFunc={(ctx, shape) => {
        ctx.beginPath()
        ctx.rect(0, 0, width, height)
        ctx.fillStrokeShape(shape)
      }}
    />
  )
}
