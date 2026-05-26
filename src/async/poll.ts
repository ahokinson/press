import { type Accessor, createEffect, createSignal, onCleanup, type Setter } from "solid-js"

export enum PollMode {
  Active = "active",
  Paused = "paused",
  Disabled = "disabled",
}

export interface PollControllerOptions {
  intervalMs: number
  initialMode?: PollMode
  /** Offset (ms) before the first tick fires. */
  initialDelayMs?: number
  onTick: () => Promise<void> | void
}

export interface PollController {
  mode: Accessor<PollMode>
  setMode: Setter<PollMode>
  lastTickAt: Accessor<number | null>
  /** Run a tick immediately if one isn't already in flight. Resolves when the tick completes. */
  force: () => Promise<void>
}

/**
 * Drives a single periodic task. Coalesces overlapping ticks by skipping
 * scheduled runs while one is still executing. `force()` runs immediately if
 * not already running and returns the tick's promise.
 *
 * Mode semantics:
 * - `Active`   — periodic ticks scheduled.
 * - `Paused`   — timer is cleared. Transitioning back to `Active` fires a
 *                tick immediately (no `intervalMs` wait).
 * - `Disabled` — same as `Paused` for the timer. Conventional opt-out for
 *                callers that only use `force()`.
 */
export function createPollController(opts: PollControllerOptions): PollController {
  const [mode, setMode] = createSignal<PollMode>(opts.initialMode ?? PollMode.Active)
  const [lastTickAt, setLastTickAt] = createSignal<number | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null
  let running = false
  let disposed = false
  let firstActiveRun = true

  async function run(): Promise<void> {
    if (running) return
    running = true
    try {
      await opts.onTick()
      setLastTickAt(Date.now())
    } finally {
      running = false
    }
  }

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function schedule(delayMs: number): void {
    if (disposed) return
    clearTimer()
    timer = setTimeout(() => {
      timer = null
      if (mode() !== PollMode.Active) return
      void run().finally(() => {
        if (mode() === PollMode.Active) schedule(opts.intervalMs)
      })
    }, delayMs)
  }

  createEffect(() => {
    if (mode() === PollMode.Active) {
      const delay = firstActiveRun ? (opts.initialDelayMs ?? 0) : 0
      firstActiveRun = false
      schedule(delay)
    } else {
      clearTimer()
    }
  })

  onCleanup(() => {
    disposed = true
    clearTimer()
  })

  return {
    mode,
    setMode,
    lastTickAt,
    force: run,
  }
}
