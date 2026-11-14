import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { create } from 'zustand'
import { uid } from '@/lib/utils'

type Kind = 'info' | 'success' | 'error'
interface Toast {
  id: string
  kind: Kind
  message: string
}

const useToasts = create<{ items: Toast[]; push: (k: Kind, m: string) => void; dismiss: (id: string) => void }>((set) => ({
  items: [],
  push: (kind, message) => {
    const id = uid()
    set((s) => ({ items: [...s.items.slice(-3), { id, kind, message }] }))
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), kind === 'error' ? 6000 : 3200)
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

export const toast = {
  info: (m: string) => useToasts.getState().push('info', m),
  success: (m: string) => useToasts.getState().push('success', m),
  error: (m: string) => useToasts.getState().push('error', m),
}

const icons = { info: Info, success: CheckCircle2, error: AlertTriangle }
const tones = { info: 'text-accent', success: 'text-success', error: 'text-danger' }

export function Toaster() {
  const { items, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {items.map((t) => {
          const Icon = icons[t.kind]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.16 }}
              className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-2xl shadow-black/50"
              role="status"
            >
              <Icon className={`mt-0.5 size-4 shrink-0 ${tones[t.kind]}`} />
              <p className="flex-1 text-[13px] leading-snug text-fg">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="cursor-pointer text-subtle hover:text-fg" aria-label="Dismiss">
                <X className="size-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
