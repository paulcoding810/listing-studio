import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { PageHeader } from '@/components/dashboard/AppShell'
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { ThemeEditor } from '@/components/editor/ThemeEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { useAsset } from '@/features/canvas/use-asset'
import { importImageFile } from '@/lib/assets'
import { DEFAULT_THEME } from '@/lib/factory'
import { uid } from '@/lib/utils'
import { useProjects } from '@/store/project-store'
import type { BrandKit as Kit } from '@/types/project'

function Logo({ id }: { id?: string }) {
  const img = useAsset(id)
  const src = img instanceof HTMLImageElement ? img.src : img instanceof HTMLCanvasElement ? img.toDataURL() : undefined
  return src ? <img src={src} alt="Logo" className="size-full object-contain" /> : <ImagePlus className="size-5 text-subtle" />
}

function KitCard({ kit }: { kit: Kit }) {
  const save = useProjects((s) => s.saveKit)
  const del = useProjects((s) => s.deleteKit)
  const [deleting, setDeleting] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const update = (patch: Partial<Kit>) => save({ ...kit, ...patch, updatedAt: Date.now() })
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <div className="mb-4 flex items-center gap-3">
        <button type="button" onClick={() => file.current?.click()} className="checker flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border p-1.5" title="Upload logo">
          <Logo id={kit.logoAssetId} />
        </button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              const a = await importImageFile(f)
              update({ logoAssetId: a.id })
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Upload failed')
            }
          }}
        />
        <Input defaultValue={kit.name} onBlur={(e) => e.target.value.trim() && update({ name: e.target.value.trim() })} className="font-medium" />
        <Button variant="ghost" size="icon" onClick={() => setDeleting(true)} aria-label="Delete kit">
          <Trash2 />
        </Button>
      </div>
      <ThemeEditor theme={kit.theme} onChange={(theme) => update({ theme })} />
      <div className="mt-4 flex h-16 overflow-hidden rounded-lg">
        {(['background', 'primary', 'secondary', 'accent', 'text'] as const).map((k) => (
          <div key={k} className="flex flex-1 items-end p-1.5 text-[10px]" style={{ background: kit.theme.colors[k], color: k === 'text' || k === 'accent' ? '#000' : '#fff' }}>
            <span style={{ fontFamily: `"${kit.theme.fonts.heading}"` }} className="font-bold">
              Aa
            </span>
          </div>
        ))}
      </div>
      <ConfirmDialog open={deleting} onOpenChange={setDeleting} title="Delete brand kit?" message={`“${kit.name}” will be removed. Projects keep their current colors.`} onConfirm={() => del(kit.id)} />
    </div>
  )
}

export function BrandKit() {
  const kits = useProjects((s) => s.brandKits)
  const save = useProjects((s) => s.saveKit)
  const add = () => {
    const now = Date.now()
    void save({ id: uid(), name: `Brand ${kits.length + 1}`, theme: structuredClone(DEFAULT_THEME), createdAt: now, updatedAt: now })
  }
  return (
    <div className="pb-16">
      <PageHeader
        title="Brand Kit"
        subtitle="Save colors, fonts and a logo. Apply a kit in the editor to restyle every linked element at once."
        actions={
          <Button variant="primary" onClick={add}>
            <Plus /> New brand kit
          </Button>
        }
      />
      <div className="grid gap-4 px-6 md:grid-cols-2 lg:px-10 xl:grid-cols-3">
        {kits.map((k) => (
          <KitCard key={k.id} kit={k} />
        ))}
      </div>
      {kits.length === 0 && (
        <div className="mx-6 rounded-2xl border border-dashed border-border-strong px-6 py-14 text-center lg:mx-10">
          <h3 className="text-base font-semibold">No brand kits yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">Template colors and fonts are linked to theme slots. A brand kit swaps those slots for your own.</p>
          <Button variant="primary" className="mt-5" onClick={add}>
            <Plus /> Create brand kit
          </Button>
        </div>
      )}
    </div>
  )
}
