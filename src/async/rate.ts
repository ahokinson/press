/**
 * Minimal interface a Scheduler (or any caller) needs from a rate limiter.
 * Keeps gating policy pluggable — supply your own implementation, the bundled
 * `createRateLimiter`, or `noopRateGate` to disable gating entirely.
 */
export interface RateGate {
  /** Returns true iff `n` units are available right now. */
  canSpend: (n: number) => boolean
  /** Record a charge of `n` units. */
  spend: (n: number) => void
}

export interface RateWindow {
  /** Window length in milliseconds (e.g. 60_000 for "per minute"). */
  windowMs: number
  /** Maximum total cost allowed inside the window. */
  capacity: number
}

export interface RateLimiterOptions {
  /** One or more sliding windows that all must allow the charge. */
  windows: ReadonlyArray<RateWindow>
  /** Injectable clock — defaults to `Date.now`. Use a fake in tests. */
  now?: () => number
}

export interface RateLimiter extends RateGate {
  /** Capacity left in window `i` (in caller-supplied order). */
  remaining: (windowIndex: number) => number
  /** Milliseconds until `n` units will be available across every window. 0 when affordable. */
  nextAvailableAt: (n: number) => number
}

/**
 * Multi-window sliding-window rate limiter. Each spend is timestamped and ages
 * out of every window once it falls past `windowMs`. `canSpend(n)` is true iff
 * every configured window has at least `n` units of remaining capacity.
 *
 * Use `createCreditLimiter` for the common "per minute / per day" convenience.
 *
 * No external state; safe to instantiate per caller. Inject `now()` in tests
 * to advance time deterministically.
 */
export function createRateLimiter(opts: RateLimiterOptions): RateLimiter {
  if (opts.windows.length === 0) {
    throw new Error("createRateLimiter requires at least one window")
  }
  const now = opts.now ?? Date.now
  const windows = opts.windows
  const longestWindowMs = windows.reduce((m, w) => Math.max(m, w.windowMs), 0)
  const spends: Array<{ ts: number; cost: number }> = []

  function prune(reference: number): void {
    const cutoff = reference - longestWindowMs
    while (spends.length > 0 && spends[0]!.ts <= cutoff) {
      spends.shift()
    }
  }

  function usedSince(reference: number, windowMs: number): number {
    const cutoff = reference - windowMs
    let used = 0
    for (let i = spends.length - 1; i >= 0; i--) {
      const entry = spends[i]!
      if (entry.ts <= cutoff) break
      used += entry.cost
    }
    return used
  }

  function remaining(windowIndex: number): number {
    const win = windows[windowIndex]
    if (win === undefined) return 0
    const t = now()
    prune(t)
    return Math.max(0, win.capacity - usedSince(t, win.windowMs))
  }

  function canSpend(n: number): boolean {
    const t = now()
    prune(t)
    for (const win of windows) {
      const left = win.capacity - usedSince(t, win.windowMs)
      if (left < n) return false
    }
    return true
  }

  function spend(n: number): void {
    spends.push({ ts: now(), cost: n })
  }

  function waitForWindow(reference: number, win: RateWindow, n: number): number {
    const cutoff = reference - win.windowMs
    let used = 0
    for (let i = spends.length - 1; i >= 0; i--) {
      const entry = spends[i]!
      if (entry.ts <= cutoff) break
      used += entry.cost
      if (win.capacity - used < n) {
        return Math.max(0, entry.ts + win.windowMs - reference)
      }
    }
    return 0
  }

  function nextAvailableAt(n: number): number {
    const t = now()
    prune(t)
    let worst = 0
    for (const win of windows) {
      const wait = waitForWindow(t, win, n)
      if (wait > worst) worst = wait
    }
    return worst
  }

  return { canSpend, spend, remaining, nextAvailableAt }
}

/**
 * Always-affordable RateGate. Use as `Scheduler({ limiter: noopRateGate })`
 * when you want pure queue ordering without any rate ceiling.
 */
export const noopRateGate: RateGate = {
  canSpend: () => true,
  spend: () => {},
}
