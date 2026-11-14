import type Konva from 'konva'
import { useMemo } from 'react'
import { Circle, Group, Image as KImage, Rect, Shape, Text } from 'react-konva'
import { sourceSize, type ImageSource } from '@/lib/assets'
import { getFrame } from '@/frames'
import { renderDeviceCanvas, screenRectInLayer, DEVICE_PAD } from '@/features/device-paint'
import { isFlat, reflectionCanvas, warpPerspective } from '@/features/perspective'
import { konvaFill, primaryColor, resolveColor } from './fill'
import { placeImage, type ImagePlacement } from './image-math'
import { textFor, useRender, type SiblingMap } from './render-context'
import { useAsset } from './use-asset'
import type { DeviceLayer, GroupLayer, ImageLayer, Layer, Shadow, ShapeLayer, TextLayer, ZoomLayer } from '@/types/project'

export const shadowProps = (s?: Shadow) =>
  s?.enabled
    ? {
        shadowEnabled: true,
        shadowColor: s.color,
        shadowBlur: s.blur,
        shadowOffsetX: s.offsetX,
        shadowOffsetY: s.offsetY,
        shadowOpacity: s.opacity,
      }
    : { shadowEnabled: false }

export function nativeScale(ctx: Konva.Context, node: Konva.Node) {
  return node.getAbsoluteScale().x * (ctx.canvas?.getPixelRatio?.() ?? 1)
}

export function LayerNode({ layer, siblings, inGroup }: { layer: Layer; siblings: SiblingMap; inGroup?: boolean }) {
  const ctx = useRender()
  const selected = ctx.selected.has(layer.id)
  return (
    <Group
      id={layer.id}
      name={`layer-root type-${layer.type}${inGroup ? ' in-group' : ''}`}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      opacity={layer.opacity}
      visible={layer.visible}
      draggable={ctx.interactive && !layer.locked && (!inGroup || selected)}
      listening={ctx.interactive && !layer.locked}
      onDragMove={ctx.onDragMove}
      onDragEnd={ctx.onDragEnd}
    >
      <LayerContent layer={layer} siblings={siblings} />
    </Group>
  )
}

function LayerContent({ layer, siblings }: { layer: Layer; siblings: SiblingMap }) {
  switch (layer.type) {
    case 'text':
      return <TextContent l={layer} />
    case 'image':
      return <ImageContent l={layer} />
    case 'shape':
      return <ShapeContent l={layer} />
    case 'device':
      return <DeviceContent l={layer} />
    case 'zoom':
      return <ZoomContent l={layer} siblings={siblings} />
    case 'group':
      return <GroupContent l={layer} />
  }
}

function TextContent({ l }: { l: TextLayer }) {
  const ctx = useRender()
  const theme = ctx.project.theme
  return (
    <Text
      key={ctx.fontEpoch}
      text={textFor(ctx, l)}
      width={Math.max(1, l.width)}
      fontFamily={l.fontRef ? theme.fonts[l.fontRef] : l.fontFamily}
      fontSize={l.fontSize}
      fontStyle={`${l.italic ? 'italic ' : ''}${l.fontWeight}`}
      fill={resolveColor(theme, l.color, l.colorRef)}
      align={l.align}
      lineHeight={l.lineHeight}
      letterSpacing={l.letterSpacing}
      wrap="word"
      stroke={l.stroke?.width ? l.stroke.color : undefined}
      strokeWidth={l.stroke?.width ?? 0}
      fillAfterStrokeEnabled
      opacity={ctx.editingTextId === l.id ? 0 : 1}
      {...shadowProps(l.shadow)}
    />
  )
}

function ImageContent({ l }: { l: ImageLayer }) {
  const ctx = useRender()
  const img = useAsset(l.assetId)
  const p = useMemo(() => {
    if (!img) return undefined
    const s = sourceSize(img)
    return placeImage(l.fit, l.width, l.height, s.w, s.h, l.cropZoom, l.cropX, l.cropY)
  }, [img, l.fit, l.width, l.height, l.cropZoom, l.cropX, l.cropY])
  return (
    <>
      <Rect
        width={l.width}
        height={l.height}
        cornerRadius={l.cornerRadius}
        fill={!img && ctx.interactive ? '#2A2F3A' : 'rgba(0,0,0,0)'}
        stroke={!img && ctx.interactive ? '#4B5263' : undefined}
        dash={[12, 8]}
        strokeWidth={!img && ctx.interactive ? 2 : 0}
      />
      {img && p && (
        <KImage
          image={img as CanvasImageSource as HTMLImageElement}
          x={p.x}
          y={p.y}
          width={p.width}
          height={p.height}
          crop={p.crop}
          cornerRadius={l.cornerRadius}
          stroke={l.border?.width ? l.border.color : undefined}
          strokeWidth={l.border?.width ?? 0}
          {...shadowProps(l.shadow)}
        />
      )}
    </>
  )
}

