import { useToastStore } from '../../store/toastStore'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === 'error' ? 'alert' : 'status'}
          className={`toast-enter pointer-events-auto flex max-w-sm items-center gap-3 rounded-md px-3 py-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${
            t.variant === 'error'
              ? 'bg-red-700 text-white'
              : 'bg-zinc-900 text-white'
          }`}
        >
          <span
            aria-hidden
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
              t.variant === 'error'
                ? 'bg-white text-red-700'
                : 'bg-emerald-400 text-zinc-900'
            }`}
          >
            {t.variant === 'error' ? '!' : '✓'}
          </span>
          <span className="min-w-0 flex-1">{t.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismiss(t.id)}
            className="-mr-1 shrink-0 rounded px-1 text-sm leading-none text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
