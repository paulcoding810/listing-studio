import Konva from 'konva'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Group, Layer as KLayer, Rect, Shape, Stage, Text, Transformer } from 'react-konva'
import { BackgroundNode } from '@/features/canvas/background'
import { LayerList, PageBackground, PageScene } from '@/features/canvas/page-content'
import { RenderContext, bucketScale, type RenderCtx } from '@/features/canvas/render-context'
import { stageRegistry } from '@/features/canvas/stage-registry'
import { addImage, setDeviceScreen, uploadImages } from '@/features/editor-actions'
import { findLayer, locatePage, scaleLayer } from '@/lib/doc'
import { useFonts } from '@/lib/fonts'
import { maskPath } from '@/features/icons'
import { getTarget } from '@/targets'
import { useEditor } from '@/store/editor-store'
import type { Layer, Spread } from '@/types/project'
import { CanvasContextMenu } from './CanvasContextMenu'
import { TextEditOverlay } from './TextEditOverlay'

const ACCENT = '#8B5CF6'
const SNAP = 6

type Box = { x: number; y: number; width: number; height: number }

function layerRootOf(target: Konva.Node, stage: Konva.Stage, selected: string[]): Konva.Node | null {
  let n: Konva.Node | null = target
  let outer: Konva.Node | null = null
  while (n && n !== stage) {
    if (n.hasName('layer-root')) {
      if (selected.includes(n.id())) return n
      outer = n
    }
    n = n.getParent()
  }
  return outer
}

function innermostRoot(target: Konva.Node, stage: Konva.Stage): Konva.Node | null {
  let n: Konva.Node | null = target
  while (n && n !== stage) {
    if (n.hasName('layer-root')) return n
    n = n.getParent()
  }
  return null
}

