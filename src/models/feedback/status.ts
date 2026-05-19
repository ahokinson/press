import { createSignal } from "solid-js"

export interface BusyHandle {
  active: () => boolean
  reason: () => string | null
  showReason: (message: string) => void
  clear: () => void
}

export interface StatusState {
  message: () => string | null
  trail: () => string
  showMessage: (message: string, durationMilliseconds?: number) => void
  busy: BusyHandle
  /**
   * Cancel any pending dismiss/trail timers. Safe to call repeatedly. Use when
   * tearing down a StatusState outside Solid's reactive owner (tests, ad-hoc
   * scripts) — Solid components should rely on `onCleanup` instead.
   */
  dispose: () => void
}

const TRAIL_LENGTH = 3

/**
 * Pair of two unrelated signals that share the same status line:
 * - a transient `message` that auto-dismisses with a shrinking trail
 * - a `busy` reason that stays put until the caller clears it
 *
 * Callers wire `message`/`trail`/`busy.reason()` into `StatusBar`'s
 * `trailing` slot and `busy.active()` into its `busy` flag. The component
 * never owns timing; this primitive does.
 */
export function createStatusState(): StatusState {
  const [message, setMessage] = createSignal<string | null>(null)
  const [trail, setTrail] = createSignal("")
  const [busyReason, setBusyReason] = createSignal<string | null>(null)
  let dismissTimer: ReturnType<typeof setTimeout> | undefined
  let trailTimers: ReturnType<typeof setTimeout>[] = []

  function clearTimers() {
    if (dismissTimer !== undefined) {
      clearTimeout(dismissTimer)
      dismissTimer = undefined
    }
    for (const t of trailTimers) clearTimeout(t)
    trailTimers = []
  }

  function showMessage(text: string, durationMilliseconds = 3000) {
    clearTimers()
    setMessage(text)
    setTrail(` ${"┄".repeat(TRAIL_LENGTH)}`)

    const step = durationMilliseconds / TRAIL_LENGTH
    for (let i = 1; i <= TRAIL_LENGTH; i++) {
      trailTimers.push(
        setTimeout(() => {
          setTrail(` ${"┄".repeat(TRAIL_LENGTH - i)}`)
        }, step * i),
      )
    }

    dismissTimer = setTimeout(() => {
      setMessage(null)
      setTrail("")
      dismissTimer = undefined
    }, durationMilliseconds)
  }

  const busy: BusyHandle = {
    active: () => busyReason() !== null,
    reason: () => busyReason(),
    showReason: (text: string) => setBusyReason(text),
    clear: () => setBusyReason(null),
  }

  function dispose() {
    clearTimers()
  }

  return { message, trail, showMessage, busy, dispose }
}

/**
 * Standard precedence for a `StatusBar` trailing slot:
 *   transient message (with shrinking trail) > busy reason > caller fallback
 * Pure composition over `StatusState`; the result plugs straight into
 * `<StatusBar trailing={composeTrailing(status, fallback)} />`.
 */
export function composeTrailing(status: StatusState, fallback: () => string): () => string {
  return () => {
    const msg = status.message()
    if (msg) return msg + status.trail()
    const reason = status.busy.reason()
    if (reason) return reason
    return fallback()
  }
}
