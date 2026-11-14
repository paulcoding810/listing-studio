import { AppWindow, ArrowRight, Globe, Plus, Smartphone, Tablet, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageHeader } from '@/components/dashboard/AppShell'
import { NewProjectDialog } from '@/components/dashboard/NewProjectDialog'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { TemplateCard } from '@/components/dashboard/TemplateCard'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { importBackup } from '@/lib/backup'
import { useProjects } from '@/store/project-store'
import { TEMPLATES } from '@/templates'
import type { StoreId } from '@/types/target'

const QUICK: Array<{ store: StoreId; title: string; body: string; icon: typeof Smartphone; color: string }> = [
  { store: 'google-play', title: 'Google Play', body: 'Phone, tablet, feature graphic', icon: Smartphone, color: '#34A853' },
  { store: 'app-store', title: 'App Store', body: 'iPhone 6.9" and iPad 13"', icon: Tablet, color: '#0A84FF' },
  { store: 'chrome-web-store', title: 'Chrome Web Store', body: 'Screenshots and promo tiles', icon: Globe, color: '#F4B400' },
  { store: 'icon', title: 'App icon', body: 'One design, every store size', icon: AppWindow, color: '#A78BFA' },
]

export function ImportBackupButton() {
  const ref = useRef<HTMLInputElement>(null)
  const nav = useNavigate()
  const refresh = useProjects((s) => s.refresh)
  return (
    <>
      <Button onClick={() => ref.current?.click()}>
        <Upload /> Import backup
      </Button>
      <input
        ref={ref}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          try {
            const p = await importBackup(f)
            await refresh()
            toast.success(`Imported “${p.name}”`)
            nav(`/editor/${p.id}`)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Import failed')
          }
        }}
      />
    </>
  )
}

export function Dashboard() {
  const projects = useProjects((s) => s.projects)
  const loaded = useProjects((s) => s.loaded)
  const [open, setOpen] = useState(false)
  const [store, setStore] = useState<StoreId>('google-play')
  const start = (s: StoreId) => {
    setStore(s)
    setOpen(true)
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Dashboard"
        subtitle="Design store listing graphics for every marketplace from one workspace."
        actions={
          <>
            <ImportBackupButton />
            <Button variant="primary" onClick={() => start('google-play')}>
              <Plus /> New project
            </Button>
          </>
        }
      />
      <div className="grid gap-3 px-6 sm:grid-cols-2 lg:grid-cols-5 lg:px-10">
        <button
          type="button"
          onClick={() => start('google-play')}
          className="flex cursor-pointer flex-col justify-between rounded-xl border border-accent/40 bg-gradient-to-br from-accent/25 to-accent/5 p-4 text-left transition-colors hover:border-accent"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-white">
            <Plus className="size-5" />
          </span>
          <span className="mt-6">
            <span className="block text-sm font-semibold">Blank project</span>
            <span className="text-xs text-muted">Any store, any size</span>
          </span>
        </button>
        {QUICK.map((q) => (
          <button
            key={q.store}
            type="button"
            onClick={() => start(q.store)}
            className="flex cursor-pointer flex-col justify-between rounded-xl border border-border bg-panel p-4 text-left transition-colors hover:border-border-strong"
          >
            <span className="flex size-9 items-center justify-center rounded-lg" style={{ background: `${q.color}22`, color: q.color }}>
              <q.icon className="size-5" />
            </span>
            <span className="mt-6">
              <span className="block text-sm font-semibold">{q.title}</span>
              <span className="text-xs text-muted">{q.body}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="px-6 pt-10 lg:px-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Recent projects</h2>
          {projects.length > 0 && (
            <Link to="/projects" className="flex items-center gap-1 text-xs text-muted hover:text-fg">
              View all <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
        {loaded && projects.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-14 text-center">
            <div className="mb-4 flex -space-x-3">
              {['#8B5CF6', '#EC4899', '#22C55E'].map((c, i) => (
                <div key={c} className="h-20 w-11 rounded-xl border-2 border-bg shadow-xl" style={{ background: c, transform: `rotate(${(i - 1) * 10}deg)` }} />
              ))}
            </div>
            <h3 className="text-base font-semibold">Create your first listing</h3>
            <p className="mt-1 max-w-md text-sm text-muted">Start from a template below or a blank canvas sized for Google Play, the App Store or the Chrome Web Store.</p>
            <Button variant="primary" className="mt-5" onClick={() => start('google-play')}>
              <Plus /> New project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.slice(0, 8).map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      <section className="px-6 pt-10 lg:px-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Start from a template</h2>
          <Link to="/templates" className="flex items-center gap-1 text-xs text-muted hover:text-fg">
            Browse all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TEMPLATES.slice(0, 8).map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </div>
      </section>
      <NewProjectDialog key={store + String(open)} open={open} onOpenChange={setOpen} initialStore={store} />
    </div>
  )
}
