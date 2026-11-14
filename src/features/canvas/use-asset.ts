import { useEffect, useSyncExternalStore } from 'react'
import { getCachedAsset, loadAsset, subscribeAssets } from '@/lib/assets'

export function useAsset(id: string | undefined) {
  const img = useSyncExternalStore(subscribeAssets, () => getCachedAsset(id))
  useEffect(() => {
    if (id && !img) void loadAsset(id)
  }, [id, img])
  return img
}
