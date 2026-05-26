import { createCoalescer } from "@async/guard/coalesce.ts"
import { createStaleGuard } from "@async/guard/stale.ts"

export { type CreditLimiter, type CreditLimiterOptions, createCreditLimiter } from "@async/credit.ts"
export type { Coalescer } from "@async/guard/coalesce.ts"
export type { StaleGuard, StaleStamp } from "@async/guard/stale.ts"
export { createPollController, type PollController, type PollControllerOptions, PollMode } from "@async/poll.ts"

/**
 * Race-condition guards. Each entry is a factory. The resulting state
 * machine's types (`Coalescer`, `StaleGuard`) are exported at the top level.
 */
export const Guards = {
  /** Deduplicate concurrent calls by key. Hits return the in-flight promise. */
  coalesce: createCoalescer,
  /** Stamp each request and reject results that arrive after a newer stamp has been issued. */
  stale: createStaleGuard,
} as const
export {
  createRateLimiter,
  noopRateGate,
  type RateGate,
  type RateLimiter,
  type RateLimiterOptions,
  type RateWindow,
} from "@async/rate.ts"
export {
  createScheduler,
  ExecuteOutcome,
  type Scheduler,
  type SchedulerOptions,
  SchedulerPhase,
  type SchedulerTask,
} from "@async/scheduler.ts"
