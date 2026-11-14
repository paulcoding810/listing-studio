import { Link2Off, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Popover, Segmented, Slider } from '@/components/ui/primitives'
import { Input } from '@/components/ui/input'
import { fillPreviewCss, resolveColor } from '@/features/canvas/fill'
import { parseColor, toCss, toHex } from '@/lib/color'
import { cn, clamp } from '@/lib/utils'
import type { Fill, Theme, ThemeColorKey } from '@/types/project'

export function Section({ title, children, action, defaultOpen = true }: { title: string; children: ReactNode; action?: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-border px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setOpen(!open)} className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-fg">
          {title}
        </button>
        {action}
      </div>
      {open && <div className="space-y-2">{children}</div>}
    </section>
  )
}

export function Row({ label, children, className }: { label?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label !== undefined && <span className="w-16 shrink-0 text-xs text-muted">{label}</span>}
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    </div>
  )
}

export function NumberField({
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = -100000,
  max = 100000,
  precision = 0,
  className,
}: {
  value: number
  onChange: (v: number) => void
  prefix?: ReactNode
  suffix?: string
  step?: number
  min?: number
  max?: number
  precision?: number
  className?: string
}) {
  const fmt = (v: number) => (Number.isFinite(v) ? String(+v.toFixed(precision)) : '0')
  const [text, setText] = useState(fmt(value))
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(fmt(value))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (raw: string) => {
    let v: number
    try {
      v = /^[-+*/().\d\s]+$/.test(raw) ? Number(Function(`"use strict";return (${raw})`)()) : Number(raw)
    } catch {
      v = NaN
    }
    if (Number.isFinite(v)) onChange(clamp(v, min, max))
    else setText(fmt(value))
  }

  const scrub = (e: React.PointerEvent) => {
    const startX = e.clientX
    const start = value
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => {
      const delta = (ev.clientX - startX) * step * (ev.shiftKey ? 10 : 1)
      onChange(clamp(+(start + delta).toFixed(precision), min, max))
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  return (
    <div className={cn('flex h-7 min-w-0 flex-1 items-center rounded-md border border-border bg-surface focus-within:border-accent/70', className)}>
      {prefix !== undefined && (
        <span onPointerDown={scrub} className="flex h-full cursor-ew-resize select-none items-center pl-2 pr-1 text-[11px] text-subtle [&_svg]:size-3">
          {prefix}
        </span>
      )}
      <input
        value={text}
        onFocus={(e) => {
          focused.current = true
          e.target.select()
        }}
        onBlur={(e) => {
          focused.current = false
          commit(e.target.value)
        }}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setText(fmt(value))
            ;(e.target as HTMLInputElement).blur()
          }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            const v = clamp(value + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1), min, max)
            onChange(+v.toFixed(precision))
            setText(fmt(v))
          }
        }}
        className="h-full w-full min-w-0 bg-transparent px-1.5 text-xs text-fg outline-none"
      />
      {suffix && <span className="pr-2 text-[11px] text-subtle">{suffix}</span>}
    </div>
  )
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  precision = 0,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
  precision?: number
}) {
  return (
    <Row label={label}>
      <Slider value={value} onChange={onChange} min={min} max={max} step={step} />
      <NumberField value={value} onChange={onChange} min={min} max={max} step={step} precision={precision} suffix={suffix} className="w-16 flex-none" />
    </Row>
  )
}

const THEME_KEYS: ThemeColorKey[] = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'muted']

const SWATCHES = ['#FFFFFF', '#0F172A', '#000000', '#F43F5E', '#F97316', '#F59E0B', '#22C55E', '#14B8A6', '#0EA5E9', '#6366F1', '#8B5CF6', '#EC4899']

