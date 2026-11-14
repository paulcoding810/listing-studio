import { DropdownMenu as DM } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Menu({ trigger, children, align = 'end' }: { trigger: ReactNode; children: ReactNode; align?: 'start' | 'end' | 'center' }) {
  return (
    <DM.Root>
      <DM.Trigger asChild>{trigger}</DM.Trigger>
      <DM.Portal>
        <DM.Content align={align} sideOffset={4} className="z-[60] min-w-44 rounded-lg border border-border bg-panel p-1 shadow-2xl shadow-black/60">
          {children}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  )
}

export function MenuItem({ children, onSelect, danger, shortcut }: { children: ReactNode; onSelect: () => void; danger?: boolean; shortcut?: string }) {
  return (
    <DM.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none data-[highlighted]:bg-accent-soft [&_svg]:size-3.5 [&_svg]:text-muted',
        danger ? 'text-danger [&_svg]:text-danger' : 'text-fg',
      )}
    >
      {children}
      {shortcut && <span className="ml-auto pl-4 text-[11px] text-subtle">{shortcut}</span>}
    </DM.Item>
  )
}

export const MenuSeparator = () => <DM.Separator className="my-1 h-px bg-border" />
