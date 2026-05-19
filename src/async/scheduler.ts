import { noopRateGate, type RateGate } from "@async/rate.ts"
import { type Accessor, createSignal } from "solid-js"

export enum SchedulerPhase {
  Idle = "idle",
  Running = "running",
  Paused = "paused",
}

export enum ExecuteOutcome {
  /** Task completed; scheduler continues to the next task. */
  Ok = "ok",
  /** Caller hit a rate limit or transient block; scheduler stops the current tick and backs off. */
  Backoff = "backoff",
}

export interface SchedulerTask {
  /** Stable identifier (used only for `currentTask` display). */
  id: string
  /** Credits consumed when executed. */
  cost: number
  /** Lower numbers execute first. */
  priority: number
}

export interface SchedulerOptions<TTask extends SchedulerTask> {
  /**
   * Gate that approves each task's cost before it runs. Defaults to
   * `noopRateGate` (unlimited). Pass `createRateLimiter`/`createCreditLimiter`
   * for sliding-window quotas, or supply your own `RateGate` (concurrency
   * semaphore, custom policy, …).
   */
  limiter?: RateGate
  /** Build the next queue from current state. Called at every tick start. */
  buildQueue: () => TTask[]
  /** Execute one task; return Backoff to halt the current tick. */
  onExecute: (task: TTask) => Promise<ExecuteOutcome> | ExecuteOutcome
  /** Idle interval between ticks while running. Default 5_000 ms. */
  intervalMs?: number
  /** Lower bound on inter-tick spacing. Default 2_000 ms. */
  minTickMs?: number
}

export interface Scheduler<TTask extends SchedulerTask> {
  phase: Accessor<SchedulerPhase>
  queue: Accessor<readonly TTask[]>
  currentTask: Accessor<string | null>
  /** Begin scheduling; safe to call when already started. */
  start: () => void
  /** Stop scheduling and clear current task. */
  stop: () => void
  /** Run a tick immediately. Resolves when the tick finishes. */
  force: () => Promise<void>
}

/**
 * Prioritised task queue driven by a credit limiter. The caller defines what
 * tasks exist (`buildQueue`) and how to execute one (`onExecute`); this
 * primitive handles ordering, credit checks, coalescing, and inter-tick
 * scheduling.
 *
 * Phase semantics:
 *   Idle    — initial / `stop()` state. No ticks scheduled.
 *   Running — actively scheduling ticks.
 *   Paused  — entered when a tick produces no executable tasks (queue empty
 *             or all over budget). Re-enters Running on the next tick.
 *
 * Coalescing: overlapping `force()` calls are deduped (a second call while a
 * tick runs is a no-op promise that resolves when the in-flight tick finishes).
 */
export function createScheduler<TTask extends SchedulerTask>(opts: SchedulerOptions<TTask>): Scheduler<TTask> {
  const intervalMs = opts.intervalMs ?? 5_000
  const minTickMs = opts.minTickMs ?? 2_000
  const limiter: RateGate = opts.limiter ?? noopRateGate

  const [phase, setPhase] = createSignal<SchedulerPhase>(SchedulerPhase.Idle)
  const [queue, setQueue] = createSignal<readonly TTask[]>([])
  const [currentTask, setCurrentTask] = createSignal<string | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight: Promise<void> | null = null
  let stopped = true

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function scheduleNext(ms: number): void {
    if (stopped) return
    clearTimer()
    timer = setTimeout(
      () => {
        timer = null
        void tick()
      },
      Math.max(minTickMs, ms),
    )
  }

  async function runOnce(): Promise<void> {
    const tasks = [...opts.buildQueue()].sort((a, b) => a.priority - b.priority)
    setQueue(tasks)

    if (tasks.length === 0) {
      setPhase(SchedulerPhase.Paused)
    } else {
      setPhase(SchedulerPhase.Running)
      for (const task of tasks) {
        if (!limiter.canSpend(task.cost)) break
        setCurrentTask(task.id)
        const outcome = await opts.onExecute(task)
        setCurrentTask(null)
        if (outcome === ExecuteOutcome.Backoff) break
        limiter.spend(task.cost)
      }
    }

    if (!stopped) scheduleNext(intervalMs)
  }

  function tick(): Promise<void> {
    if (inFlight) return inFlight
    const promise = runOnce()
    inFlight = promise
    promise.finally(() => {
      if (inFlight === promise) inFlight = null
    })
    return promise
  }

  function start(): void {
    if (!stopped) return
    stopped = false
    void tick()
  }

  function stop(): void {
    stopped = true
    clearTimer()
    setCurrentTask(null)
    setPhase(SchedulerPhase.Idle)
  }

  function force(): Promise<void> {
    if (stopped) return Promise.resolve()
    return tick()
  }

  return { phase, queue, currentTask, start, stop, force }
}
