import { AlertCircle, CheckCircle2, Languages, Save } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Segmented, Select, Switch } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'
import { importImageFile } from '@/lib/assets'
import { uid } from '@/lib/utils'
import { validateCount, validateSize } from '@/lib/validation'
import { getStore, getTarget, TARGETS } from '@/targets'
import { useEditor } from '@/store/editor-store'
import { useProjects } from '@/store/project-store'
import type { Background, PatternKind, Project, Spread } from '@/types/project'
import { ColorPicker, FillEditor, NumberField, Row, Section, SliderField } from './controls'
import { ThemeEditor } from './ThemeEditor'
import { LocalizationDialog } from './LocalizationDialog'

function TargetSection({ spread }: { spread: Spread }) {
  const t = getTarget(spread.targetId)
  const issues = [...validateSize(t, spread.width, spread.height), ...validateCount(t, spread.pages.length)]
  const st = useEditor.getState()
  const sizes = t.sizes ?? [t.defaultSize]
  const sizeKey = `${spread.width}x${spread.height}`
  const known = sizes.some((s) => `${s.w}x${s.h}` === sizeKey)
  return (
    <Section title="Image set">
      <Row label="Target">
        <Select
          value={spread.targetId}
          onChange={(id) => {
            const nt = getTarget(id)
            st.retarget(spread.id, id, nt.defaultSize.w, nt.defaultSize.h)
          }}
          options={TARGETS.map((x) => ({ value: x.id, group: getStore(x.store).name, label: x.label }))}
        />
      </Row>
      <Row label="Preset">
        <Select
          value={known ? sizeKey : 'custom'}
          onChange={(v) => {
            if (v === 'custom') return
            const [w, h] = v.split('x').map(Number)
            st.retarget(spread.id, spread.targetId, w, h)
          }}
          options={[...sizes.map((s) => ({ value: `${s.w}x${s.h}`, label: `${s.w} × ${s.h}${s.label ? ` · ${s.label}` : ''}` })), ...(known ? [] : [{ value: 'custom', label: 'Custom' }])]}
        />
      </Row>
      <div className="grid grid-cols-2 gap-2">
        <NumberField prefix="W" value={spread.width} min={16} max={8192} onChange={(w) => st.retarget(spread.id, spread.targetId, Math.round(w), spread.height)} />
        <NumberField prefix="H" value={spread.height} min={16} max={8192} onChange={(h) => st.retarget(spread.id, spread.targetId, spread.width, Math.round(h))} />
      </div>
      <div className={`space-y-1 rounded-lg px-2.5 py-2 text-[11px] ${issues.length === 0 ? 'bg-success/10 text-success' : issues.some((i) => i.level === 'error') ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
        {issues.length === 0 ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> Meets {getStore(t.store).name} requirements
          </div>
        ) : (
          issues.map((i, k) => (
            <div key={k} className="flex gap-1.5">
              <AlertCircle className="mt-px size-3.5 shrink-0" /> {i.message}
            </div>
          ))
        )}
      </div>
      {spread.pages.length > 1 && (
        <Row label="Seamless">
          <Switch checked={spread.seamless} onChange={(seamless) => st.updateSpread(spread.id, { seamless })} />
          <span className="text-[11px] text-subtle">One background across all {spread.pages.length} images</span>
        </Row>
      )}
    </Section>
  )
}

const PATTERNS: Array<{ value: PatternKind; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'dots', label: 'Dots' },
  { value: 'grid', label: 'Grid' },
  { value: 'diagonal', label: 'Lines' },
  { value: 'waves', label: 'Waves' },
  { value: 'noise', label: 'Grain' },
]

function BackgroundSection({ spread, pageId, project }: { spread: Spread; pageId: string; project: Project }) {
  const st = useEditor.getState()
  const page = spread.pages.find((p) => p.id === pageId)!
  const [scope, setScope] = useState<'set' | 'page'>(page.background ? 'page' : 'set')
  const bg = scope === 'page' ? (page.background ?? spread.background) : spread.background
  const set = (patch: Partial<Background>) => st.setBackground(spread.id, scope === 'page' ? pageId : null, { ...bg, ...patch })
  const pattern = bg.pattern ?? { kind: 'none' as PatternKind, color: '#FFFFFF', size: 40, opacity: 0.15 }
  return (
    <Section title="Background">
      {spread.pages.length > 1 && (
        <Segmented
          value={scope}
          onChange={(v) => {
            setScope(v)
            if (v === 'page' && !page.background) st.setBackground(spread.id, pageId, structuredClone(spread.background))
            if (v === 'set' && page.background) st.setBackground(spread.id, pageId, undefined)
          }}
          options={[
            { value: 'set', label: spread.seamless ? 'Whole set (seamless)' : 'All images' },
            { value: 'page', label: 'This image only' },
          ]}
        />
      )}
      <FillEditor fill={bg.fill} theme={project.theme} onChange={(fill) => set({ fill })} />
      <Row label="Image">
        <label className="flex h-7 flex-1 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-xs text-muted hover:text-fg">
          {bg.image ? 'Replace image' : 'Add image'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                const rec = await importImageFile(f)
                set({ image: { assetId: rec.id, opacity: 1, blur: 0, fit: 'cover' } })
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Upload failed')
              }
            }}
          />
        </label>
        {bg.image && (
          <Button size="sm" variant="ghost" onClick={() => set({ image: undefined })}>
            Remove
          </Button>
        )}
      </Row>
      {bg.image && (
        <>
          <SliderField label="Opacity" value={Math.round(bg.image.opacity * 100)} onChange={(v) => set({ image: { ...bg.image!, opacity: v / 100 } })} min={0} max={100} suffix="%" />
          <SliderField label="Blur" value={bg.image.blur} onChange={(blur) => set({ image: { ...bg.image!, blur } })} min={0} max={120} />
        </>
      )}
      <Row label="Pattern">
        <Select value={pattern.kind} onChange={(kind) => set({ pattern: { ...pattern, kind: kind as PatternKind } })} options={PATTERNS} />
      </Row>
      {pattern.kind !== 'none' && (
        <>
          <Row label="Color">
            <ColorPicker value={pattern.color} allowAlpha={false} onChange={(color) => set({ pattern: { ...pattern, color } })} />
          </Row>
          <SliderField label="Scale" value={pattern.size} onChange={(size) => set({ pattern: { ...pattern, size } })} min={8} max={240} />
          <SliderField label="Opacity" value={Math.round(pattern.opacity * 100)} onChange={(v) => set({ pattern: { ...pattern, opacity: v / 100 } })} min={0} max={100} suffix="%" />
        </>
      )}
      {spread.pages.length > 1 && scope === 'page' && (
        <Button size="sm" className="w-full" onClick={() => {
          st.applyBackgroundToAll(spread.id, pageId)
          setScope('set')
        }}>
          Apply to all images
        </Button>
      )}
    </Section>
  )
}

function ThemeSection({ project }: { project: Project }) {
  const kits = useProjects((s) => s.brandKits)
  const saveKit = useProjects((s) => s.saveKit)
  const st = useEditor.getState()
  return (
    <Section title="Theme & brand">
      <p className="text-[11px] leading-snug text-subtle">Layers linked to theme colors and fonts update together.</p>
      <ThemeEditor theme={project.theme} onChange={(t) => st.setTheme(t)} />
      {kits.length > 0 && (
        <Row label="Brand kit">
          <Select
            value=""
            placeholder="Apply a brand kit…"
            onChange={(id) => {
              const k = kits.find((x) => x.id === id)
              if (!k) return
              st.setTheme(structuredClone(k.theme))
              st.mutate((p) => void (p.brandKitId = k.id))
              toast.success(`Applied “${k.name}”`)
            }}
            options={kits.map((k) => ({ value: k.id, label: k.name }))}
          />
        </Row>
      )}
      <Button
        size="sm"
        className="w-full"
        onClick={async () => {
          const now = Date.now()
          await saveKit({ id: uid(), name: `${project.name} kit`, theme: structuredClone(project.theme), createdAt: now, updatedAt: now })
          toast.success('Saved as brand kit')
        }}
      >
        <Save /> Save theme as brand kit
      </Button>
    </Section>
  )
}

function LocalesSection({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  return (
    <Section title="Localization">
      <div className="flex flex-wrap gap-1">
        {project.locales.map((l, i) => (
          <span key={l} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
            {l}
            {i === 0 && ' (default)'}
          </span>
        ))}
      </div>
      <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
        <Languages /> Manage languages & translations
      </Button>
      <LocalizationDialog open={open} onOpenChange={setOpen} />
    </Section>
  )
}

export function CanvasProperties({ project, spread, pageId }: { project: Project; spread: Spread; pageId: string }) {
  return (
    <>
      <div className="border-b border-border px-3 py-2.5 text-[13px] font-medium">Canvas</div>
      <TargetSection spread={spread} />
      <BackgroundSection key={pageId} spread={spread} pageId={pageId} project={project} />
      <ThemeSection project={project} />
      <LocalesSection project={project} />
    </>
  )
}
