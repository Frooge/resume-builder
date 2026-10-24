import { create } from 'zustand'

export type ToastVariant = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

const DURATION_MS: Record<ToastVariant, number> = {
  success: 2500,
  error: 5000,
}
const MAX_TOASTS = 3

interface ToastStore {
  toasts: Toast[]
  dismiss: (id: number) => void
}

let nextId = 1
const timers = new Map<number, number>()

/** Session-only notifications; kept out of the persisted resume store. */
export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  dismiss: (id) => {
    window.clearTimeout(timers.get(id))
    timers.delete(id)
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

function show(message: string, variant: ToastVariant) {
  const id = nextId++
  useToastStore.setState((state) => ({
    toasts: [...state.toasts, { id, message, variant }].slice(-MAX_TOASTS),
  }))
  timers.set(
    id,
    window.setTimeout(
      () => useToastStore.getState().dismiss(id),
      DURATION_MS[variant],
    ),
  )
}

export const toast = {
  success: (message: string) => show(message, 'success'),
  error: (message: string) => show(message, 'error'),
}
