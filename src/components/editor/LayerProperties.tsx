import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  Dices,
  Group as GroupIcon,
  Italic,
  RotateCw,
  Ungroup,
  Upload,
} from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, Segmented, Select, Switch, Tip } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'
import { DEMO_SCREENS } from '@/demo/screens'
import { alignSelection, groupSelection, ungroupSelection, uploadImages, type AlignKind } from '@/features/editor-actions'
import { PERSPECTIVE_PRESETS } from '@/features/perspective'
import { deviceAspect } from '@/features/device-paint'
import { FRAMES, getFrame } from '@/frames'
import { importImageFile } from '@/lib/assets'
import { blobPoints, shadow as defaultShadow, TEXT_PRESETS, type TextPreset } from '@/lib/factory'
import { cn } from '@/lib/utils'
import { effectiveLocale, useEditor } from '@/store/editor-store'
import { localeName } from './LocalizationDialog'
import type { LayerOverride } from '@/types/project'
import { isLinkedIcon } from '@/lib/doc'
import type { DeviceLayer, ImageLayer, Layer, PerspectivePreset, Project, Shadow, ShapeLayer, TextLayer, ZoomLayer } from '@/types/project'
import { ColorField, ColorPicker, FillEditor, NumberField, Row, Section, SliderField } from './controls'
import { FontSelect } from './ThemeEditor'
import { useAsset } from '@/features/canvas/use-asset'

type Patch = Record<string, unknown>

function useLangScope(project: Project, id: string, key: keyof LayerOverride) {
  const locale = effectiveLocale(project, useEditor((s) => s.activeLocale))
  const translating = locale !== project.locales[0]
  const overridden = translating && project.overrides?.[locale]?.[id]?.[key] !== undefined
  return { locale, translating, overridden }
}

function LangScope({ project, id, field, what }: { project: Project; id: string; field: keyof LayerOverride; what: string }) {
  const { locale, translating, overridden } = useLangScope(project, id, field)
  if (!translating) return null
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-1.5 text-[11px] text-muted">
      <span className="flex-1">
        {overridden ? `${localeName(locale)} uses its own ${what}.` : `Changing the ${what} now applies to ${localeName(locale)} only.`}
      </span>
      {overridden && (
        <button type="button" onClick={() => useEditor.getState().clearOverride(id, field)} className="cursor-pointer text-accent hover:underline">
          Use shared
        </button>
      )}
    </div>
  )
}
const upd = (id: string, patch: Patch) => useEditor.getState().updateLayer(id, patch)

const ALIGN: Array<[AlignKind, React.ReactNode, string]> = [
  ['left', <AlignStartVertical key="1" />, 'Align left'],
  ['hcenter', <AlignCenterVertical key="2" />, 'Align horizontal centers'],
  ['right', <AlignEndVertical key="3" />, 'Align right'],
  ['top', <AlignStartHorizontal key="4" />, 'Align top'],
  ['vcenter', <AlignCenterHorizontal key="5" />, 'Align vertical centers'],
  ['bottom', <AlignEndHorizontal key="6" />, 'Align bottom'],
]

export function AlignBar({ multi }: { multi: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {ALIGN.map(([k, icon, label]) => (
        <Tip key={k} label={multi ? label : `${label} to canvas`}>
          <button type="button" onClick={() => alignSelection(k)} className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface hover:text-fg [&_svg]:size-3.5" aria-label={label}>
            {icon}
          </button>
        </Tip>
      ))}
      {multi && (
        <>
          <Tip label="Distribute horizontally">
            <button type="button" onClick={() => alignSelection('hdistribute')} className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface hover:text-fg" aria-label="Distribute horizontally">
              <AlignHorizontalDistributeCenter className="size-3.5" />
            </button>
          </Tip>
          <Tip label="Distribute vertically">
            <button type="button" onClick={() => alignSelection('vdistribute')} className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface hover:text-fg" aria-label="Distribute vertically">
              <AlignVerticalDistributeCenter className="size-3.5" />
            </button>
          </Tip>
        </>
      )}
    </div>
  )
}

