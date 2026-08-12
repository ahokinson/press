import { Intent } from "@theme"
import { createSignal, getOwner, onCleanup } from "solid-js"

export interface ToastEntry {
  id: number
  text: string
  /** Feedback tone — drives color in `<Toasts>`. Defaults to `Intent.Neutral`. */
  intent: Intent
  /** Optional leading glyph. */
  glyph?: string
}

export interface ToastOptions {
  intent?: Intent
  glyph?: string
  /** Auto-dismiss delay. `0`/`Infinity` pins the toast until dismissed. */
  durationMilliseconds?: number
}

export interface ToastStack {
  toasts: () => ToastEntry[]
  /** Add a toast; returns its id. Auto-dismisses after `durationMilliseconds`. */
  push: (text: string, options?: ToastOptions) => number
  dismiss: (id: number) => void
  clear: () => void
  /** Cancel every pending dismiss timer. Auto-called via `onCleanup` inside a Solid owner. */
  dispose: () => void
}

const DEFAULT_DURATION = 4500

/**
 * A stack of transient notifications with per-toast auto-dismiss. The counterpart to
 * `createStatusState` (which owns a single status-line message): use this when several notices can
 * be on screen at once. Owns the timers; render with `<Toasts toasts={stack.toasts} />`.
 */
export function createToastStack(options?: { defaultDurationMilliseconds?: number }): ToastStack {
  const [toasts, setToasts] = createSignal<ToastEntry[]>([])
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  const defaultDuration = options?.defaultDurationMilliseconds ?? DEFAULT_DURATION
  let seq = 0

  function dismiss(id: number): void {
    const timer = timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  function push(text: string, opts?: ToastOptions): number {
    const id = ++seq
    setToasts((current) => [...current, { id, text, intent: opts?.intent ?? Intent.Neutral, glyph: opts?.glyph }])
    const duration = opts?.durationMilliseconds ?? defaultDuration
    if (duration > 0 && Number.isFinite(duration)) {
      timers.set(
        id,
        setTimeout(() => dismiss(id), duration),
      )
    }
    return id
  }

  function clear(): void {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
    setToasts([])
  }

  if (getOwner() !== null) onCleanup(clear)

  return { toasts, push, dismiss, clear, dispose: clear }
}
