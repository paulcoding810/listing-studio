import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Dialog>
  )
}

export function RenameDialog({
  open,
  onOpenChange,
  initial,
  title = 'Rename',
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: string
  title?: string
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(initial)
  const submit = () => {
    if (!name.trim()) return
    onSubmit(name.trim())
    onOpenChange(false)
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setName(initial)
        onOpenChange(v)
      }}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim()}>
            Save
          </Button>
        </>
      }
    >
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
    </Dialog>
  )
}
