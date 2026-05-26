/**
 * Minimal interface a Scheduler needs from a rate limiter. Pluggable: supply
 * `createRateLimiter`, `noopRateGate`, or your own.
 */
export interface RateGate {
  /** Returns true iff `cost` units are available right now. */
  canSpend: (cost: number) => boolean
  /** Record a charge of `cost` units. */
  spend: (cost: number) => void
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
  /** Injectable clock. Defaults to `Date.now`. */
  now?: () => number
}

export interface RateLimiter extends RateGate {
  /** Capacity left in window `windowIndex` (in caller-supplied order). */
  remaining: (windowIndex: number) => number
  /** Milliseconds until `cost` units will be available across every window. 0 when affordable. */
  nextAvailableAt: (cost: number) => number
}

/**
 * Multi-window sliding-window rate limiter. Each spend is timestamped and
 * ages out of every window once it falls past `windowMs`. `canSpend(cost)`
 * is true iff every configured window has at least `cost` units left.
 *
 * No external state. Safe to instantiate per caller.
 */
export function createRateLimiter(opts: RateLimiterOptions): RateLimiter {
  if (opts.windows.length === 0) {
    throw new Error("createRateLimiter requires at least one window")
  }
  const now = opts.now ?? Date.now
  const windows = opts.windows
  const longestWindowMs = windows.reduce((longest, window) => Math.max(longest, window.windowMs), 0)
  const spends: Array<{ timestamp: number; cost: number }> = []

  function prune(reference: number): void {
    const cutoff = reference - longestWindowMs
    while (spends.length > 0 && spends[0]!.timestamp <= cutoff) {
      spends.shift()
    }
  }

  function usedSince(reference: number, windowMs: number): number {
    const cutoff = reference - windowMs
    let used = 0
    for (let index = spends.length - 1; index >= 0; index--) {
      const entry = spends[index]!
      if (entry.timestamp <= cutoff) break
      used += entry.cost
    }
    return used
  }

  function remaining(windowIndex: number): number {
    const window = windows[windowIndex]
    if (window === undefined) return 0
    const currentMs = now()
    prune(currentMs)
    return Math.max(0, window.capacity - usedSince(currentMs, window.windowMs))
  }

  function canSpend(cost: number): boolean {
    const currentMs = now()
    prune(currentMs)
    for (const window of windows) {
      const left = window.capacity - usedSince(currentMs, window.windowMs)
      if (left < cost) return false
    }
    return true
  }

  function spend(cost: number): void {
    spends.push({ timestamp: now(), cost })
  }

  function waitForWindow(reference: number, window: RateWindow, cost: number): number {
    const cutoff = reference - window.windowMs
    let used = 0
    for (let index = spends.length - 1; index >= 0; index--) {
      const entry = spends[index]!
      if (entry.timestamp <= cutoff) break
      used += entry.cost
      if (window.capacity - used < cost) {
        return Math.max(0, entry.timestamp + window.windowMs - reference)
      }
    }
    return 0
  }

  function nextAvailableAt(cost: number): number {
    const currentMs = now()
    prune(currentMs)
    let worst = 0
    for (const window of windows) {
      const wait = waitForWindow(currentMs, window, cost)
      if (wait > worst) worst = wait
    }
    return worst
  }

  return { canSpend, spend, remaining, nextAvailableAt }
}

/** Always-affordable RateGate. Use to disable gating entirely. */
export const noopRateGate: RateGate = {
  canSpend: () => true,
  spend: () => {},
}