function TransformSection({ l }: { l: Layer }) {
  const square = l.type === 'zoom'
  const ratioLocked = l.type === 'device'
  return (
    <Section title="Layout" action={<AlignBar multi={false} />}>
      <div className="grid grid-cols-2 gap-2">
        <NumberField prefix="X" value={l.x} onChange={(x) => upd(l.id, { x })} />
        <NumberField prefix="Y" value={l.y} onChange={(y) => upd(l.id, { y })} />
        <NumberField
          prefix="W"
          value={l.width}
          min={1}
          onChange={(width) => {
            if (square) upd(l.id, { width, height: width })
            else if (l.type === 'group') useEditor.getState().resizeGroup(l.id, width, l.height)
            else if (ratioLocked) upd(l.id, { width, height: Math.round(width / deviceAspect(getFrame((l as DeviceLayer).frameId))) })
            else upd(l.id, { width })
          }}
        />
        {l.type !== 'text' ? (
          <NumberField
            prefix="H"
            value={l.height}
            min={1}
            onChange={(height) => {
              if (square) upd(l.id, { width: height, height })
              else if (l.type === 'group') useEditor.getState().resizeGroup(l.id, l.width, height)
              else if (ratioLocked) upd(l.id, { height, width: Math.round(height * deviceAspect(getFrame((l as DeviceLayer).frameId))) })
              else upd(l.id, { height })
            }}
          />
        ) : (
          <div />
        )}
        <NumberField prefix={<RotateCw />} value={l.rotation} suffix="°" min={-360} max={360} onChange={(rotation) => upd(l.id, { rotation })} />
        <NumberField prefix="α" value={Math.round(l.opacity * 100)} suffix="%" min={0} max={100} onChange={(v) => upd(l.id, { opacity: v / 100 })} />
      </div>
    </Section>
  )
}

function ShadowSection({ l }: { l: Layer }) {
  const s = l.shadow
  const set = (patch: Partial<Shadow>) => upd(l.id, { shadow: { ...(s ?? defaultShadow({ enabled: false })), ...patch } })
  return (
    <Section title="Shadow" action={<Switch checked={!!s?.enabled} onChange={(enabled) => set({ enabled })} />}>
      {s?.enabled ? (
        <>
          <ColorField label="Color" value={s.color} onChange={(color) => set({ color })} allowAlpha={false} />
          <SliderField label="Blur" value={s.blur} onChange={(blur) => set({ blur })} min={0} max={200} />
          <SliderField label="Offset X" value={s.offsetX} onChange={(offsetX) => set({ offsetX })} min={-200} max={200} />
          <SliderField label="Offset Y" value={s.offsetY} onChange={(offsetY) => set({ offsetY })} min={-200} max={200} />
          <SliderField label="Opacity" value={Math.round(s.opacity * 100)} onChange={(v) => set({ opacity: v / 100 })} min={0} max={100} suffix="%" />
        </>
      ) : (
        <p className="text-xs text-subtle">Off</p>
      )}
    </Section>
  )
}

const WEIGHTS = [
  ['300', 'Light'],
  ['400', 'Regular'],
  ['500', 'Medium'],
  ['600', 'Semibold'],
  ['700', 'Bold'],
  ['800', 'Extra bold'],
  ['900', 'Black'],
]

