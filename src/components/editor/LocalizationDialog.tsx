import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import { walkLayers } from '@/lib/doc'
import { useEditor } from '@/store/editor-store'
import type { TextLayer } from '@/types/project'

export const LOCALES: Array<[string, string]> = [
  ['en-US', 'English (US)'],
  ['en-GB', 'English (UK)'],
  ['de-DE', 'German'],
  ['fr-FR', 'French'],
  ['es-ES', 'Spanish (Spain)'],
  ['es-419', 'Spanish (Latin America)'],
  ['it-IT', 'Italian'],
  ['pt-BR', 'Portuguese (Brazil)'],
  ['pt-PT', 'Portuguese (Portugal)'],
  ['nl-NL', 'Dutch'],
  ['sv-SE', 'Swedish'],
  ['pl-PL', 'Polish'],
  ['tr-TR', 'Turkish'],
  ['ru-RU', 'Russian'],
  ['uk', 'Ukrainian'],
  ['ar', 'Arabic'],
  ['hi-IN', 'Hindi'],
  ['id', 'Indonesian'],
  ['vi', 'Vietnamese'],
  ['th', 'Thai'],
  ['ja-JP', 'Japanese'],
  ['ko-KR', 'Korean'],
  ['zh-Hans', 'Chinese (Simplified)'],
  ['zh-Hant', 'Chinese (Traditional)'],
]

export const localeName = (code: string) => LOCALES.find(([c]) => c === code)?.[1] ?? code

export function LocalizationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const project = useEditor((s) => s.project)
  const [adding, setAdding] = useState('')
  if (!project) return null
  const st = useEditor.getState()
  const [def, ...others] = project.locales
  const rows: Array<{ page: string; layer: TextLayer }> = []
  project.spreads.forEach((s) => {
    walkLayers(s.sharedLayers, (l) => l.type === 'text' && l.localizable && rows.push({ page: `${s.name} (shared)`, layer: l }))
    s.pages.forEach((p) => walkLayers(p.layers, (l) => l.type === 'text' && l.localizable && l.text.trim() && rows.push({ page: p.name, layer: l })))
  })
  const available = LOCALES.filter(([c]) => !project.locales.includes(c))

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Languages & translations"
      description="Translate every text layer marked for localization. Export produces one folder per language."
      className="w-[min(1100px,calc(100vw-32px))]"
      footer={<Button onClick={() => onOpenChange(false)}>Done</Button>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {project.locales.map((l, i) => (
          <span key={l} className="flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs">
            {localeName(l)} <span className="text-subtle">{l}</span>
            {i === 0 ? (
              <span className="ml-1 text-[10px] text-accent">default</span>
            ) : (
              <button
                type="button"
                className="cursor-pointer text-subtle hover:text-danger"
                aria-label={`Remove ${l}`}
                onClick={() => st.removeLocale(l)}
              >
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
        <div className="flex items-center gap-1.5">
          <Select className="w-52" value={adding} placeholder="Add language…" onChange={setAdding} options={available.map(([c, n]) => ({ value: c, label: `${n} (${c})` }))} />
          <Button
            size="sm"
            disabled={!adding}
            onClick={() => {
              st.mutate((p) => {
                if (!p.locales.includes(adding)) p.locales.push(adding)
              })
              setAdding('')
            }}
          >
            <Plus /> Add
          </Button>
        </div>
      </div>
      {others.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Add a language to start translating.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-xs">
            <thead>
              <tr className="text-subtle">
                <th className="sticky top-0 w-28 border-b border-border bg-panel py-2 pr-2 font-medium">Image</th>
                <th className="sticky top-0 min-w-56 border-b border-border bg-panel py-2 pr-2 font-medium">{localeName(def)}</th>
                {others.map((l) => (
                  <th key={l} className="sticky top-0 min-w-56 border-b border-border bg-panel py-2 pr-2 font-medium">
                    {localeName(l)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ page, layer }) => (
                <tr key={layer.id} className="align-top">
                  <td className="border-b border-border/60 py-2 pr-2 text-muted">{page}</td>
                  <td className="whitespace-pre-wrap border-b border-border/60 py-2 pr-2 text-fg">{layer.text}</td>
                  {others.map((l) => (
                    <td key={l} className="border-b border-border/60 py-1.5 pr-2">
                      <textarea
                        rows={Math.max(1, layer.text.split('\n').length)}
                        defaultValue={project.strings[l]?.[layer.id] ?? ''}
                        placeholder={layer.text}
                        onBlur={(e) => {
                          const v = e.target.value
                          st.mutate((p) => {
                            const t = (p.strings[l] ??= {})
                            if (v.trim()) t[layer.id] = v
                            else delete t[layer.id]
                          })
                        }}
                        className="w-full resize-y rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-fg outline-none placeholder:text-subtle/60 focus:border-accent/70"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Dialog>
  )
}
