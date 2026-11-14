import { AppWindow, LayoutTemplate, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { linkedIconId, useLinkedIcon } from '@/features/canvas/linked-icon'
import { addLinkedIcon, iconSpreadOf, placeIconOnGraphics } from '@/features/editor-actions'
import { APPLE_RADIUS } from '@/features/icons'
import { useEditor } from '@/store/editor-store'
import type { Project } from '@/types/project'
import { Section } from './controls'

export function placeIconEverywhere() {
  const n = placeIconOnGraphics()
  if (n) toast.success(`Placed the app icon on ${n} graphic${n > 1 ? 's' : ''}. It stays linked to the icon set.`)
  else toast.info('No promo tiles or feature graphics without the icon. Add one with “Add set”.')
}

function Preview({ project, spreadId }: { project: Project; spreadId: string }) {
  const { img } = useLinkedIcon(project, linkedIconId(spreadId))
  const [url, setUrl] = useState<string>()
  useEffect(() => setUrl(img?.toDataURL('image/png')), [img])
  return (
    <div className="checker size-14 shrink-0 overflow-hidden border border-border" style={{ borderRadius: `${APPLE_RADIUS * 100}%` }}>
      {url && <img src={url} alt="App icon" className="size-full" />}
    </div>
  )
}

export function AppIconAssets() {
  const project = useEditor((s) => s.project)
  if (!project) return null
  const icon = iconSpreadOf(project)
  return (
    <Section title="App icon">
      {icon ? (
        <div className="flex items-center gap-3">
          <Preview project={project} spreadId={icon.id} />
          <div className="flex flex-1 flex-col gap-1.5">
            <Button size="sm" onClick={addLinkedIcon}>
              <Plus /> Place on this image
            </Button>
            <Button size="sm" variant="ghost" onClick={placeIconEverywhere}>
              <LayoutTemplate /> On all tiles & graphics
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[11px] leading-snug text-subtle">Design the icon once and place it on promo tiles and the feature graphic. Placed icons stay linked and update when the icon changes.</p>
          <Button size="sm" className="w-full" onClick={() => useEditor.getState().addSpread('icon/master', 1)}>
            <AppWindow /> Create app icon set
          </Button>
        </>
      )}
    </Section>
  )
}
