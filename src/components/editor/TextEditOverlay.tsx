import type Konva from 'konva'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { resolveColor } from '@/features/canvas/fill'
import { textFor } from '@/features/canvas/render-context'
import { stageRegistry } from '@/features/canvas/stage-registry'
import { findLayer } from '@/lib/doc'
import { useEditor } from '@/store/editor-store'

export function TextEditOverlay({ id }: { id: string }) {
  const project = useEditor((s) => s.project)
  const locale = useEditor((s) => s.activeLocale)
  const zoom = useEditor((s) => s.zoom)
  const pan = useEditor((s) => s.pan)
  const ref = useRef<HTMLTextAreaElement>(null)
  const layer = project ? findLayer(project, id)?.layer : undefined
  const [style, setStyle] = useState<React.CSSProperties | null>(null)
  const initial = useRef<string | null>(null)

  useLayoutEffect(() => {
    const stage = stageRegistry.get()
    const node = stage?.findOne(`#${id}`) as Konva.Group | undefined
    const txt = node?.findOne('Text') as Konva.Text | undefined
    if (!node || !txt || !layer || layer.type !== 'text' || !project) return
    const pos = txt.getAbsolutePosition()
    const scale = txt.getAbsoluteScale().x
    const fam = layer.fontRef ? project.theme.fonts[layer.fontRef] : layer.fontFamily
    setStyle({
      left: pos.x,
      top: pos.y,
      width: Math.max(40, layer.width * scale),
      font: `${layer.italic ? 'italic ' : ''}${layer.fontWeight} ${layer.fontSize * scale}px "${fam}"`,
      lineHeight: layer.lineHeight,
      letterSpacing: `${layer.letterSpacing * scale}px`,
      color: resolveColor(project.theme, layer.color, layer.colorRef),
      textAlign: layer.align,
      textTransform: layer.uppercase ? 'uppercase' : 'none',
      transform: `rotate(${node.getAbsoluteRotation()}deg)`,
      transformOrigin: 'left top',
    })
  }, [id, layer, project, zoom, pan])

  useEffect(() => {
    const el = ref.current
    if (!el || !style) return
    if (initial.current === null) {
      initial.current = el.value
      el.focus()
      el.select()
    }
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  })

  if (!layer || layer.type !== 'text' || !project) return null
  const raw = textFor({ project, locale }, { ...layer, uppercase: false })
  const done = () => useEditor.getState().setEditingText(null)

  return (
    <textarea
      ref={ref}
      value={raw}
      spellCheck={false}
      onChange={(e) => useEditor.getState().setLayerText(id, e.target.value)}
      onBlur={done}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
          e.preventDefault()
          done()
        }
      }}
      className="absolute z-10 m-0 resize-none overflow-hidden whitespace-pre-wrap break-words border-0 bg-transparent p-0 outline outline-2 outline-offset-2 outline-accent"
      style={style ?? { display: 'none' }}
    />
  )
}
