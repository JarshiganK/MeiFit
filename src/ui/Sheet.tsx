import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { en } from '../copy/en'
import { IconButton } from './IconButton'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
}

/**
 * Bottom sheet for pickers. Built on <dialog>, so focus is trapped, Escape
 * closes it and the rest of the page is inert while it's open.
 */
export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // Backdrop clicks close the sheet; keyboard users have Escape and the Close button.
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={() => {
        if (open) onClose()
      }}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (event.target === event.currentTarget) onClose()
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-b-0 border-border bg-surface p-0 text-text shadow-sheet open:animate-sheet-in backdrop:bg-scrim backdrop:animate-fade-in"
    >
      <div className="px-safe pb-safe">
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <header className="flex items-start gap-2 pt-2">
          <div className="min-w-0 flex-1 pt-2">
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton label={en.common.close} icon={<X size={22} />} onClick={onClose} />
        </header>
        <div className="pb-6 pt-4">{children}</div>
      </div>
    </dialog>
  )
}
