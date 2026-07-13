import { useEffect, useRef, useState, type ReactNode } from 'react'

const TOOLBAR_BTN =
  'box-border inline-flex h-8 items-center text-xs font-medium disabled:opacity-60'

interface ToolbarMenuProps {
  label: string
  disabled?: boolean
  align?: 'left' | 'right'
  variant?: 'primary' | 'secondary'
  children: (close: () => void) => ReactNode
}

function useMenuDismiss(
  open: boolean,
  rootRef: React.RefObject<HTMLDivElement | null>,
  setOpen: (open: boolean) => void,
) {
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, rootRef, setOpen])
}

export function ToolbarMenu({
  label,
  disabled = false,
  align = 'right',
  variant = 'secondary',
  children,
}: ToolbarMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useMenuDismiss(open, rootRef, setOpen)

  const buttonClass =
    variant === 'primary'
      ? `${TOOLBAR_BTN} gap-1.5 rounded border border-zinc-900 bg-zinc-900 px-3 text-white hover:bg-zinc-800`
      : `${TOOLBAR_BTN} gap-1.5 rounded border border-zinc-300 bg-white px-3 text-zinc-800 hover:bg-zinc-50`

  return (
    <div ref={rootRef} className="relative inline-flex h-8 items-center">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
      >
        <span>{label}</span>
        <span className="text-[10px] leading-none opacity-70" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute top-full z-30 mt-1 min-w-[200px] rounded border border-zinc-200 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

interface ToolbarSplitMenuProps {
  label: string
  onPrimaryClick: () => void
  disabled?: boolean
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
}

/** Primary action on the left; dropdown caret on the right. */
export function ToolbarSplitMenu({
  label,
  onPrimaryClick,
  disabled = false,
  align = 'left',
  children,
}: ToolbarSplitMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useMenuDismiss(open, rootRef, setOpen)

  return (
    <div ref={rootRef} className="relative inline-flex h-8 items-center">
      <button
        type="button"
        disabled={disabled}
        onClick={onPrimaryClick}
        className={`${TOOLBAR_BTN} rounded-l border border-zinc-300 bg-white px-3 text-zinc-800 hover:bg-zinc-50`}
      >
        {label}
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${label} options`}
        onClick={() => setOpen((v) => !v)}
        className={`${TOOLBAR_BTN} justify-center rounded-r border border-l-0 border-zinc-300 bg-white px-2 text-[10px] leading-none text-zinc-600 hover:bg-zinc-50`}
      >
        ▾
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute top-full z-30 mt-1 min-w-[160px] rounded border border-zinc-200 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

export function ToolbarMenuItem({
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center px-3 py-1.5 text-left text-xs disabled:cursor-default disabled:opacity-40 ${
        danger
          ? 'text-red-700 hover:bg-red-50'
          : 'text-zinc-800 hover:bg-zinc-50'
      }`}
    >
      {children}
    </button>
  )
}

export function ToolbarMenuSeparator() {
  return <div className="my-1 border-t border-zinc-100" role="separator" />
}
