import type { CSSProperties, ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SECTION_LABELS, type SectionId } from '../../types/resume'
import { isPinnedSection } from '../../lib/sectionOrder'
import { useResumeStore } from '../../store/resumeStore'
import { GripIcon } from '../icons'

interface AccordionSectionProps {
  id: SectionId
  children: ReactNode
}

export function AccordionSection({ id, children }: AccordionSectionProps) {
  const open = useResumeStore((s) => s.ui.openSections.includes(id))
  const toggleSection = useResumeStore((s) => s.toggleSection)
  const hidden = useResumeStore((s) => s.resume.hiddenSections.includes(id))
  const toggleSectionHidden = useResumeStore((s) => s.toggleSectionHidden)
  const label = SECTION_LABELS[id]
  const pinned = isPinnedSection(id)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: pinned })

  // Translate only — Transform includes scaleX/Y which stretches items of different heights
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      id={`editor-section-${id}`}
      className={`border-b border-zinc-200 bg-white last:border-b-0 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center hover:bg-zinc-50">
        {pinned ? (
          <span className="ml-2 w-5 shrink-0" aria-hidden />
        ) : (
          <button
            type="button"
            className="ml-2 flex h-7 w-5 shrink-0 cursor-grab items-center justify-center rounded text-zinc-400 hover:text-zinc-700 active:cursor-grabbing"
            aria-label={`Reorder ${label} section`}
            {...attributes}
            {...listeners}
          >
            <GripIcon />
          </button>
        )}
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="flex flex-1 items-center justify-between gap-2 py-3 pl-1 pr-2 text-left text-sm font-semibold tracking-wide text-zinc-800"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            <span className={hidden ? 'text-zinc-400' : undefined}>{label}</span>
            {hidden ? (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Hidden
              </span>
            ) : null}
          </span>
          <span
            className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          >
            ▾
          </span>
        </button>
        {id !== 'contact' ? (
          <button
            type="button"
            onClick={() => toggleSectionHidden(id)}
            className="mr-2 flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700"
            aria-label={hidden ? `Show ${label} section` : `Hide ${label} section`}
            aria-pressed={hidden}
            title={hidden ? 'Show on resume' : 'Hide from resume'}
          >
            {hidden ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
      {open ? <div className="space-y-3 px-4 pb-4">{children}</div> : null}
    </section>
  )
}

function EyeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2" />
      <path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
      />
    </label>
  )
}

/** Normalize pasted/typed dates to YYYY-MM when possible. */
export function normalizeMonthYear(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  // Already YYYY-MM
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed

  // YYYY-MM-DD → drop day
  const ymd = trimmed.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/)
  if (ymd) return `${ymd[1]}-${ymd[2]}`

  // MM/YYYY or M/YYYY
  const my = trimmed.match(/^(\d{1,2})[/.-](\d{4})$/)
  if (my) return `${my[2]}-${my[1].padStart(2, '0')}`

  // YYYY/MM or YYYY.MM
  const ym = trimmed.match(/^(\d{4})[/.-](\d{1,2})$/)
  if (ym) return `${ym[1]}-${ym[2].padStart(2, '0')}`

  // "March 2022" / "Mar 2022"
  const named = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (named) {
    const months = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ]
    const short = months.map((m) => m.slice(0, 3))
    const name = named[1].toLowerCase()
    let idx = months.indexOf(name)
    if (idx < 0) idx = short.indexOf(name.slice(0, 3))
    if (idx >= 0) return `${named[2]}-${String(idx + 1).padStart(2, '0')}`
  }

  return trimmed
}

interface MonthYearFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MonthYearField({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = 'YYYY-MM',
}: MonthYearFieldProps) {
  const monthValue = /^\d{4}-\d{2}$/.test(value) ? value : ''

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-500">
        {label}
      </span>
      <input
        type="month"
        value={monthValue}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData('text')
          const normalized = normalizeMonthYear(pasted)
          if (normalized && normalized !== pasted.trim()) {
            e.preventDefault()
            onChange(normalized)
          } else if (/^\d{4}-\d{2}/.test(normalized)) {
            e.preventDefault()
            onChange(normalized.slice(0, 7))
          }
        }}
        className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-400"
      />
    </label>
  )
}

interface TextAreaProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: TextAreaProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-500">
        {label}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
      />
    </label>
  )
}
