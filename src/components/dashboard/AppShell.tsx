import { FolderOpen, LayoutDashboard, LayoutTemplate, Palette, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'My Projects', icon: FolderOpen },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/brand-kit', label: 'Brand Kit', icon: Palette },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  return (
    <div className="flex h-full">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-panel md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Logo />
          <div>
            <div className="text-[15px] font-semibold leading-tight">Listing Studio</div>
            <div className="text-[11px] text-subtle">Store graphics, local-first</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive ? 'bg-accent-soft text-fg' : 'text-muted hover:bg-surface hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('size-4', isActive && 'text-accent')} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <div className="rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-muted">
            Everything is stored in this browser. Export a backup from a project menu to move it elsewhere.
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-panel px-3 py-2 md:hidden">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn('shrink-0 rounded-md px-2.5 py-1.5 text-xs', isActive ? 'bg-accent-soft text-fg' : 'text-muted')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-5 pt-8 lg:px-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
