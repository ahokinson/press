import { describe, expect, test } from "bun:test"
import { createCreditLimiter } from "@async/credit.ts"
import type { RateGate } from "@async/rate.ts"
import { createScheduler, ExecuteOutcome, SchedulerPhase, type SchedulerTask } from "@async/scheduler.ts"
import { createRoot } from "solid-js"

interface Task extends SchedulerTask {
  label: string
}

const TASK_A: Task = { id: "a", label: "A", cost: 1, priority: 0 }
const TASK_B: Task = { id: "b", label: "B", cost: 1, priority: 1 }
const TASK_C: Task = { id: "c", label: "C", cost: 5, priority: 2 }

describe("createScheduler", () => {
  test("runs every task in priority order and reaches Paused when queue drains", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 10, perDay: 100 })
      const executed: string[] = []
      let calls = 0
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => (calls++ === 0 ? [TASK_B, TASK_A] : []),
        onExecute: (t) => {
          executed.push(t.id)
          return ExecuteOutcome.Ok
        },
      })
      s.start()
      await s.force()
      expect(executed).toEqual(["a", "b"])
      expect(s.phase()).toBe(SchedulerPhase.Running)
      await s.force()
      expect(s.phase()).toBe(SchedulerPhase.Paused)
      dispose()
      s.stop()
    })
  })

  test("Backoff outcome halts the current tick without spending the budget", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 10, perDay: 100 })
      const executed: string[] = []
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => [TASK_A, TASK_B],
        onExecute: (t) => {
          executed.push(t.id)
          return t.id === "a" ? ExecuteOutcome.Backoff : ExecuteOutcome.Ok
        },
      })
      s.start()
      await s.force()
      expect(executed).toEqual(["a"])
      expect(limiter.minuteRemaining()).toBe(10)
      dispose()
      s.stop()
    })
  })

  test("skips tasks the limiter cannot afford and stops at the first one", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 2, perDay: 10 })
      const executed: string[] = []
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => [TASK_A, TASK_C],
        onExecute: (t) => {
          executed.push(t.id)
          return ExecuteOutcome.Ok
        },
      })
      s.start()
      await s.force()
      expect(executed).toEqual(["a"])
      dispose()
      s.stop()
    })
  })

  test("coalesces concurrent force() calls into a single tick", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 10, perDay: 100 })
      let ticks = 0
      const blockHandle: { resolve: (() => void) | null } = { resolve: null }
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => {
          ticks++
          return [TASK_A]
        },
        onExecute: async () =>
          new Promise<ExecuteOutcome>((resolve) => {
            blockHandle.resolve = () => resolve(ExecuteOutcome.Ok)
          }),
      })
      s.start()
      const first = s.force()
      const second = s.force()
      expect(ticks).toBe(1)
      blockHandle.resolve?.()
      await Promise.all([first, second])
      expect(ticks).toBe(1)
      dispose()
      s.stop()
    })
  })

  test("currentTask is set during execution and cleared after", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 10, perDay: 100 })
      const seen: Array<string | null> = []
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => [TASK_A],
        onExecute: () => {
          seen.push(s.currentTask())
          return ExecuteOutcome.Ok
        },
      })
      s.start()
      await s.force()
      expect(seen).toEqual(["a"])
      expect(s.currentTask()).toBeNull()
      dispose()
      s.stop()
    })
  })

  test("stop clears state and force after stop is a no-op", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 10, perDay: 100 })
      let executed = 0
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => [TASK_A],
        onExecute: () => {
          executed++
          return ExecuteOutcome.Ok
        },
      })
      s.start()
      await s.force()
      expect(executed).toBe(1)
      s.stop()
      expect(s.phase()).toBe(SchedulerPhase.Idle)
      expect(s.currentTask()).toBeNull()
      await s.force()
      expect(executed).toBe(1)
      dispose()
    })
  })

  test("start is a no-op when already running", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 10, perDay: 100 })
      let executed = 0
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => (executed === 0 ? [TASK_A] : []),
        onExecute: () => {
          executed++
          return ExecuteOutcome.Ok
        },
      })
      s.start()
      s.start() // second start has no effect
      await s.force()
      expect(executed).toBe(1)
      dispose()
      s.stop()
    })
  })

  test("start after stop resumes scheduling", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 10, perDay: 100 })
      let executed = 0
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => [TASK_A],
        onExecute: () => {
          executed++
          return ExecuteOutcome.Ok
        },
      })
      s.start()
      await s.force()
      s.stop()
      s.start()
      await s.force()
      expect(executed).toBe(2)
      dispose()
      s.stop()
    })
  })

  test("queue accessor reflects the most recent build", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 10, perDay: 100 })
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => [TASK_C, TASK_A],
        onExecute: () => ExecuteOutcome.Ok,
      })
      s.start()
      await s.force()
      // sorted ascending by priority: A (0) then C (2)
      expect(s.queue().map((t) => t.id)).toEqual(["a", "c"])
      dispose()
      s.stop()
    })
  })

  test("respects custom intervalMs and minTickMs (constructor wiring)", async () => {
    await createRoot(async (dispose) => {
      const limiter = createCreditLimiter({ perMinute: 10, perDay: 100 })
      const s = createScheduler<Task>({
        limiter,
        buildQueue: () => [],
        onExecute: () => ExecuteOutcome.Ok,
        intervalMs: 10_000,
        minTickMs: 5_000,
      })
      s.start()
      await s.force()
      expect(s.phase()).toBe(SchedulerPhase.Paused)
      dispose()
      s.stop()
    })
  })

  test("defaults to noopRateGate when limiter is omitted", async () => {
    await createRoot(async (dispose) => {
      const executed: string[] = []
      let calls = 0
      const s = createScheduler<Task>({
        buildQueue: () => (calls++ === 0 ? [TASK_C, TASK_C, TASK_C] : []),
        onExecute: (t) => {
          executed.push(t.id)
          return ExecuteOutcome.Ok
        },
      })
      s.start()
      await s.force()
      expect(executed).toEqual(["c", "c", "c"])
      dispose()
      s.stop()
    })
  })

  test("accepts an arbitrary RateGate implementation", async () => {
    await createRoot(async (dispose) => {
      const spends: number[] = []
      let allowed = 2
      const gate: RateGate = {
        canSpend: (n) => allowed >= n,
        spend: (n) => {
          spends.push(n)
          allowed -= n
        },
      }
      const executed: string[] = []
      let calls = 0
      const s = createScheduler<Task>({
        limiter: gate,
        buildQueue: () => (calls++ === 0 ? [TASK_A, TASK_A, TASK_A] : []),
        onExecute: (t) => {
          executed.push(t.id)
          return ExecuteOutcome.Ok
        },
      })
      s.start()
      await s.force()
      expect(executed).toEqual(["a", "a"])
      expect(spends).toEqual([1, 1])
      dispose()
      s.stop()
    })
  })

  test("auto-fires the next tick after the interval elapses, and stops on stop()", async () => {
    let ticks = 0
    let disposeRoot: () => void = () => {}
    await new Promise<void>((done) => {
      createRoot(async (dispose) => {
        disposeRoot = dispose
        const limiter = createCreditLimiter({ perMinute: 100, perDay: 1000 })
        const s = createScheduler<Task>({
          limiter,
          buildQueue: () => {
            ticks++
            return []
          },
          onExecute: () => ExecuteOutcome.Ok,
          intervalMs: 10,
          minTickMs: 10,
        })
        s.start()
        await s.force()
        await new Promise((resolve) => setTimeout(resolve, 80))
        const afterAuto = ticks
        expect(afterAuto).toBeGreaterThan(1)
        s.stop()
        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(ticks).toBe(afterAuto)
        done()
      })
    })
    disposeRoot()
  })
})
