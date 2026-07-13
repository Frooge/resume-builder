import type { CSSProperties, ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SectionId } from '../../types/resume'

interface SectionChromeProps {
  id: SectionId
  onEdit: () => void
  children: ReactNode
  disableDrag?: boolean
}

export function SectionChrome({
  id,
  onEdit,
  children,
  disableDrag = false,
}: SectionChromeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: disableDrag })

  // Translate only — Transform includes scaleX/Y which stretches items of different heights
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      data-section={id}
    >
      {/* Invisible bridge so hover stays active when moving to icons (no content-width change) */}
      <div
        className="absolute inset-y-0 -left-9 w-9 [[data-exporting=true]_&]:hidden"
        aria-hidden
      />
      <div className="absolute -left-9 top-0 z-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [[data-exporting=true]_&]:hidden">
        {!disableDrag ? (
          <button
            type="button"
            className="flex h-7 w-7 cursor-grab items-center justify-center rounded border border-zinc-300 bg-white text-zinc-500 shadow-sm active:cursor-grabbing"
            aria-label={`Reorder ${id} section`}
            {...attributes}
            {...listeners}
          >
            <GripIcon />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-500 shadow-sm hover:text-zinc-800"
          aria-label={`Edit ${id} section`}
        >
          <PencilIcon />
        </button>
      </div>
      {children}
    </div>
  )
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <circle cx="5" cy="3.5" r="1.1" />
      <circle cx="9" cy="3.5" r="1.1" />
      <circle cx="5" cy="7" r="1.1" />
      <circle cx="9" cy="7" r="1.1" />
      <circle cx="5" cy="10.5" r="1.1" />
      <circle cx="9" cy="10.5" r="1.1" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