function TextSection({ l, project }: { l: TextLayer; project: Project }) {
  const locale = effectiveLocale(project, useEditor((s) => s.activeLocale))
  const def = project.locales[0]
  const translating = locale !== def && l.localizable
  const value = translating ? (project.strings[locale]?.[l.id] ?? '') : l.text
  const family = l.fontRef ? project.theme.fonts[l.fontRef] : l.fontFamily
  const applyPreset = (k: TextPreset) => {
    const p = TEXT_PRESETS[k]
    const scale = (useEditor.getState().project?.spreads.find((s) => s.pages.some((pg) => pg.layers.includes(l)))?.width ?? 1080) / 1080
    upd(l.id, { fontSize: Math.round(p.size * scale), fontWeight: p.weight, lineHeight: p.lineHeight, letterSpacing: p.letterSpacing, fontRef: p.font, uppercase: k === 'caption' })
  }
  return (
    <>
      <Section title={translating ? `Text · ${locale}` : 'Text'}>
        <textarea
          value={value}
          placeholder={translating ? l.text : ''}
          onChange={(e) => useEditor.getState().setLayerText(l.id, e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 text-[13px] text-fg outline-none focus:border-accent/70"
        />
        {translating && <p className="text-[11px] text-subtle">Empty falls back to the {def} text.</p>}
        <Row label="Style">
          <Select value="" placeholder="Apply preset…" onChange={(v) => applyPreset(v as TextPreset)} options={Object.entries(TEXT_PRESETS).map(([k, p]) => ({ value: k, label: p.label }))} />
        </Row>
        <Row label="Font">
          <FontSelect value={family} onChange={(f) => upd(l.id, { fontFamily: f, fontRef: undefined })} />
        </Row>
        <Row label="">
          <Segmented
            value={l.fontRef ?? 'custom'}
            onChange={(v) => (v === 'custom' ? upd(l.id, { fontRef: undefined, fontFamily: family }) : upd(l.id, { fontRef: v }))}
            options={[
              { value: 'heading', label: 'Theme heading' },
              { value: 'body', label: 'Theme body' },
              { value: 'custom', label: 'Fixed' },
            ]}
          />
        </Row>
        <Row label="Weight">
          <Select value={String(l.fontWeight)} onChange={(v) => upd(l.id, { fontWeight: Number(v) })} options={WEIGHTS.map(([v, label]) => ({ value: v, label }))} />
        </Row>
        <div className="grid grid-cols-2 gap-2">
          <NumberField prefix="Size" value={l.fontSize} min={4} max={1000} onChange={(fontSize) => useEditor.getState().setFontSize(l.id, fontSize)} />
          <div className="flex gap-1">
            <Tip label="Italic">
              <button type="button" onClick={() => upd(l.id, { italic: !l.italic })} className={cn('flex h-7 flex-1 cursor-pointer items-center justify-center rounded-md border border-border', l.italic ? 'bg-accent-soft text-fg' : 'text-muted')}>
                <Italic className="size-3.5" />
              </button>
            </Tip>
            <Tip label="Uppercase">
              <button type="button" onClick={() => upd(l.id, { uppercase: !l.uppercase })} className={cn('flex h-7 flex-1 cursor-pointer items-center justify-center rounded-md border border-border text-[11px] font-semibold', l.uppercase ? 'bg-accent-soft text-fg' : 'text-muted')}>
                AA
              </button>
            </Tip>
          </div>
          <NumberField prefix="Line" value={l.lineHeight} step={0.05} precision={2} min={0.5} max={4} onChange={(lineHeight) => upd(l.id, { lineHeight })} />
          <NumberField prefix="Track" value={l.letterSpacing} step={0.5} precision={1} min={-50} max={100} onChange={(letterSpacing) => upd(l.id, { letterSpacing })} />
        </div>
        <Segmented
          value={l.align}
          onChange={(align) => upd(l.id, { align })}
          options={[
            { value: 'left', label: <AlignLeft />, title: 'Left' },
            { value: 'center', label: <AlignCenter />, title: 'Center' },
            { value: 'right', label: <AlignRight />, title: 'Right' },
          ]}
        />
        <ColorField label="Color" value={l.color} colorRef={l.colorRef} theme={project.theme} onChange={(color, colorRef) => upd(l.id, { color, colorRef })} />
        <Row label="Stroke">
          <ColorPicker value={l.stroke?.color ?? '#000000'} onChange={(color) => upd(l.id, { stroke: { width: l.stroke?.width ?? 2, color } })} />
          <NumberField value={l.stroke?.width ?? 0} min={0} max={100} onChange={(width) => upd(l.id, { stroke: { color: l.stroke?.color ?? '#000000', width } })} suffix="px" />
        </Row>
        {l.localizable && <LangScope project={project} id={l.id} field="fontSize" what="text size" />}
        <Row label="Translate">
          <Switch checked={l.localizable} onChange={(localizable) => upd(l.id, { localizable })} />
          <span className="text-[11px] text-subtle">Include in localization</span>
        </Row>
      </Section>
    </>
  )
}

function AssetThumb({ id }: { id?: string }) {
  const img = useAsset(id)
  if (!img) return <div className="checker size-full" />
  const src = img instanceof HTMLImageElement ? img.src : img instanceof HTMLCanvasElement ? img.toDataURL('image/jpeg', 0.6) : ''
  return <img src={src} alt="" className="size-full object-cover object-top" />
}

function ScreenPicker({ value, onPick }: { value?: string; onPick: (id: string | undefined) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-2">
      <Popover
        className="w-72"
        trigger={
          <button type="button" className="h-16 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border-strong" aria-label="Choose screen">
            <AssetThumb id={value} />
          </button>
        }
      >
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">Demo screens</div>
        <div className="grid max-h-72 grid-cols-4 gap-1.5 overflow-y-auto">
          {DEMO_SCREENS.map((d) => (
            <button key={d.id} type="button" title={d.name} onClick={() => onPick(d.id)} className={cn('h-20 cursor-pointer overflow-hidden rounded border', value === d.id ? 'border-accent' : 'border-border')}>
              <AssetThumb id={d.id} />
            </button>
          ))}
        </div>
      </Popover>
      <div className="flex flex-1 flex-col gap-1.5">
        <Button size="sm" onClick={() => ref.current?.click()}>
          <Upload /> Upload screenshot
        </Button>
        {value && (
          <Button size="sm" variant="ghost" onClick={() => onPick(undefined)}>
            Remove
          </Button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          try {
            const rec = await importImageFile(f)
            onPick(rec.id)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed')
          }
        }}
      />
    </div>
  )
}

function ImageSection({ l, project }: { l: ImageLayer; project: Project }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <Section title="Image">
      <div className="flex items-center gap-2">
        <div className="size-14 shrink-0 overflow-hidden rounded-md border border-border-strong">
          <AssetThumb id={l.assetId} />
        </div>
        <Button size="sm" className="flex-1" onClick={() => ref.current?.click()}>
          <Upload /> Replace image
        </Button>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            const [id] = await uploadImages([f], { add: false })
            if (id) useEditor.getState().setLayerAsset(l.id, 'assetId', id)
          }}
        />
      </div>
      {isLinkedIcon(l.assetId) && <p className="text-[11px] text-subtle">Linked to the project's app icon set. It updates when the icon changes. Replace it to unlink.</p>}
      <LangScope project={project} id={l.id} field="assetId" what="image" />
      <Segmented
        value={l.fit}
        onChange={(fit) => upd(l.id, { fit })}
        options={[
          { value: 'cover', label: 'Fill' },
          { value: 'contain', label: 'Fit' },
          { value: 'stretch', label: 'Stretch' },
        ]}
      />
      {l.fit === 'cover' && (
        <>
          <SliderField label="Crop zoom" value={Math.round(l.cropZoom * 100)} onChange={(v) => upd(l.id, { cropZoom: v / 100 })} min={100} max={500} suffix="%" />
          <SliderField label="Crop X" value={Math.round(l.cropX * 100)} onChange={(v) => upd(l.id, { cropX: v / 100 })} min={0} max={100} suffix="%" />
          <SliderField label="Crop Y" value={Math.round(l.cropY * 100)} onChange={(v) => upd(l.id, { cropY: v / 100 })} min={0} max={100} suffix="%" />
        </>
      )}
      <SliderField label="Radius" value={l.cornerRadius} onChange={(cornerRadius) => upd(l.id, { cornerRadius })} min={0} max={Math.round(Math.min(l.width, l.height) / 2)} />
      <Row label="Border">
        <ColorPicker value={l.border?.color ?? '#FFFFFF'} onChange={(color) => upd(l.id, { border: { width: l.border?.width || 4, color } })} />
        <NumberField value={l.border?.width ?? 0} min={0} max={200} suffix="px" onChange={(width) => upd(l.id, { border: { color: l.border?.color ?? '#FFFFFF', width } })} />
      </Row>
    </Section>
  )
}

