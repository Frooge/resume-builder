import { useResumeStore } from '../../store/resumeStore'
import type { FontSizeId, ResumeFontId } from '../../types/resume'
import { FONT_OPTIONS, FONT_SIZE_OPTIONS } from '../../lib/typography'
import { ToolbarMenu } from './ToolbarMenu'

export function AppearanceMenu() {
  const style = useResumeStore((s) => s.style)
  const setStyle = useResumeStore((s) => s.setStyle)

  return (
    <ToolbarMenu label="Appearance" align="right">
      {() => (
        <div className="w-[200px] py-1">
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
        </div>
      )}
    </ToolbarMenu>
  )
}
