import { Images, Layers, LayoutTemplate, Shapes } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AssetsPanel } from '@/components/editor/AssetsPanel'
import { EditorCanvas } from '@/components/editor/EditorCanvas'
import { ExportDialog } from '@/components/editor/ExportDialog'
import { LayersPanel } from '@/components/editor/LayersPanel'
import { PagesPanel } from '@/components/editor/PagesPanel'
import { PreviewDialog } from '@/components/editor/PreviewDialog'
import { PropertiesPanel } from '@/components/editor/PropertiesPanel'
import { TemplatesPanel } from '@/components/editor/TemplatesPanel'
import { Toolbar } from '@/components/editor/Toolbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives'
import { useEditorShortcuts } from '@/hooks/use-editor-shortcuts'
import { projectsDb } from '@/lib/db'
import { ensureProjectFonts } from '@/lib/fonts'
import { resetHistory, useEditor } from '@/store/editor-store'
import { flushPendingSave } from '@/store/persistence'

export function Editor() {
  const { id } = useParams()
  const project = useEditor((s) => s.project)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [tab, setTab] = useState('pages')
  const [exporting, setExporting] = useState(false)
  const [preview, setPreview] = useState<'gallery' | 'listing' | null>(null)
  const openExport = useCallback(() => setExporting(true), [])
  useEditorShortcuts(openExport)

  useEffect(() => {
    let live = true
    setState('loading')
    projectsDb.get(id ?? '').then((p) => {
      if (!live) return
      if (!p) return setState('missing')
      useEditor.getState().load(p)
      resetHistory()
      void ensureProjectFonts(p)
      setState('ready')
    })
    const beforeUnload = () => flushPendingSave()
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      live = false
      window.removeEventListener('beforeunload', beforeUnload)
      flushPendingSave()
      useEditor.getState().close()
      resetHistory()
    }
  }, [id])

  useEffect(() => {
    if (project) document.title = `${project.name} · Listing Studio`
    return () => {
      document.title = 'Listing Studio'
    }
  }, [project?.name]) // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'missing')
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted">This project does not exist in this browser.</p>
        <Link to="/" className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-white hover:bg-accent-hover">
          Back to dashboard
        </Link>
      </div>
    )
  if (state === 'loading' || !project) return <div className="flex h-full items-center justify-center text-sm text-muted">Loading project…</div>

  return (
    <div className="flex h-full flex-col">
      <Toolbar onExport={openExport} onPreview={setPreview} />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-panel">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border p-2">
              <TabsList>
                <TabsTrigger value="pages">
                  <Images /> Pages
                </TabsTrigger>
                <TabsTrigger value="layers">
                  <Layers /> Layers
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <LayoutTemplate />
                </TabsTrigger>
                <TabsTrigger value="assets">
                  <Shapes /> Assets
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="pages" className="min-h-0 flex-1 overflow-y-auto">
              <PagesPanel />
            </TabsContent>
            <TabsContent value="layers" className="min-h-0 flex-1">
              <LayersPanel />
            </TabsContent>
            <TabsContent value="templates" className="min-h-0 flex-1 overflow-y-auto">
              <TemplatesPanel />
            </TabsContent>
            <TabsContent value="assets" className="min-h-0 flex-1 overflow-y-auto">
              <AssetsPanel />
            </TabsContent>
          </Tabs>
        </aside>
        <EditorCanvas />
        <aside className="w-72 shrink-0 overflow-y-auto border-l border-border bg-panel">
          <PropertiesPanel />
        </aside>
      </div>
      <ExportDialog open={exporting} onOpenChange={setExporting} />
      <PreviewDialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)} initialMode={preview ?? 'gallery'} />
    </div>
  )
}
