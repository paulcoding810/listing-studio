import { lazy, Suspense, useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router'
import { AppShell } from '@/components/dashboard/AppShell'
import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/primitives'
import { loadCustomFonts } from '@/lib/fonts'
import { BrandKit } from '@/pages/BrandKit'
import { Dashboard } from '@/pages/Dashboard'
import { Projects } from '@/pages/Projects'
import { Settings } from '@/pages/Settings'
import { Templates } from '@/pages/Templates'
import { startAutosave } from '@/store/persistence'
import { useProjects } from '@/store/project-store'

const Editor = lazy(() => import('@/pages/Editor').then((m) => ({ default: m.Editor })))

const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/projects', element: <Projects /> },
      { path: '/templates', element: <Templates /> },
      { path: '/brand-kit', element: <BrandKit /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  {
    path: '/editor/:id',
    element: (
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted">Loading editor…</div>}>
        <Editor />
      </Suspense>
    ),
  },
  { path: '*', element: <AppShell /> },
])

export default function App() {
  useEffect(() => {
    void useProjects.getState().refresh()
    void loadCustomFonts()
    return startAutosave()
  }, [])
  return (
    <TooltipProvider delayDuration={400}>
      <RouterProvider router={router} />
      <Toaster />
    </TooltipProvider>
  )
}