function ShapeSection({ l, project }: { l: ShapeLayer; project: Project }) {
  return (
    <>
      <Section title={l.shape === 'line' ? 'Line' : 'Fill'}>
        {l.shape === 'line' ? (
          <ColorField label="Color" value={l.fill.kind === 'solid' ? l.fill.color : '#FFFFFF'} colorRef={l.fill.kind === 'solid' ? l.fill.ref : undefined} theme={project.theme} onChange={(color, ref) => upd(l.id, { fill: { kind: 'solid', color, ref } })} />
        ) : (
          <FillEditor fill={l.fill} theme={project.theme} onChange={(fill) => upd(l.id, { fill })} />
        )}
      </Section>
      <Section title="Shape">
        {l.shape === 'rect' && <SliderField label="Radius" value={l.cornerRadius} onChange={(cornerRadius) => upd(l.id, { cornerRadius })} min={0} max={Math.round(Math.min(l.width, l.height) / 2)} />}
        {l.shape !== 'line' && (
          <Row label="Border">
            <ColorPicker value={l.stroke?.color ?? '#FFFFFF'} onChange={(color) => upd(l.id, { stroke: { ...l.stroke, width: l.stroke?.width || 4, color } })} />
            <NumberField value={l.stroke?.width ?? 0} min={0} max={200} suffix="px" onChange={(width) => upd(l.id, { stroke: { ...l.stroke, color: l.stroke?.color ?? '#FFFFFF', width } })} />
          </Row>
        )}
        <SliderField label="Dash" value={l.stroke?.dash ?? 0} onChange={(dash) => upd(l.id, { stroke: { color: l.stroke?.color ?? '#FFFFFF', width: l.stroke?.width ?? 0, dash } })} min={0} max={100} />
        <SliderField label="Blur" value={l.blur ?? 0} onChange={(blur) => upd(l.id, { blur })} min={0} max={300} />
        {l.shape === 'blob' && (
          <Button size="sm" className="w-full" onClick={() => upd(l.id, { points: blobPoints(Math.floor(Math.random() * 100000)) })}>
            <Dices /> New random blob
          </Button>
        )}
      </Section>
    </>
  )
}