function catmullRom(c: CanvasRenderingContext2D, pts: Array<[number, number]>, tension = 0.5) {
  const n = pts.length
  c.moveTo(pts[0][0], pts[0][1])
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const t = tension / 3
    c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t, p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t, p2[0], p2[1])
  }
  c.closePath()
}

export function shapePath(c: CanvasRenderingContext2D, l: ShapeLayer) {
  const { width: w, height: h } = l
  c.beginPath()
  const pts = (): Array<[number, number]> => {
    const p = l.points ?? []
    const out: Array<[number, number]> = []
    for (let i = 0; i < p.length; i += 2) out.push([p[i] * w, p[i + 1] * h])
    return out
  }
  switch (l.shape) {
    case 'rect':
      c.roundRect(0, 0, w, h, Math.max(0, Math.min(l.cornerRadius, w / 2, h / 2)))
      break
    case 'ellipse':
      c.ellipse(w / 2, h / 2, Math.max(0.5, w / 2), Math.max(0.5, h / 2), 0, 0, Math.PI * 2)
      break
    case 'arc': {
      const t = Math.min(w, h) * 0.16
      c.ellipse(w / 2, h / 2, Math.max(0.5, w / 2), Math.max(0.5, h / 2), 0, 0, Math.PI * 2)
      c.moveTo(w - t, h / 2)
      c.ellipse(w / 2, h / 2, Math.max(0.5, w / 2 - t), Math.max(0.5, h / 2 - t), 0, 0, Math.PI * 2, true)
      break
    }
    case 'line':
      c.moveTo(0, h / 2)
      c.lineTo(w, h / 2)
      break
    case 'blob':
      catmullRom(c, pts())
      break
    default: {
      const p = pts()
      p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
      c.closePath()
    }
  }
}

