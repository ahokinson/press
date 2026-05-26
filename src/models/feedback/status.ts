import { createSignal, getOwner, onCleanup } from "solid-js"

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
   * Cancel any pending dismiss/trail timers. Safe to call repeatedly.
   *
   * Called automatically via `onCleanup` when `createStatusState` runs inside
   * a Solid reactive owner (component body, `createRoot`). Outside an owner,
   * call this on teardown.
   */
  dispose: () => void
}

const TRAIL_LENGTH = 3

/**
 * Two unrelated signals that share the same status line:
 *
 * - a transient `message` that auto-dismisses with a shrinking trail
 * - a `busy` reason that stays put until the caller clears it
 *
 * Wire `message`/`trail`/`busy.reason()` into `StatusBar`'s `trailing` slot
 * and `busy.active()` into its `busy` flag. The component never owns timing.
 * This primitive does.
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
    for (const timer of trailTimers) clearTimeout(timer)
    trailTimers = []
  }

  function showMessage(text: string, durationMilliseconds = 3000) {
    clearTimers()
    setMessage(text)
    setTrail(` ${"┄".repeat(TRAIL_LENGTH)}`)

    const step = durationMilliseconds / TRAIL_LENGTH
    for (let index = 1; index <= TRAIL_LENGTH; index++) {
      trailTimers.push(
        setTimeout(() => {
          setTrail(` ${"┄".repeat(TRAIL_LENGTH - index)}`)
        }, step * index),
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

  if (getOwner() !== null) onCleanup(dispose)

  return { message, trail, showMessage, busy, dispose }
}

/**
 * Standard precedence for a `StatusBar` trailing slot:
 *
 *   transient message (with shrinking trail) > busy reason > caller fallback
 *
 * Pure composition over `StatusState`. Plug into
 * `<StatusBar trailing={composeTrailing(status, fallback)} />`.
 */
export function composeTrailing(status: StatusState, fallback: () => string): () => string {
  return () => {
    const message = status.message()
    if (message) return message + status.trail()
    const reason = status.busy.reason()
    if (reason) return reason
    return fallback()
  }
}