function containerPageId(node: Konva.Node): string | undefined {
  let n: Konva.Node | null = node.getParent()
  while (n) {
    const id = n.getAttr('pageId') as string | undefined
    if (id) return id
    n = n.getParent()
  }
  return undefined
}

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const guidesRef = useRef<Konva.Group>(null)
  const hoverRef = useRef<Konva.Rect>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [marquee, setMarquee] = useState<Box | null>(null)
  const [space, setSpace] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [dropping, setDropping] = useState(false)

  const project = useEditor((s) => s.project)
  const activePageId = useEditor((s) => s.activePageId)
  const selectedIds = useEditor((s) => s.selectedIds)
  const viewMode = useEditor((s) => s.viewMode)
  const zoom = useEditor((s) => s.zoom)
  const pan = useEditor((s) => s.pan)
  const showGrid = useEditor((s) => s.showGrid)
  const locale = useEditor((s) => s.activeLocale)
  const editingTextId = useEditor((s) => s.editingTextId)
  const fontEpoch = useFonts((s) => s.epoch)
  const iconMask = useEditor((s) => s.iconMask)

  const loc = project && activePageId ? locatePage(project, activePageId) : undefined
  const spread = loc?.spread
  const pageIndex = loc?.index ?? 0
  const spreadMode = viewMode === 'spread' && !!spread && spread.pages.length > 1
  const contentW = spread ? (spreadMode ? spread.width * spread.pages.length : spread.width) : 1
  const contentH = spread?.height ?? 1

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const fit = useCallback(() => {
    if (!size.w || !size.h) return
    const pad = spreadMode ? 120 : 80
    const z = Math.max(0.03, Math.min((size.w - pad) / contentW, (size.h - pad) / contentH, 2))
    useEditor.getState().setZoom(z, { x: (size.w - contentW * z) / 2, y: (size.h - contentH * z) / 2 })
  }, [size.w, size.h, contentW, contentH, spreadMode])

  useEffect(() => {
    stageRegistry.setFit(fit)
    return () => stageRegistry.setFit(null)
  }, [fit])

  const fitKey = `${spread?.id}|${spread?.width}x${spread?.height}|${spreadMode}|${spreadMode ? spread?.pages.length : 0}|${size.w > 0}`
  useEffect(() => {
    fit()
  }, [fitKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    stageRegistry.set(stageRef.current)
    return () => stageRegistry.set(null)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setSpace(true)
      }
    }
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpace(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const ctx: RenderCtx | null = useMemo(
    () =>
      project
        ? {
            project,
            locale,
            renderScale: bucketScale(zoom * (window.devicePixelRatio || 1)),
            interactive: true,
            selected: selectedSet,
            editingTextId,
            fontEpoch,
            onDragMove: (e) => dragMoveRef.current(e),
            onDragEnd: (e) => dragEndRef.current(e),
          }
        : null,
    [project, locale, zoom, selectedSet, editingTextId, fontEpoch],
  )

  const selectedLayers = useMemo(
    () => (project ? selectedIds.map((id) => findLayer(project, id)?.layer).filter((l): l is Layer => !!l) : []),
    [project, selectedIds],
  )

  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const nodes = editingTextId ? [] : selectedIds.map((id) => stage.findOne(`#${id}`)).filter((n): n is Konva.Node => !!n && n.isVisible())
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  })

  const allText = selectedLayers.length > 0 && selectedLayers.every((l) => l.type === 'text')
  const onlyLines = selectedLayers.length > 0 && selectedLayers.every((l) => l.type === 'shape' && l.shape === 'line')
  const keepRatio = selectedLayers.some((l) => l.type === 'device' || l.type === 'zoom' || l.type === 'group')
  const anyLocked = selectedLayers.some((l) => l.locked)
  const rotateEnabled = !anyLocked && !selectedLayers.every((l) => l.type === 'zoom')

  const clearGuides = () => {
    guidesRef.current?.destroyChildren()
    guidesRef.current?.getLayer()?.batchDraw()
  }

  const pageRectWorld = (pageId: string | undefined, sp: Spread, node: Konva.Node): Box => {
    if (!spreadMode) return { x: 0, y: 0, width: sp.width, height: sp.height }
    let i = sp.pages.findIndex((p) => p.id === pageId)
    if (i < 0) {
      const r = node.getClientRect({ skipShadow: true })
      i = Math.floor(((r.x + r.width / 2 - pan.x) / zoom) / sp.width)
      i = Math.max(0, Math.min(sp.pages.length - 1, i))
    }
    return { x: i * sp.width, y: 0, width: sp.width, height: sp.height }
  }

  const onDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    if (!node.hasName('layer-root') || !spread) return
    clearGuides()
    if (e.evt.metaKey || e.evt.ctrlKey || useEditor.getState().selectedIds.length > 1) return
    const abs = node.getClientRect({ skipShadow: true })
    const pr = pageRectWorld(containerPageId(node), spread, node)
    const toAbs = (b: Box): Box => ({ x: b.x * zoom + pan.x, y: b.y * zoom + pan.y, width: b.width * zoom, height: b.height * zoom })
    const page = toAbs(pr)
    const vs = [page.x, page.x + page.width / 2, page.x + page.width]
    const hs = [page.y, page.y + page.height / 2, page.y + page.height]
    const parent = node.getParent()
    parent?.getChildren((c) => c !== node && c.hasName('layer-root') && c.isVisible()).forEach((c) => {
      const r = c.getClientRect({ skipShadow: true })
      vs.push(r.x, r.x + r.width / 2, r.x + r.width)
      hs.push(r.y, r.y + r.height / 2, r.y + r.height)
    })
    const ev = [abs.x, abs.x + abs.width / 2, abs.x + abs.width]
    const eh = [abs.y, abs.y + abs.height / 2, abs.y + abs.height]
    const best = (cands: number[], edges: number[]) => {
      let out: { d: number; at: number } | null = null
      for (const c of cands) for (const ed of edges) {
        const d = c - ed
        if (Math.abs(d) <= SNAP && (!out || Math.abs(d) < Math.abs(out.d))) out = { d, at: c }
      }
      return out
    }
    const bv = best(vs, ev)
    const bh = best(hs, eh)
    if (!bv && !bh) return
    const ap = node.absolutePosition()
    node.absolutePosition({ x: ap.x + (bv?.d ?? 0), y: ap.y + (bh?.d ?? 0) })
    const g = guidesRef.current
    if (!g) return
    if (bv) g.add(new Konva.Line({ points: [bv.at, page.y - 20, bv.at, page.y + page.height + 20], stroke: '#F43F5E', strokeWidth: 1, dash: [4, 4], listening: false }))
    if (bh) g.add(new Konva.Line({ points: [page.x - 20, bh.at, page.x + page.width + 20, bh.at], stroke: '#F43F5E', strokeWidth: 1, dash: [4, 4], listening: false }))
    g.getLayer()?.batchDraw()
  }

  const onDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    clearGuides()
    if (!node.hasName('layer-root')) return
    const stage = stageRef.current!
    const st = useEditor.getState()
    const ids = st.selectedIds.includes(node.id()) ? st.selectedIds : [node.id()]
    const patches: Record<string, { x: number; y: number }> = {}
    ids.forEach((id) => {
      const n = stage.findOne(`#${id}`)
      if (n) patches[id] = { x: Math.round(n.x() * 100) / 100, y: Math.round(n.y() * 100) / 100 }
    })
    st.updateLayers(patches)
  }

  const dragMoveRef = useRef(onDragMove)
  const dragEndRef = useRef(onDragEnd)
  useLayoutEffect(() => {
    dragMoveRef.current = onDragMove
    dragEndRef.current = onDragEnd
  })

  const onTransform = () => {
    const tr = trRef.current
    if (!tr) return
    const anchor = tr.getActiveAnchor() ?? ''
    if (!anchor.startsWith('middle')) return
    tr.nodes().forEach((node) => {
      if (!node.hasName('type-text')) return
      const txt = (node as Konva.Group).findOne('Text') as Konva.Text | undefined
      if (!txt) return
      txt.width(Math.max(10, txt.width() * node.scaleX()))
      node.scaleX(1)
    })
  }

  const onTransformEnd = () => {
    const tr = trRef.current
    const st = useEditor.getState()
    if (!tr || !st.project) return
    const corner = !(tr.getActiveAnchor() ?? '').startsWith('middle')
    const patches: Record<string, Record<string, unknown>> = {}
    tr.nodes().forEach((node) => {
      const l = findLayer(st.project!, node.id())?.layer
      if (!l) return
      const sx = node.scaleX()
      const sy = node.scaleY()
      node.scale({ x: 1, y: 1 })
      const base = { x: Math.round(node.x() * 100) / 100, y: Math.round(node.y() * 100) / 100, rotation: Math.round(node.rotation() * 100) / 100 }
      if (l.type === 'text') {
        const txt = (node as Konva.Group).findOne('Text') as Konva.Text | undefined
        const w = (txt?.width() ?? l.width) * sx
        patches[l.id] = { ...base, width: Math.max(10, Math.round(w)), ...(corner && Math.abs(sy - 1) > 0.001 ? { fontSize: Math.max(4, Math.round(l.fontSize * sy * 10) / 10) } : {}) }
      } else if (l.type === 'group') {
        const children = l.children.map((c) => {
          const k = structuredClone(c) as Layer
          scaleLayer(k, sx, sy)
          return k
        })
        patches[l.id] = { ...base, width: l.width * sx, height: l.height * sy, children }
      } else if (l.type === 'zoom') {
        const s = Math.max(40, Math.round(l.width * Math.max(sx, sy)))
        patches[l.id] = { ...base, width: s, height: s }
      } else {
        patches[l.id] = { ...base, width: Math.max(1, Math.round(l.width * sx)), height: Math.max(1, Math.round(l.height * sy)) }
      }
    })
    st.updateLayers(patches)
  }

  const startWindowDrag = (onMove: (e: PointerEvent) => void, onUp: (e: PointerEvent) => void) => {
    const up = (e: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', up)
      onUp(e)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', up)
  }

  const onMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current!
    setMenu(null)
    const st = useEditor.getState()
    if (st.editingTextId) st.setEditingText(null)
    if (e.evt.button === 1 || space) {
      e.evt.preventDefault()
      const start = { x: e.evt.clientX, y: e.evt.clientY, pan: { ...st.pan } }
      startWindowDrag(
        (ev) => useEditor.getState().setPan({ x: start.pan.x + ev.clientX - start.x, y: start.pan.y + ev.clientY - start.y }),
        () => undefined,
      )
      return
    }
    if (e.evt.button === 2) return
    if (e.target.getParent()?.className === 'Transformer') return
    const root = layerRootOf(e.target, stage, st.selectedIds)
    if (root) {
      const id = root.id()
      const pid = containerPageId(root)
      if (pid && pid !== st.activePageId && !e.evt.shiftKey) st.setActivePage(pid)
      if (e.evt.shiftKey || e.evt.metaKey) st.toggleSelect(id)
      else if (!useEditor.getState().selectedIds.includes(id)) st.select([id])
      return
    }
    let pid = (e.target as Konva.Node).getAttr('pageId') as string | undefined
    if (!pid && spreadMode && spread && e.target.hasName('background')) {
      const p = stage.getPointerPosition()
      const i = p ? Math.floor((p.x - pan.x) / zoom / spread.width) : -1
      pid = spread.pages[i]?.id
    }
    if (pid && pid !== st.activePageId) st.setActivePage(pid)
    if (!e.evt.shiftKey) useEditor.getState().clearSelection()
    const rect = containerRef.current!.getBoundingClientRect()
    const sx = e.evt.clientX - rect.left
    const sy = e.evt.clientY - rect.top
    let box: Box | null = null
    startWindowDrag(
      (ev) => {
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        box = { x: Math.min(sx, x), y: Math.min(sy, y), width: Math.abs(x - sx), height: Math.abs(y - sy) }
        setMarquee(box)
      },
      () => {
        setMarquee(null)
        const b = box as Box | null
        if (!b || b.width < 3 || b.height < 3) return
        const hits = stage
          .find('.layer-root')
          .filter((n) => !n.hasName('in-group') && n.isVisible() && n.isListening())
          .filter((n) => Konva.Util.haveIntersection(b, n.getClientRect({ skipShadow: true })))
          .map((n) => n.id())
        const prev = e.evt.shiftKey ? useEditor.getState().selectedIds : []
        useEditor.getState().select([...new Set([...prev, ...hits])])
      },
    )
  }

  const onDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current!
    const inner = innermostRoot(e.target, stage)
    if (!inner) return
    const st = useEditor.getState()
    const l = st.project ? findLayer(st.project, inner.id())?.layer : undefined
    if (!l) return
    if (l.type === 'text' && !l.locked) {
      st.select([l.id])
      st.setEditingText(l.id)
    } else st.select([l.id])
  }

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const st = useEditor.getState()
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const p = stageRef.current!.getPointerPosition() ?? { x: size.w / 2, y: size.h / 2 }
      const next = Math.max(0.03, Math.min(8, st.zoom * Math.exp(-e.evt.deltaY * 0.01)))
      st.setZoom(next, { x: p.x - ((p.x - st.pan.x) * next) / st.zoom, y: p.y - ((p.y - st.pan.y) * next) / st.zoom })
    } else {
      st.setPan({ x: st.pan.x - e.evt.deltaX, y: st.pan.y - e.evt.deltaY })
    }
  }

  const onMouseOver = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const h = hoverRef.current
    if (!h) return
    const root = layerRootOf(e.target, stageRef.current!, useEditor.getState().selectedIds)
    if (!root || useEditor.getState().selectedIds.includes(root.id())) {
      if (h.visible()) {
        h.visible(false)
        h.getLayer()?.batchDraw()
      }
      return
    }
    const r = root.getClientRect({ skipShadow: true })
    h.setAttrs({ ...r, visible: true })
    h.getLayer()?.batchDraw()
  }

  const toPage = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect()
    const wx = (clientX - rect.left - pan.x) / zoom
    const wy = (clientY - rect.top - pan.y) / zoom
    return { x: spreadMode && spread ? wx - pageIndex * spread.width : wx, y: wy }
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDropping(false)
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(f.name))
    const assetId = e.dataTransfer.getData('application/x-listing-asset')
    const stage = stageRef.current!
    stage.setPointersPositions(e.nativeEvent)
    const p = stage.getPointerPosition()
    const hit = p ? stage.getIntersection(p) : null
    const root = hit ? innermostRoot(hit, stage) : null
    const st = useEditor.getState()
    const target = root && st.project ? findLayer(st.project, root.id())?.layer : undefined
    const deviceId = target?.type === 'device' ? target.id : undefined
    if (assetId) {
      const [id, w, h] = assetId.split('|')
      if (deviceId) setDeviceScreen(deviceId, id)
      else addImage(id, Number(w), Number(h), toPage(e.clientX, e.clientY))
      return
    }
    if (!files.length) return
    await uploadImages(files, { at: toPage(e.clientX, e.clientY), deviceId })
  }

  if (!project || !spread || !ctx) return <div ref={containerRef} className="flex-1" />

  const isIcon = getTarget(spread.targetId).kind === 'icon'
  const gridStep = Math.max(20, Math.round(spread.width / 27))

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#0C0E12]"
      style={{ cursor: space ? 'grab' : 'default' }}
      onDragOver={(e) => {
        e.preventDefault()
        setDropping(true)
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={onDrop}
      onContextMenu={(e) => {
        e.preventDefault()
        const rect = containerRef.current!.getBoundingClientRect()
        setMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(#2A2E3A 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onMouseDown={onMouseDown}
        onDblClick={onDblClick}
        onWheel={onWheel}
        onMouseOver={onMouseOver}
        onMouseLeave={() => hoverRef.current?.visible(false)}
      >
        <KLayer x={pan.x} y={pan.y} scaleX={zoom} scaleY={zoom}>
          <RenderContext.Provider value={ctx}>
            <Rect x={-2 / zoom} y={-2 / zoom} width={contentW + 4 / zoom} height={contentH + 4 / zoom} fill="rgba(0,0,0,0.001)" shadowColor="#000" shadowBlur={40} shadowOpacity={0.5} listening={false} />
            {spreadMode ? (
              <>
                {spread.seamless && !spread.pages.some((p) => p.background) ? (
                  <BackgroundNode bg={spread.background} width={contentW} height={contentH} totalWidth={contentW} />
                ) : (
                  spread.pages.map((p, i) => <PageBackground key={p.id} spread={spread} page={p} index={i} x={i * spread.width} />)
                )}
                <Group name="shared-container" clipX={0} clipY={0} clipWidth={contentW} clipHeight={contentH}>
                  <LayerList layers={spread.sharedLayers} />
                </Group>
                {spread.pages.map((p, i) => (
                  <Group key={p.id} x={i * spread.width} clipX={0} clipY={0} clipWidth={spread.width} clipHeight={spread.height}>
                    <Group name="page-container" pageId={p.id}>
                      <LayerList layers={p.layers} />
                    </Group>
                  </Group>
                ))}
              </>
            ) : (
              <PageScene spread={spread} index={pageIndex} />
            )}
            {showGrid && (
              <Shape
                listening={false}
                sceneFunc={(c) => {
                  const n = c._context
                  n.save()
                  n.strokeStyle = 'rgba(139,92,246,0.25)'
                  n.lineWidth = 1 / zoom
                  n.beginPath()
                  for (let x = gridStep; x < contentW; x += gridStep) {
                    n.moveTo(x, 0)
                    n.lineTo(x, contentH)
                  }
                  for (let y = gridStep; y < contentH; y += gridStep) {
                    n.moveTo(0, y)
                    n.lineTo(contentW, y)
                  }
                  n.stroke()
                  n.strokeStyle = 'rgba(244,63,94,0.5)'
                  n.beginPath()
                  for (let i = 0; i < (spreadMode ? spread.pages.length : 1); i++) {
                    n.moveTo(i * spread.width + spread.width / 2, 0)
                    n.lineTo(i * spread.width + spread.width / 2, contentH)
                  }
                  n.moveTo(0, contentH / 2)
                  n.lineTo(contentW, contentH / 2)
                  n.stroke()
                  n.restore()
                }}
              />
            )}
            {isIcon && iconMask !== 'none' && (
              <Shape
                listening={false}
                sceneFunc={(c) => {
                  const n = c._context
                  const pages = spreadMode ? spread.pages.length : 1
                  for (let i = 0; i < pages; i++) {
                    n.save()
                    n.translate(i * spread.width, 0)
                    maskPath(n, iconMask, spread.width)
                    n.rect(-4, -4, spread.width + 8, spread.height + 8)
                    n.fillStyle = 'rgba(12,14,18,0.82)'
                    n.fill('evenodd')
                    maskPath(n, iconMask, spread.width)
                    n.strokeStyle = 'rgba(139,92,246,0.9)'
                    n.lineWidth = 1.5 / zoom
                    n.setLineDash([6 / zoom, 5 / zoom])
                    n.stroke()
                    n.restore()
                  }
                }}
              />
            )}
            {spreadMode &&
              spread.pages.map((p, i) => (
                <Group key={p.id}>
                  <Rect
                    x={i * spread.width}
                    width={spread.width}
                    height={spread.height}
                    stroke={p.id === activePageId ? ACCENT : 'rgba(255,255,255,0.25)'}
                    strokeWidth={(p.id === activePageId ? 2 : 1) / zoom}
                    dash={p.id === activePageId ? undefined : [6 / zoom, 6 / zoom]}
                    listening={false}
                  />
                  <Text
                    x={i * spread.width}
                    y={-26 / zoom}
                    text={`${i + 1}  ${p.name}`}
                    fontSize={13 / zoom}
                    fontFamily="Inter"
                    fill={p.id === activePageId ? '#E9D5FF' : '#94A3B8'}
                    onMouseDown={(ev) => {
                      ev.cancelBubble = true
                      useEditor.getState().setActivePage(p.id)
                    }}
                  />
                </Group>
              ))}
          </RenderContext.Provider>
        </KLayer>
        <KLayer>
          <Rect ref={hoverRef} visible={false} stroke={ACCENT} strokeWidth={1} listening={false} />
          <Group ref={guidesRef} listening={false} />
          <Transformer
            ref={trRef}
            rotateEnabled={rotateEnabled}
            resizeEnabled={!anyLocked}
            keepRatio={keepRatio}
            enabledAnchors={
              onlyLines
                ? ['middle-left', 'middle-right']
                : allText
                  ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']
                  : undefined
            }
            borderStroke={ACCENT}
            borderDash={anyLocked ? [4, 4] : undefined}
            anchorStroke={ACCENT}
            anchorFill="#fff"
            anchorSize={9}
            anchorCornerRadius={2}
            rotateAnchorOffset={24}
            ignoreStroke
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 4 ? oldBox : newBox)}
            onTransform={onTransform}
            onTransformEnd={onTransformEnd}
          />
        </KLayer>
      </Stage>
      {marquee && <div className="pointer-events-none absolute border border-accent bg-accent/10" style={{ left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height }} />}
      {dropping && (
        <div className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-accent/10 text-sm font-medium text-fg">
          Drop images to add them. Drop onto a device to set its screen.
        </div>
      )}
      {editingTextId && <TextEditOverlay id={editingTextId} />}
      {menu && <CanvasContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  )
}
