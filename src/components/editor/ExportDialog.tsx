import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/input'
import { Checkbox, Segmented, Slider } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'
import { deliver, exportImages, fileName, type ExportedFile, type ExportJob, type ExportOptions } from '@/features/export/export'
import { settingsDb } from '@/lib/db'
import { formatBytes, validateCount, validateSize } from '@/lib/validation'
import { getStore, getTarget } from '@/targets'
import { useEditor } from '@/store/editor-store'
import { localeName } from './LocalizationDialog'
import type { ExportDefaults } from '@/pages/Settings'

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const project = useEditor((s) => s.project)
  const activePageId = useEditor((s) => s.activePageId)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [locales, setLocales] = useState<Set<string>>(new Set())
  const [opts, setOpts] = useState<ExportOptions>({ format: 'png', quality: 0.92, scale: 1, naming: '{index}-{page}', profile: 'zip' })
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null)
  const [results, setResults] = useState<ExportedFile[] | null>(null)

  useEffect(() => {
    if (!open || !project) return
    setSelected(new Set(project.spreads.flatMap((s) => s.pages.map((p) => p.id))))
    setLocales(new Set([project.locales[0]]))
    setResults(null)
    settingsDb.get<ExportDefaults>('exportDefaults').then((d) => d && setOpts((o) => ({ ...o, format: d.format, scale: d.scale })))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const jobs: ExportJob[] = useMemo(() => {
    if (!project) return []
    const out: ExportJob[] = []
    for (const locale of project.locales.filter((l) => locales.has(l)))
      project.spreads.forEach((s) => s.pages.forEach((p, i) => selected.has(p.id) && out.push({ spreadId: s.id, pageIndex: i, locale })))
    return out
  }, [project, selected, locales])

  if (!project) return null

  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })

  const run = async () => {
    setBusy({ done: 0, total: jobs.length })
    setResults(null)
    try {
      const files = await exportImages(project, jobs, opts, (done, total) => setBusy({ done, total }))
      await deliver(project, files)
      setResults(files)
      const errs = files.filter((f) => f.issues.some((i) => i.level === 'error')).length
      if (errs) toast.error(`${errs} file${errs > 1 ? 's' : ''} may be rejected by the store. See details.`)
      else toast.success(`Exported ${files.length} image${files.length > 1 ? 's' : ''}`)
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !busy && onOpenChange(v)}
      title="Export"
      description="Images are rendered at full resolution in your browser. Nothing is uploaded."
      className="w-[min(900px,calc(100vw-32px))]"
      footer={
        <>
          {busy && (
            <div className="mr-auto flex items-center gap-2 text-xs text-muted">
              <Loader2 className="size-3.5 animate-spin" /> Rendering {busy.done}/{busy.total}
              <div className="h-1 w-40 overflow-hidden rounded bg-surface-2">
                <div className="h-full bg-accent transition-all" style={{ width: `${(busy.done / Math.max(1, busy.total)) * 100}%` }} />
              </div>
            </div>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!busy}>
            Close
          </Button>
          <Button variant="primary" onClick={run} disabled={!!busy || jobs.length === 0}>
            <Download /> Export {jobs.length} {jobs.length === 1 ? 'image' : 'images'}
            {jobs.length > 1 ? ' as ZIP' : ''}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="mr-auto">Images</Label>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(project.spreads.flatMap((s) => s.pages.map((p) => p.id))))}>
              All
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(activePageId ? [activePageId] : []))}>
              Current only
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              None
            </Button>
          </div>
          {project.spreads.map((s) => {
            const t = getTarget(s.targetId)
            const w = Math.round(s.width * opts.scale)
            const h = Math.round(s.height * opts.scale)
            const count = s.pages.filter((p) => selected.has(p.id)).length
            const issues = [...validateSize(t, w, h), ...(count ? validateCount(t, count) : []), ...(!t.formats.includes(opts.format) ? [{ level: 'error' as const, message: `${getStore(t.store).name} requires ${t.formats.join('/').toUpperCase()} for this asset.` }] : [])]
            return (
              <div key={s.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-xs font-medium">
                    {getStore(t.store).name} · {t.label}
                  </div>
                  <span className="font-mono text-[11px] text-subtle">
                    {w}×{h}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {s.pages.map((p, i) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                      <Checkbox checked={selected.has(p.id)} onChange={() => toggle(p.id)} /> {i + 1}. {p.name}
                    </label>
                  ))}
                </div>
                {count > 0 && issues.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {issues.map((i, k) => (
                      <div key={k} className={`flex gap-1.5 text-[11px] ${i.level === 'error' ? 'text-danger' : 'text-warning'}`}>
                        <AlertCircle className="mt-px size-3 shrink-0" /> {i.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {results && (
            <div className="rounded-lg border border-border p-3">
              <Label>Last export</Label>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {results.map((f) => (
                  <div key={f.path} className="flex items-start gap-2 text-[11px]">
                    {f.issues.some((i) => i.level === 'error') ? <AlertCircle className="mt-px size-3 shrink-0 text-danger" /> : <CheckCircle2 className="mt-px size-3 shrink-0 text-success" />}
                    <div className="min-w-0">
                      <div className="truncate font-mono text-muted">
                        {f.path} · {f.width}×{f.height} · {formatBytes(f.blob.size)}
                      </div>
                      {f.issues.map((i, k) => (
                        <div key={k} className={i.level === 'error' ? 'text-danger' : 'text-warning'}>
                          {i.message}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Format</Label>
            <Segmented value={opts.format} onChange={(format) => setOpts({ ...opts, format })} options={[{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }]} />
          </div>
          {opts.format === 'jpg' && (
            <div className="space-y-1.5">
              <Label>Quality · {Math.round(opts.quality * 100)}%</Label>
              <Slider value={opts.quality * 100} onChange={(v) => setOpts({ ...opts, quality: v / 100 })} min={50} max={100} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Output size</Label>
            <Segmented
              value={String(opts.scale)}
              onChange={(v) => setOpts({ ...opts, scale: Number(v) })}
              options={[
                { value: '0.5', label: '0.5×' },
                { value: '1', label: '1× store' },
                { value: '2', label: '2×' },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Languages</Label>
            <div className="space-y-1">
              {project.locales.map((l) => (
                <label key={l} className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                  <Checkbox
                    checked={locales.has(l)}
                    onChange={() =>
                      setLocales((s) => {
                        const n = new Set(s)
                        if (n.has(l)) n.delete(l)
                        else n.add(l)
                        return n
                      })
                    }
                  />
                  {localeName(l)} <span className="text-subtle">{l}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Folder layout</Label>
            <Segmented
              value={opts.profile}
              onChange={(profile) => setOpts({ ...opts, profile })}
              options={[
                { value: 'zip', label: 'By store' },
                { value: 'fastlane', label: 'fastlane' },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Label>File naming</Label>
            <Input value={opts.naming} onChange={(e) => setOpts({ ...opts, naming: e.target.value || '{index}' })} className="font-mono text-xs" />
            <p className="text-[11px] leading-snug text-subtle">Tokens: {'{index} {page} {project} {store} {set} {locale} {w} {h}'}</p>
            {jobs[0] && <p className="truncate font-mono text-[11px] text-muted">{fileName(project, jobs[0], opts)}</p>}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