export function ColorPicker({
  value,
  colorRef,
  theme,
  onChange,
  allowAlpha = true,
  size = 'md',
}: {
  value: string
  colorRef?: ThemeColorKey
  theme?: Theme
  onChange: (color: string, ref?: ThemeColorKey) => void
  allowAlpha?: boolean
  size?: 'sm' | 'md'
}) {
  const shown = theme ? resolveColor(theme, value, colorRef) : value
  const c = parseColor(shown)
  const [hex, setHex] = useState(toHex(c).toUpperCase())
  useEffect(() => setHex(toHex(parseColor(shown)).toUpperCase()), [shown])
  const set = (next: Partial<typeof c>) => onChange(toCss({ ...c, ...next }))

  return (
    <Popover
      className="w-60"
      trigger={
        <button
          type="button"
          className={cn('checker relative shrink-0 cursor-pointer overflow-hidden rounded-md border border-border-strong', size === 'sm' ? 'size-6' : 'size-7')}
          aria-label="Pick color"
        >
          <span className="absolute inset-0" style={{ background: shown }} />
        </button>
      }
    >
      <div className="space-y-3">
        <input type="color" value={toHex(c)} onChange={(e) => onChange(toCss({ ...parseColor(e.target.value), a: c.a }))} className="h-28 w-full cursor-pointer rounded-lg" />
        <div className="flex items-center gap-2">
          <Input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            onBlur={() => /^#?[0-9a-f]{3,8}$/i.test(hex) && onChange(toCss({ ...parseColor(hex.startsWith('#') ? hex : `#${hex}`), a: c.a }))}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="h-7 font-mono text-xs"
          />
          {allowAlpha && (
            <NumberField value={Math.round(c.a * 100)} onChange={(v) => set({ a: v / 100 })} min={0} max={100} suffix="%" className="w-20 flex-none" />
          )}
        </div>
        {allowAlpha && <Slider value={c.a * 100} onChange={(v) => set({ a: v / 100 })} min={0} max={100} />}
        {theme && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Theme</span>
              {colorRef && (
                <span className="flex items-center gap-1 text-[10px] text-accent">
                  <Link2Off className="size-3" /> linked: {colorRef}
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              {THEME_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  title={`Theme ${k}`}
                  onClick={() => onChange(theme.colors[k], k)}
                  className={cn('size-6 cursor-pointer rounded-md border', colorRef === k ? 'border-accent ring-2 ring-accent/40' : 'border-border-strong')}
                  style={{ background: theme.colors[k] }}
                />
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-6 gap-1.5">
          {SWATCHES.map((s) => (
            <button key={s} type="button" onClick={() => onChange(s)} className="h-6 cursor-pointer rounded-md border border-border-strong" style={{ background: s }} aria-label={s} />
          ))}
        </div>
      </div>
    </Popover>
  )
}

export function ColorField({
  label,
  value,
  colorRef,
  theme,
  onChange,
  allowAlpha,
}: {
  label: string
  value: string
  colorRef?: ThemeColorKey
  theme?: Theme
  onChange: (c: string, ref?: ThemeColorKey) => void
  allowAlpha?: boolean
}) {
  const shown = theme ? resolveColor(theme, value, colorRef) : value
  return (
    <Row label={label}>
      <ColorPicker value={value} colorRef={colorRef} theme={theme} onChange={onChange} allowAlpha={allowAlpha} />
      <span className="truncate font-mono text-xs text-muted">{colorRef ? `theme.${colorRef}` : shown.toUpperCase()}</span>
    </Row>
  )
}

export const GRADIENT_PRESETS: Fill[] = [
  { kind: 'linear', angle: 160, stops: [{ offset: 0, color: '#6366F1' }, { offset: 1, color: '#EC4899' }] },
  { kind: 'linear', angle: 180, stops: [{ offset: 0, color: '#0F172A' }, { offset: 1, color: '#312E81' }] },
  { kind: 'linear', angle: 135, stops: [{ offset: 0, color: '#F97316' }, { offset: 1, color: '#E11D48' }] },
  { kind: 'linear', angle: 135, stops: [{ offset: 0, color: '#22D3EE' }, { offset: 1, color: '#6366F1' }] },
  { kind: 'linear', angle: 180, stops: [{ offset: 0, color: '#FDF2F8' }, { offset: 1, color: '#E0E7FF' }] },
  { kind: 'linear', angle: 120, stops: [{ offset: 0, color: '#10B981' }, { offset: 1, color: '#065F46' }] },
  { kind: 'radial', cx: 0.5, cy: 0.3, r: 0.8, stops: [{ offset: 0, color: '#7C3AED' }, { offset: 1, color: '#0B0B12' }] },
  { kind: 'linear', angle: 90, stops: [{ offset: 0, color: '#FDE68A' }, { offset: 0.5, color: '#FCA5A5' }, { offset: 1, color: '#C4B5FD' }] },
]

export function FillEditor({ fill, theme, onChange }: { fill: Fill; theme: Theme; onChange: (f: Fill) => void }) {
  const [active, setActive] = useState(0)
  const stops = fill.kind === 'solid' ? [] : fill.stops
  const idx = Math.min(active, Math.max(0, stops.length - 1))
  const barRef = useRef<HTMLDivElement>(null)

  const toKind = (k: Fill['kind']) => {
    if (k === fill.kind) return
    const base = fill.kind === 'solid' ? [{ offset: 0, color: resolveColor(theme, fill.color, fill.ref) }, { offset: 1, color: theme.colors.secondary }] : fill.stops
    if (k === 'solid') onChange({ kind: 'solid', color: base[0].color, ref: base[0].ref })
    else if (k === 'linear') onChange({ kind: 'linear', angle: 180, stops: base })
    else onChange({ kind: 'radial', cx: 0.5, cy: 0.4, r: 0.75, stops: base })
  }

  const updateStop = (i: number, patch: Partial<(typeof stops)[number]>) => {
    if (fill.kind === 'solid') return
    onChange({ ...fill, stops: stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
  }

  const dragStop = (i: number, e: React.PointerEvent) => {
    e.preventDefault()
    setActive(i)
    const bar = barRef.current
    if (!bar || fill.kind === 'solid') return
    const rect = bar.getBoundingClientRect()
    const move = (ev: PointerEvent) => updateStop(i, { offset: +clamp((ev.clientX - rect.left) / rect.width, 0, 1).toFixed(3) })
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className="space-y-2.5">
      <Segmented
        value={fill.kind}
        onChange={toKind}
        options={[
          { value: 'solid', label: 'Solid' },
          { value: 'linear', label: 'Linear' },
          { value: 'radial', label: 'Radial' },
        ]}
      />
      {fill.kind === 'solid' ? (
        <ColorField label="Color" value={fill.color} colorRef={fill.ref} theme={theme} onChange={(color, ref) => onChange({ kind: 'solid', color, ref })} />
      ) : (
        <>
          <div className="relative px-1.5 pb-3 pt-1">
            <div
              ref={barRef}
              className="checker h-5 cursor-copy rounded-md border border-border-strong"
              onDoubleClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                const offset = +clamp((e.clientX - r.left) / r.width, 0, 1).toFixed(3)
                onChange({ ...fill, stops: [...stops, { offset, color: resolveColor(theme, stops[idx].color, stops[idx].ref) }] })
                setActive(stops.length)
              }}
            >
              <div className="h-full w-full rounded-md" style={{ background: fillPreviewCss({ kind: 'linear', angle: 90, stops }, theme) }} />
            </div>
            {stops.map((s, i) => (
              <button
                key={i}
                type="button"
                onPointerDown={(e) => dragStop(i, e)}
                className={cn('absolute top-4 size-3.5 -translate-x-1/2 cursor-grab rounded-full border-2 shadow', i === idx ? 'border-white ring-2 ring-accent' : 'border-white/70')}
                style={{ left: `calc(6px + (100% - 12px) * ${s.offset})`, background: resolveColor(theme, s.color, s.ref) }}
                aria-label={`Stop ${i + 1}`}
              />
            ))}
          </div>
          <Row label="Stop">
            <ColorPicker value={stops[idx].color} colorRef={stops[idx].ref} theme={theme} onChange={(color, ref) => updateStop(idx, { color, ref })} />
            <NumberField value={Math.round(stops[idx].offset * 100)} onChange={(v) => updateStop(idx, { offset: v / 100 })} min={0} max={100} suffix="%" />
            <button
              type="button"
              title="Add stop"
              onClick={() => {
                onChange({ ...fill, stops: [...stops, { offset: 0.5, color: theme.colors.accent }] })
                setActive(stops.length)
              }}
              className="cursor-pointer rounded p-1 text-muted hover:bg-surface-2 hover:text-fg"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              title="Remove stop"
              disabled={stops.length <= 2}
              onClick={() => {
                onChange({ ...fill, stops: stops.filter((_, j) => j !== idx) })
                setActive(0)
              }}
              className="cursor-pointer rounded p-1 text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30"
            >
              <Trash2 className="size-3.5" />
            </button>
          </Row>
          {fill.kind === 'linear' && <SliderField label="Angle" value={fill.angle} onChange={(angle) => onChange({ ...fill, angle })} min={0} max={360} suffix="°" />}
          {fill.kind === 'radial' && (
            <>
              <SliderField label="Center X" value={Math.round(fill.cx * 100)} onChange={(v) => onChange({ ...fill, cx: v / 100 })} min={0} max={100} suffix="%" />
              <SliderField label="Center Y" value={Math.round(fill.cy * 100)} onChange={(v) => onChange({ ...fill, cy: v / 100 })} min={0} max={100} suffix="%" />
              <SliderField label="Radius" value={Math.round(fill.r * 100)} onChange={(v) => onChange({ ...fill, r: v / 100 })} min={5} max={200} suffix="%" />
            </>
          )}
        </>
      )}
      <div className="grid grid-cols-8 gap-1.5">
        {GRADIENT_PRESETS.map((g, i) => (
          <button
            key={i}
            type="button"
            title="Apply gradient preset"
            onClick={() => onChange(structuredClone(g))}
            className="aspect-square cursor-pointer rounded-md border border-border-strong transition-transform hover:scale-110"
            style={{ background: fillPreviewCss(g, theme) }}
          />
        ))}
      </div>
    </div>
  )
}
