import { createRateLimiter, type RateLimiter } from "@async/rate.ts"

export interface CreditLimiterOptions {
  /** Credits per rolling 60-second window. */
  perMinute: number
  /** Credits per rolling 24-hour window. */
  perDay: number
  /** Injectable clock. Defaults to `Date.now`. */
  now?: () => number
}

/**
 * Two-window convenience over `createRateLimiter` for the common "N per
 * minute, M per day" shape. `minuteRemaining` and `dailyRemaining` expose
 * per-window capacity. The rest comes from the underlying `RateLimiter`.
 */
export interface CreditLimiter extends RateLimiter {
  minuteRemaining: () => number
  dailyRemaining: () => number
  /** @deprecated Use `nextAvailableAt`. Kept for backwards compatibility. */
  nextCreditAt: (cost: number) => number
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
    nextCreditAt: (cost) => inner.nextAvailableAt(cost),
  }
}
