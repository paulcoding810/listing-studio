import type Konva from 'konva'

let current: Konva.Stage | null = null
let fitFn: (() => void) | null = null

export const stageRegistry = {
  set(s: Konva.Stage | null) {
    current = s
  },
  get() {
    return current
  },
  setFit(fn: (() => void) | null) {
    fitFn = fn
  },
  fit() {
    fitFn?.()
  },
}

export function nodeRectInParent(id: string) {
  const node = current?.findOne(`#${id}`)
  const parent = node?.getParent()
  if (!node || !parent) return undefined
  return node.getClientRect({ relativeTo: parent as Konva.Container, skipShadow: true })
}