const PRESET_LABELS: Record<Exclude<PerspectivePreset, 'custom'>, string> = {
  straight: 'Straight',
  slight: 'Slight tilt',
  left: 'Left',
  right: 'Right',
  floating: 'Floating',
  dramatic: 'Dramatic',
}

function DeviceSection({ l, project }: { l: DeviceLayer; project: Project }) {
  const frame = getFrame(l.frameId)
  const setPreset = (p: Exclude<PerspectivePreset, 'custom'>) => {
    const patch: Patch = { perspective: { preset: p, ...PERSPECTIVE_PRESETS[p] } }
    if (p === 'floating') patch.shadow = { ...(l.shadow ?? defaultShadow()), enabled: true, blur: Math.round(l.width * 0.18), offsetY: Math.round(l.height * 0.08), opacity: 0.35 }
    upd(l.id, patch)
  }
  const setP = (patch: Partial<DeviceLayer['perspective']>) => upd(l.id, { perspective: { ...l.perspective, ...patch, preset: 'custom' } })
  return (
    <>
      <Section title="Device">
        <Row label="Frame">
          <Select
            value={l.frameId}
            onChange={(frameId) => {
              const f = getFrame(frameId)
              const h = Math.round(l.width / deviceAspect(f))
              upd(l.id, { frameId, name: f.name, height: h, frameColor: f.colors.some((c) => c.value === l.frameColor) ? l.frameColor : f.defaultColor })
            }}
            options={FRAMES.map((f) => ({ value: f.id, label: f.name }))}
          />
        </Row>
        <Row label="Color">
          <div className="flex flex-wrap items-center gap-1.5">
            {frame.colors.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                onClick={() => upd(l.id, { frameColor: c.value })}
                className={cn('size-6 cursor-pointer rounded-full border-2', l.frameColor === c.value ? 'border-accent' : 'border-border-strong')}
                style={{ background: c.value }}
              />
            ))}
            <ColorPicker value={l.frameColor} allowAlpha={false} onChange={(frameColor) => upd(l.id, { frameColor })} size="sm" />
          </div>
        </Row>
        <Row label="Screen">
          <ScreenPicker value={l.screenAssetId} onPick={(screenAssetId) => useEditor.getState().setLayerAsset(l.id, 'screenAssetId', screenAssetId)} />
        </Row>
        <LangScope project={project} id={l.id} field="screenAssetId" what="screenshot" />
        <Row label="Fit">
          <Segmented value={l.screenFit} onChange={(screenFit) => upd(l.id, { screenFit })} options={[{ value: 'cover', label: 'Fill' }, { value: 'contain', label: 'Fit' }]} />
        </Row>
        <ColorField label="Screen bg" value={l.screenColor} onChange={(screenColor) => upd(l.id, { screenColor })} allowAlpha={false} />
      </Section>
      <Section title="3D perspective">
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(PRESET_LABELS) as Array<Exclude<PerspectivePreset, 'custom'>>).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={cn('cursor-pointer rounded-md border px-1.5 py-1.5 text-[11px]', l.perspective.preset === p ? 'border-accent bg-accent-soft text-fg' : 'border-border text-muted hover:text-fg')}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>
        <SliderField label="Rotate X" value={l.perspective.rotateX} onChange={(rotateX) => setP({ rotateX })} min={-60} max={60} suffix="°" />
        <SliderField label="Rotate Y" value={l.perspective.rotateY} onChange={(rotateY) => setP({ rotateY })} min={-60} max={60} suffix="°" />
        <SliderField label="Rotate Z" value={l.rotation} onChange={(rotation) => upd(l.id, { rotation })} min={-180} max={180} suffix="°" />
        <SliderField label="Depth" value={l.perspective.depth} onChange={(depth) => setP({ depth })} min={1} max={8} step={0.1} precision={1} />
        <SliderField label="Reflection" value={Math.round(l.reflection * 100)} onChange={(v) => upd(l.id, { reflection: v / 100 })} min={0} max={100} suffix="%" />
      </Section>
    </>
  )
}

