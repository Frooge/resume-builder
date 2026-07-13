import type { ReactNode } from 'react'
import { SECTION_LABELS, type SectionId } from '../../types/resume'
import { useResumeStore } from '../../store/resumeStore'

interface AccordionSectionProps {
  id: SectionId
  children: ReactNode
}

export function AccordionSection({ id, children }: AccordionSectionProps) {
  const open = useResumeStore((s) => s.ui.openSections.includes(id))
  const toggleSection = useResumeStore((s) => s.toggleSection)

  return (
    <section
      id={`editor-section-${id}`}
      className="border-b border-zinc-200 last:border-b-0"
    >
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold tracking-wide text-zinc-800 hover:bg-zinc-50"
        aria-expanded={open}
      >
        <span>{SECTION_LABELS[id]}</span>
        <span
          className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open ? <div className="space-y-3 px-4 pb-4">{children}</div> : null}
    </section>
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
