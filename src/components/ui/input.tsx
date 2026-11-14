import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-8 w-full rounded-md border border-border bg-surface px-2.5 text-[13px] text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent/70 focus:ring-2 focus:ring-accent/20',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-[11px] font-medium uppercase tracking-wide text-subtle', className)} {...props} />
}