function ZoomSection({ l, siblings }: { l: ZoomLayer; siblings: Layer[] }) {
  const sources = siblings.filter((s) => s.type === 'image' || s.type === 'device')
  return (
    <Section title="Zoom highlight">
      <Row label="Source">
        <Select
          value={l.sourceId ?? ''}
          placeholder="Choose image or device"
          onChange={(sourceId) => upd(l.id, { sourceId })}
          options={sources.map((s) => ({ value: s.id, label: s.name }))}
        />
      </Row>
      {sources.length === 0 && <p className="text-[11px] text-warning">Add an image or device to this page to magnify it.</p>}
      <SliderField label="Focus X" value={Math.round(l.focusX * 100)} onChange={(v) => upd(l.id, { focusX: v / 100 })} min={0} max={100} suffix="%" />
      <SliderField label="Focus Y" value={Math.round(l.focusY * 100)} onChange={(v) => upd(l.id, { focusY: v / 100 })} min={0} max={100} suffix="%" />
      <SliderField label="Zoom" value={l.zoom} onChange={(zoom) => upd(l.id, { zoom })} min={1} max={8} step={0.1} precision={1} suffix="×" />
      <SliderField label="Size" value={l.width} onChange={(s) => upd(l.id, { width: s, height: s })} min={40} max={2000} />
      <Row label="Border">
        <ColorPicker value={l.borderColor} onChange={(borderColor) => upd(l.id, { borderColor })} />
        <NumberField value={l.borderWidth} min={0} max={100} suffix="px" onChange={(borderWidth) => upd(l.id, { borderWidth })} />
      </Row>
      <Row label="Connector">
        <Switch checked={l.connector} onChange={(connector) => upd(l.id, { connector })} />
        {l.connector && <ColorPicker value={l.connectorColor} onChange={(connectorColor) => upd(l.id, { connectorColor })} size="sm" />}
      </Row>
    </Section>
  )
}

export function LayerProperties({ layer, project, siblings }: { layer: Layer; project: Project; siblings: Layer[] }) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <input
          key={layer.id}
          defaultValue={layer.name}
          onBlur={(e) => useEditor.getState().renameLayer(layer.id, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-[13px] font-medium text-fg outline-none hover:bg-surface focus:bg-surface"
        />
        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">{layer.type}</span>
      </div>
      <TransformSection l={layer} />
      {layer.type === 'text' && <TextSection l={layer} project={project} />}
      {layer.type === 'image' && <ImageSection l={layer} project={project} />}
      {layer.type === 'shape' && <ShapeSection l={layer} project={project} />}
      {layer.type === 'device' && <DeviceSection l={layer} project={project} />}
      {layer.type === 'zoom' && <ZoomSection l={layer} siblings={siblings} />}
      {layer.type === 'group' && (
        <Section title="Group">
          <Button size="sm" className="w-full" onClick={ungroupSelection}>
            <Ungroup /> Ungroup
          </Button>
        </Section>
      )}
      {layer.type !== 'group' && <ShadowSection l={layer} />}
    </>
  )
}

export function MultiProperties({ layers }: { layers: Layer[] }) {
  const st = useEditor.getState()
  const opacity = Math.round((layers.reduce((n, l) => n + l.opacity, 0) / layers.length) * 100)
  return (
    <>
      <div className="border-b border-border px-3 py-2.5 text-[13px] font-medium">{layers.length} layers selected</div>
      <Section title="Align & distribute">
        <AlignBar multi />
      </Section>
      <Section title="Appearance">
        <SliderField
          label="Opacity"
          value={opacity}
          onChange={(v) => st.updateLayers(Object.fromEntries(layers.map((l) => [l.id, { opacity: v / 100 }])))}
          min={0}
          max={100}
          suffix="%"
        />
      </Section>
      <Section title="Arrange">
        <Button size="sm" className="w-full" onClick={groupSelection}>
          <GroupIcon /> Group selection
        </Button>
      </Section>
    </>
  )
}
