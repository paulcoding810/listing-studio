import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/AppShell'
import { NewProjectDialog } from '@/components/dashboard/NewProjectDialog'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/primitives'
import { useProjects } from '@/store/project-store'
import { ImportBackupButton } from './Dashboard'

export function Projects() {
  const projects = useProjects((s) => s.projects)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'updated' | 'name' | 'created'>('updated')
  const [open, setOpen] = useState(false)
  const list = useMemo(() => {
    const f = projects.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
    return [...f].sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'created' ? b.createdAt - a.createdAt : b.updatedAt - a.updatedAt))
  }, [projects, q, sort])

  return (
    <div className="pb-16">
      <PageHeader
        title="My Projects"
        subtitle={`${projects.length} project${projects.length === 1 ? '' : 's'} saved in this browser`}
        actions={
          <>
            <ImportBackupButton />
            <Button variant="primary" onClick={() => setOpen(true)}>
              <Plus /> New project
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-3 px-6 pb-5 lg:px-10">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2 size-4 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" className="pl-8" />
        </div>
        <Segmented
          className="w-72"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'updated', label: 'Last edited' },
            { value: 'created', label: 'Created' },
            { value: 'name', label: 'Name' },
          ]}
        />
      </div>
      <div className="grid gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3 lg:px-10 xl:grid-cols-4">
        {list.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
      </div>
      {list.length === 0 && <p className="px-10 py-16 text-center text-sm text-muted">{q ? 'No projects match your search.' : 'No projects yet.'}</p>}
      <NewProjectDialog key={String(open)} open={open} onOpenChange={setOpen} />
    </div>
  )
}
