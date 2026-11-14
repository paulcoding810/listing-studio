import { useMemo } from 'react'
import { Group } from 'react-konva'
import { BackgroundNode } from './background'
import { LayerNode } from './nodes'
import type { Layer, Page, Spread } from '@/types/project'

export function LayerList({ layers }: { layers: Layer[] }) {
  const siblings = useMemo(() => new Map(layers.map((l) => [l.id, l])), [layers])
  return (
    <>
      {layers.map((l) => (
        <LayerNode key={l.id} layer={l} siblings={siblings} />
      ))}
    </>
  )
}

export function PageBackground({ spread, page, index, x = 0 }: { spread: Spread; page: Page; index: number; x?: number }) {
  const own = page.background
  const seamless = spread.seamless && !own
  return (
    <BackgroundNode
      bg={own ?? spread.background}
      x={x}
      width={spread.width}
      height={spread.height}
      offsetX={seamless ? index * spread.width : 0}
      totalWidth={seamless ? spread.width * spread.pages.length : spread.width}
      pageId={page.id}
    />
  )
}

export function PageScene({ spread, index }: { spread: Spread; index: number }) {
  const page = spread.pages[index]
  return (
    <Group clipX={0} clipY={0} clipWidth={spread.width} clipHeight={spread.height}>
      <PageBackground spread={spread} page={page} index={index} />
      <Group name="shared-container" x={-index * spread.width}>
        <LayerList layers={spread.sharedLayers} />
      </Group>
      <Group name="page-container" pageId={page.id}>
        <LayerList layers={page.layers} />
      </Group>
    </Group>
  )
}
