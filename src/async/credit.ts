import { createRateLimiter, type RateLimiter } from "@async/rate.ts"

export interface CreditLimiterOptions {
  /** Credits per rolling 60-second window. */
  perMinute: number
  /** Credits per rolling 24-hour window. */
  perDay: number
  /** Injectable clock — defaults to `Date.now`. Use a fake in tests. */
  now?: () => number
}

/**
 * Two-window convenience over `createRateLimiter` for the very common
 * "N per minute, M per day" shape (API quotas, polite-poller budgets).
 *
 * Read remaining capacity via the wrapped accessors (`minuteRemaining`,
 * `dailyRemaining`); everything else (`canSpend`, `spend`, `nextAvailableAt`)
 * comes from the underlying `RateLimiter`.
 */
export interface CreditLimiter extends RateLimiter {
  minuteRemaining: () => number
  dailyRemaining: () => number
  /** @deprecated Use `nextAvailableAt`. Kept for backwards compatibility. */
  nextCreditAt: (n: number) => number
}

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * 60_000

export function createCreditLimiter(opts: CreditLimiterOptions): CreditLimiter {
  const inner = createRateLimiter({
    windows: [
      { windowMs: MINUTE_MS, capacity: opts.perMinute },
      { windowMs: DAY_MS, capacity: opts.perDay },
    ],
    now: opts.now,
  })
  return {
    ...inner,
    minuteRemaining: () => inner.remaining(0),
    dailyRemaining: () => inner.remaining(1),
    nextCreditAt: (n) => inner.nextAvailableAt(n),
  }
}
