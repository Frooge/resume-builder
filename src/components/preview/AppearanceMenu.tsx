import { useEffect, useState } from 'react'
import { useResumeStore } from '../../store/resumeStore'
import type { FontSizeId, PageMargins, ResumeFontId } from '../../types/resume'
import {
  DEFAULT_RESUME_STYLE,
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  normalizeResumeStyle,
} from '../../lib/typography'
import { ToolbarMenu } from './ToolbarMenu'

const MARGIN_FIELDS: { key: keyof PageMargins; label: string }[] = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' },
]

const MARGIN_MIN = 16
const MARGIN_MAX = 96

function clampMargin(n: number): number {
  return Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, Math.round(n)))
}

function MarginInput({
  label,
  value,
  onCommit,
}: {
  label: string
  value: number
  onCommit: (n: number) => void
}) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const n = Number(draft)
    if (!Number.isFinite(n)) {
      setDraft(String(value))
      return
    }
    const next = clampMargin(n)
    setDraft(String(next))
    if (next !== value) onCommit(next)
  }

  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] text-zinc-500">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => {
          const v = e.target.value
          if (v === '' || /^\d{0,3}$/.test(v)) setDraft(v)
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-zinc-500"
      />
    </label>
  )
}

export function AppearanceMenu() {
  const rawStyle = useResumeStore((s) => s.style)
  const style = normalizeResumeStyle(rawStyle)
  const setStyle = useResumeStore((s) => s.setStyle)

  return (
    <ToolbarMenu label="Appearance" align="right">
      {() => (
        <div
          className="w-[220px] py-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Font
          </p>
          {FONT_OPTIONS.map((f) => {
            const active = style.fontFamily === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStyle({ fontFamily: f.id as ResumeFontId })}
                className={`flex w-full items-center px-3 py-1.5 text-left text-xs hover:bg-zinc-50 ${
                  active ? 'bg-zinc-50 font-medium text-zinc-900' : 'text-zinc-700'
                }`}
                style={{ fontFamily: f.css }}
              >
                {f.label}
                {active ? (
                  <span className="ml-auto text-[10px] text-zinc-400">✓</span>
                ) : null}
              </button>
            )
          })}
          <div className="my-1 border-t border-zinc-100" />
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Size
          </p>
          {FONT_SIZE_OPTIONS.map((f) => {
            const active = style.fontSize === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStyle({ fontSize: f.id as FontSizeId })}
                className={`flex w-full items-center px-3 py-1.5 text-left text-xs hover:bg-zinc-50 ${
                  active ? 'bg-zinc-50 font-medium text-zinc-900' : 'text-zinc-700'
                }`}
              >
                {f.label}
                {active ? (
                  <span className="ml-auto text-[10px] text-zinc-400">✓</span>
                ) : null}
              </button>
            )
          })}
          <div className="my-1 border-t border-zinc-100" />
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Page margins (px)
          </p>
          <div className="grid grid-cols-2 gap-2 px-3 pb-2">
            {MARGIN_FIELDS.map(({ key, label }) => (
              <MarginInput
                key={key}
                label={label}
                value={style.margins[key] ?? DEFAULT_RESUME_STYLE.margins[key]}
                onCommit={(n) =>
                  setStyle({ margins: { [key]: n } as Partial<PageMargins> })
                }
              />
            ))}
          </div>
        </div>
      )}
    </ToolbarMenu>
  )
}
