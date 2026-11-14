import { findLayer, locatePage } from '@/lib/doc'
import { useEditor } from '@/store/editor-store'
import type { Layer } from '@/types/project'
import { CanvasProperties } from './CanvasProperties'
import { LayerProperties, MultiProperties } from './LayerProperties'

export function PropertiesPanel() {
  const project = useEditor((s) => s.project)
  const activePageId = useEditor((s) => s.activePageId)
  const selectedIds = useEditor((s) => s.selectedIds)
  if (!project || !activePageId) return null
  const loc = locatePage(project, activePageId)
  if (!loc) return null
  const layers = selectedIds.map((id) => findLayer(project, id)).filter((l) => !!l)
  if (layers.length === 0) return <CanvasProperties project={project} spread={loc.spread} pageId={activePageId} />
  if (layers.length > 1) return <MultiProperties layers={layers.map((l) => l.layer as Layer)} />
  const one = layers[0]
  const siblings = one.container as Layer[]
  return <LayerProperties key={one.layer.id} layer={one.layer as Layer} project={project} siblings={siblings} />
}