function ShapeContent({ l }: { l: ShapeLayer }) {
  const { project } = useRender()
  const theme = project.theme
  const isLine = l.shape === 'line'
  const fill = isLine ? {} : konvaFill(l.fill, l.width, l.height, theme)
  const stroke = isLine ? primaryColor(l.fill, theme) : l.stroke?.width ? l.stroke.color : undefined
  const strokeWidth = isLine ? Math.max(1, l.height) : (l.stroke?.width ?? 0)
  return (
    <Shape
      width={l.width}
      height={l.height}
      {...fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      dash={l.stroke?.dash ? [l.stroke.dash, l.stroke.dash] : undefined}
      lineCap="round"
      lineJoin="round"
      {...shadowProps(l.shadow)}
      sceneFunc={(ctx, shape) => {
        const n = ctx._context
        if (l.blur) n.filter = `blur(${l.blur * nativeScale(ctx, shape)}px)`
        shapePath(n, l)
        ctx.fillStrokeShape(shape)
        if (l.blur) n.filter = 'none'
      }}
      hitFunc={(ctx, shape) => {
        shapePath(ctx._context, l)
        ctx.fillStrokeShape(shape)
      }}
    />
  )
}

function DeviceContent({ l }: { l: DeviceLayer }) {
  const ctx = useRender()
  const screen = useAsset(l.screenAssetId)
  const frame = getFrame(l.frameId)
  const fw = frame.w + DEVICE_PAD * 2
  const fh = frame.h + DEVICE_PAD * 2
  const scale = Math.min((ctx.renderScale * l.width) / fw, 2800 / Math.max(fw, fh))
  const { rotateX, rotateY, depth } = l.perspective
  const canvas = useMemo(() => {
    const base = renderDeviceCanvas(frame, { frameColor: l.frameColor, screen, screenFit: l.screenFit, screenColor: l.screenColor }, scale)
    if (isFlat({ preset: 'custom', rotateX, rotateY, depth })) return base
    return warpPerspective(base, { preset: 'custom', rotateX, rotateY, depth }, base.width, base.height)
  }, [frame, l.frameColor, screen, l.screenFit, l.screenColor, scale, rotateX, rotateY, depth])
  const hasRefl = l.reflection > 0
  const refl = useMemo(() => (hasRefl ? reflectionCanvas(canvas) : null), [canvas, hasRefl])
  return (
    <>
      <KImage image={canvas} width={l.width} height={l.height} {...shadowProps(l.shadow)} />
      {refl && (
        <Shape
          listening={false}
          sceneFunc={(c) => {
            const n = c._context
            n.save()
            n.globalAlpha *= l.reflection
            n.drawImage(refl, 0, l.height + 2, l.width, (l.width * refl.height) / refl.width)
            n.restore()
          }}
        />
      )}
    </>
  )
}

export interface SourceGeometry {
  img?: ImageSource
  box: { x: number; y: number; w: number; h: number }
  placement?: ImagePlacement
}

function useSourceGeometry(src: Layer | undefined): SourceGeometry | undefined {
  const assetId = src?.type === 'image' ? src.assetId : src?.type === 'device' ? src.screenAssetId : undefined
  const img = useAsset(assetId)
  if (!src || (src.type !== 'image' && src.type !== 'device')) return undefined
  if (src.type === 'image') {
    const box = { x: src.x, y: src.y, w: src.width, h: src.height }
    if (!img) return { box }
    const s = sourceSize(img)
    return { img, box, placement: placeImage(src.fit, box.w, box.h, s.w, s.h, src.cropZoom, src.cropX, src.cropY) }
  }
  const sr = screenRectInLayer(getFrame(src.frameId), src.width, src.height)
  const box = { x: src.x + sr.x, y: src.y + sr.y, w: sr.w, h: sr.h }
  if (!img) return { box }
  const s = sourceSize(img)
  return { img, box, placement: placeImage(src.screenFit, box.w, box.h, s.w, s.h) }
}

function ZoomContent({ l, siblings }: { l: ZoomLayer; siblings: SiblingMap }) {
  const ctx = useRender()
  const geo = useSourceGeometry(l.sourceId ? siblings.get(l.sourceId) : undefined)
  const d = l.width
  const r = d / 2
  const fx = geo ? geo.box.x + geo.box.w * l.focusX : l.x + r
  const fy = geo ? geo.box.y + geo.box.h * l.focusY : l.y + d + 80
  let content: React.ReactNode = null
  if (geo?.img && geo.placement) {
    const ip = geo.placement.toImage(geo.box.w * l.focusX, geo.box.h * l.focusY)
    const S = geo.placement.scale * l.zoom
    const s = sourceSize(geo.img)
    content = (
      <KImage
        image={geo.img as HTMLImageElement}
        x={r - ip.x * S}
        y={r - ip.y * S}
        width={s.w * S}
        height={s.h * S}
        listening={false}
      />
    )
  }
  const sourceR = r / l.zoom
  return (
    <>
      {l.connector && geo && (
        <Shape
          name="zoom-connector"
          listening={false}
          pfx={fx}
          pfy={fy}
          sceneFunc={(c, shape) => {
            const parent = shape.getParent()
            if (!parent) return
            const px = (shape.getAttr('pfx') as number) - parent.x()
            const py = (shape.getAttr('pfy') as number) - parent.y()
            const n = c._context
            const dx = r - px
            const dy = r - py
            const dist = Math.hypot(dx, dy)
            n.save()
            n.strokeStyle = l.connectorColor
            n.lineWidth = Math.max(2, l.borderWidth / 2.5)
            n.shadowColor = 'rgba(0,0,0,0.25)'
            n.shadowBlur = 8
            n.beginPath()
            n.arc(px, py, sourceR, 0, Math.PI * 2)
            n.stroke()
            if (dist > r + sourceR) {
              const ux = dx / dist
              const uy = dy / dist
              n.beginPath()
              n.moveTo(px + ux * sourceR, py + uy * sourceR)
              n.lineTo(r - ux * r, r - uy * r)
              n.stroke()
            }
            n.restore()
          }}
        />
      )}
      <Circle x={r} y={r} radius={r} fill={l.borderColor} {...shadowProps(l.shadow)} />
      <Group clipFunc={(c) => c.arc(r, r, Math.max(0, r - l.borderWidth), 0, Math.PI * 2)}>
        <Circle x={r} y={r} radius={r} fill="#0F1115" />
        {content}
        {!content && ctx.interactive && (
          <Text x={0} y={r - 14} width={d} align="center" text="Pick a source" fill="#94A3B8" fontSize={Math.max(14, d / 14)} fontFamily="Inter" />
        )}
      </Group>
      <Rect width={d} height={d} fill="rgba(0,0,0,0)" />
    </>
  )
}

function GroupContent({ l }: { l: GroupLayer }) {
  const siblings = useMemo(() => new Map(l.children.map((c) => [c.id, c])), [l.children])
  return (
    <>
      {l.children.map((c) => (
        <LayerNode key={c.id} layer={c} siblings={siblings} inGroup />
      ))}
    </>
  )
}
