import { Checkbox as CheckboxP, Popover as PopoverP, Select as SelectP, Slider as SliderP, Switch as SwitchP, Tabs as TabsP, Tooltip as TooltipP } from 'radix-ui'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}) {
  return (
    <SliderP.Root
      className={cn('relative flex h-5 w-full touch-none select-none items-center', className)}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
    >
      <SliderP.Track className="relative h-1 grow rounded-full bg-surface-2">
        <SliderP.Range className="absolute h-full rounded-full bg-accent" />
      </SliderP.Track>
      <SliderP.Thumb className="block size-3.5 rounded-full border-2 border-accent bg-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" />
    </SliderP.Root>
  )
}

export function Switch({ checked, onChange, className }: { checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <SwitchP.Root
      checked={checked}
      onCheckedChange={onChange}
      className={cn('relative h-[18px] w-8 shrink-0 cursor-pointer rounded-full bg-surface-2 transition-colors data-[state=checked]:bg-accent', className)}
    >
      <SwitchP.Thumb className="block size-3.5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[15px]" />
    </SwitchP.Root>
  )
}

export function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <CheckboxP.Root
      checked={checked}
      onCheckedChange={(v) => onChange(v === true)}
      className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded border border-border-strong bg-surface data-[state=checked]:border-accent data-[state=checked]:bg-accent"
    >
      <CheckboxP.Indicator>
        <Check className="size-3 text-white" strokeWidth={3} />
      </CheckboxP.Indicator>
    </CheckboxP.Root>
  )
}

export interface SelectOption {
  value: string
  label: ReactNode
  group?: string
}

export function Select({
  value,
  onChange,
  options,
  className,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  className?: string
  placeholder?: string
}) {
  const groups = [...new Set(options.map((o) => o.group ?? ''))]
  return (
    <SelectP.Root value={value} onValueChange={onChange}>
      <SelectP.Trigger
        className={cn(
          'flex h-8 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 text-left text-[13px] text-fg outline-none hover:bg-surface-2 focus:border-accent/70',
          className,
        )}
      >
        <span className="truncate">
          <SelectP.Value placeholder={placeholder} />
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted" />
      </SelectP.Trigger>
      <SelectP.Portal>
        <SelectP.Content position="popper" sideOffset={4} className="z-[60] max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-panel shadow-2xl shadow-black/50">
          <SelectP.Viewport className="p-1">
            {groups.map((g) => (
              <SelectP.Group key={g}>
                {g && <SelectP.Label className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-subtle">{g}</SelectP.Label>}
                {options
                  .filter((o) => (o.group ?? '') === g)
                  .map((o) => (
                    <SelectP.Item
                      key={o.value}
                      value={o.value}
                      className="relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-7 pr-2 text-[13px] text-fg outline-none data-[highlighted]:bg-accent-soft"
                    >
                      <SelectP.ItemIndicator className="absolute left-2">
                        <Check className="size-3.5 text-accent" />
                      </SelectP.ItemIndicator>
                      <SelectP.ItemText>{o.label}</SelectP.ItemText>
                    </SelectP.Item>
                  ))}
              </SelectP.Group>
            ))}
          </SelectP.Viewport>
        </SelectP.Content>
      </SelectP.Portal>
    </SelectP.Root>
  )
}

export const Tabs = TabsP.Root

export function TabsList({ className, ...p }: TabsP.TabsListProps) {
  return <TabsP.List className={cn('flex gap-0.5 rounded-lg bg-bg p-0.5', className)} {...p} />
}

export function TabsTrigger({ className, ...p }: TabsP.TabsTriggerProps) {
  return (
    <TabsP.Trigger
      className={cn(
        'flex h-7 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted transition-colors hover:text-fg data-[state=active]:bg-surface-2 data-[state=active]:text-fg [&_svg]:size-3.5',
        className,
      )}
      {...p}
    />
  )
}

export const TabsContent = TabsP.Content

export function Tip({ label, children, side = 'bottom' }: { label: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipP.Root>
      <TooltipP.Trigger asChild>{children}</TooltipP.Trigger>
      <TooltipP.Portal>
        <TooltipP.Content side={side} sideOffset={6} className="z-[70] rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-fg shadow-lg">
          {label}
        </TooltipP.Content>
      </TooltipP.Portal>
    </TooltipP.Root>
  )
}

export const TooltipProvider = TooltipP.Provider

export function Popover({ trigger, children, className, align = 'start', side = 'bottom' }: { trigger: ReactNode; children: ReactNode; className?: string; align?: 'start' | 'center' | 'end'; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <PopoverP.Root>
      <PopoverP.Trigger asChild>{trigger}</PopoverP.Trigger>
      <PopoverP.Portal>
        <PopoverP.Content
          align={align}
          side={side}
          sideOffset={6}
          collisionPadding={12}
          className={cn('z-[60] rounded-xl border border-border bg-panel p-3 shadow-2xl shadow-black/60 outline-none', className)}
        >
          {children}
        </PopoverP.Content>
      </PopoverP.Portal>
    </PopoverP.Root>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: ReactNode; title?: string }>
  className?: string
}) {
  return (
    <div className={cn('flex rounded-md border border-border bg-surface p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex h-6 flex-1 cursor-pointer items-center justify-center gap-1 rounded px-1.5 text-xs text-muted transition-colors hover:text-fg [&_svg]:size-3.5',
            value === o.value && 'bg-surface-2 text-fg shadow-sm',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
