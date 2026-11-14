import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/dashboard/AppShell'
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/primitives'
import { toast } from '@/components/ui/toast'
import { clearAllData, settingsDb } from '@/lib/db'
import { formatBytes } from '@/lib/validation'
import { modKey } from '@/lib/utils'
import { STORES, TARGETS, staleTargets } from '@/targets'
import { useProjects } from '@/store/project-store'

export interface ExportDefaults {
  format: 'png' | 'jpg'
  scale: number
}

export const SHORTCUTS: Array<[string, string]> = [
  [`${modKey} Z`, 'Undo'],
  [`${modKey} ⇧ Z`, 'Redo'],
  [`${modKey} D`, 'Duplicate'],
  [`${modKey} C / V`, 'Copy / paste layers or images'],
  [`${modKey} G`, 'Group selection'],
  [`${modKey} ⇧ G`, 'Ungroup'],
  [`${modKey} A`, 'Select all on page'],
  [`${modKey} S`, 'Save now'],
  [`${modKey} E`, 'Export'],
  ['Delete', 'Delete selection'],
  ['Arrows', 'Nudge 1px (⇧ for 10px)'],
  ['Space + drag', 'Pan canvas'],
  [`${modKey} scroll`, 'Zoom'],
  [`${modKey} 0 / 1`, 'Fit / 100%'],
  ['T', 'Add text'],
  ['Double-click text', 'Edit text inline'],
  ['Esc', 'Clear selection'],
]

export function Settings() {
  const [usage, setUsage] = useState<{ usage?: number; quota?: number }>({})
  const [defaults, setDefaults] = useState<ExportDefaults>({ format: 'png', scale: 1 })
  const [clearing, setClearing] = useState(false)
  const refresh = useProjects((s) => s.refresh)
  const stale = staleTargets()

  useEffect(() => {
    navigator.storage?.estimate?.().then(setUsage).catch(() => undefined)
    settingsDb.get<ExportDefaults>('exportDefaults').then((d) => d && setDefaults(d))
  }, [])
  const saveDefaults = (d: ExportDefaults) => {
    setDefaults(d)
    void settingsDb.set('exportDefaults', d)
  }

  return (
    <div className="max-w-5xl pb-16">
      <PageHeader title="Settings" subtitle="Preferences, storage and the store specification registry." />
      <div className="space-y-6 px-6 lg:px-10">
        <section className="rounded-xl border border-border bg-panel p-5">
          <h2 className="text-sm font-semibold">Export defaults</h2>
          <div className="mt-4 grid max-w-md grid-cols-[100px_1fr] items-center gap-3">
            <span className="text-xs text-muted">Format</span>
            <Segmented value={defaults.format} onChange={(format) => saveDefaults({ ...defaults, format })} options={[{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }]} />
            <span className="text-xs text-muted">Scale</span>
            <Segmented
              value={String(defaults.scale)}
              onChange={(v) => saveDefaults({ ...defaults, scale: Number(v) })}
              options={[{ value: '0.5', label: '0.5×' }, { value: '1', label: '1× (store size)' }, { value: '2', label: '2×' }]}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-panel p-5">
          <h2 className="text-sm font-semibold">Storage</h2>
          <p className="mt-1 text-xs text-muted">Projects, uploaded images and fonts live in this browser's IndexedDB.</p>
          {usage.quota ? (
            <div className="mt-4 max-w-md">
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-accent" style={{ width: `${Math.max(1, ((usage.usage ?? 0) / usage.quota) * 100)}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {formatBytes(usage.usage ?? 0)} used of {formatBytes(usage.quota)} available
              </p>
            </div>
          ) : null}
          <Button variant="danger" className="mt-4" onClick={() => setClearing(true)}>
            Delete all local data
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-panel p-5">
          <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
          <div className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {SHORTCUTS.map(([k, v]) => (
              <div key={v} className="flex items-center justify-between border-b border-border/60 py-1.5 text-xs">
                <span className="text-muted">{v}</span>
                <kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-fg">{k}</kbd>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-panel p-5">
          <h2 className="text-sm font-semibold">Store specifications</h2>
          <p className="mt-1 text-xs text-muted">Validation rules used for export. Store requirements change, so each entry records when it was last checked against the official page.</p>
          {stale.length > 0 && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
              <AlertTriangle className="size-4" /> {stale.length} specs were verified more than 6 months ago.
            </p>
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-subtle">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Store</th>
                  <th className="py-2 pr-3 font-medium">Asset</th>
                  <th className="py-2 pr-3 font-medium">Sizes</th>
                  <th className="py-2 pr-3 font-medium">Count</th>
                  <th className="py-2 pr-3 font-medium">Checked</th>
                </tr>
              </thead>
              <tbody>
                {TARGETS.filter((t) => t.store !== 'custom').map((t) => (
                  <tr key={t.id} className="border-b border-border/60 align-top">
                    <td className="py-2 pr-3 text-muted">{STORES.find((s) => s.id === t.store)?.name}</td>
                    <td className="py-2 pr-3">
                      {t.sourceUrl ? (
                        <a href={t.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">
                          {t.label} <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        t.label
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-muted">
                      {t.range ? `${t.range.minSide}–${t.range.maxSide}px, ≤${t.range.maxAspect}:1` : t.sizes?.slice(0, 3).map((s) => `${s.w}×${s.h}`).join(', ')}
                    </td>
                    <td className="py-2 pr-3 text-muted">{t.count ? `${t.count.min}–${t.count.max}` : '—'}</td>
                    <td className="py-2 pr-3 text-muted">{t.verifiedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={clearing}
        onOpenChange={setClearing}
        title="Delete all local data?"
        message="Every project, uploaded image, font and brand kit in this browser will be permanently removed."
        confirmLabel="Delete everything"
        onConfirm={async () => {
          await clearAllData()
          await refresh()
          toast.info('All local data deleted')
        }}
      />
    </div>
  )
}
