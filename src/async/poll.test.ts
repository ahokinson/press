import { describe, expect, test } from "bun:test"
import { createPollController, PollMode } from "@async/poll.ts"
import { createRoot } from "solid-js"

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

describe("createPollController", () => {
  test("schedules periodic ticks while Active", async () => {
    await createRoot(async (dispose) => {
      let ticks = 0
      createPollController({
        intervalMs: 20,
        onTick: () => {
          ticks++
        },
      })
      await wait(75)
      dispose()
      expect(ticks).toBeGreaterThanOrEqual(2)
    })
  })

  test("does not schedule when Disabled, force still runs", async () => {
    await createRoot(async (dispose) => {
      let ticks = 0
      const controller = createPollController({
        intervalMs: 20,
        initialMode: PollMode.Disabled,
        onTick: () => {
          ticks++
        },
      })
      await wait(60)
      expect(ticks).toBe(0)
      await controller.force()
      expect(ticks).toBe(1)
      dispose()
    })
  })

  test("coalesces overlapping ticks", async () => {
    await createRoot(async (dispose) => {
      let entered = 0
      const controller = createPollController({
        intervalMs: 10_000,
        initialMode: PollMode.Disabled,
        onTick: async () => {
          entered++
          await wait(50)
        },
      })
      void controller.force()
      void controller.force()
      void controller.force()
      await wait(80)
      dispose()
      expect(entered).toBe(1)
    })
  })

  test("lastTickAt updates after a tick", async () => {
    await createRoot(async (dispose) => {
      const controller = createPollController({
        intervalMs: 10_000,
        initialMode: PollMode.Disabled,
        onTick: () => {},
      })
      expect(controller.lastTickAt()).toBeNull()
      await controller.force()
      expect(typeof controller.lastTickAt()).toBe("number")
      dispose()
    })
  })

  test("Paused mode skips scheduled ticks", async () => {
    await createRoot(async (dispose) => {
      let ticks = 0
      const controller = createPollController({
        intervalMs: 20,
        initialMode: PollMode.Paused,
        onTick: () => {
          ticks++
        },
      })
      await wait(80)
      expect(ticks).toBe(0)
      controller.setMode(PollMode.Active)
      await wait(60)
      dispose()
      expect(ticks).toBeGreaterThanOrEqual(1)
    })
  })

  test("Paused → Active fires a tick immediately (no intervalMs wait)", async () => {
    await createRoot(async (dispose) => {
      let ticks = 0
      const controller = createPollController({
        intervalMs: 10_000,
        initialMode: PollMode.Paused,
        onTick: () => {
          ticks++
        },
      })
      await wait(20)
      expect(ticks).toBe(0)
      controller.setMode(PollMode.Active)
      await wait(20)
      dispose()
      expect(ticks).toBe(1)
    })
  })

  test("Active → Paused stops further ticks", async () => {
    await createRoot(async (dispose) => {
      let ticks = 0
      const controller = createPollController({
        intervalMs: 15,
        onTick: () => {
          ticks++
        },
      })
      await wait(50)
      const snapshot = ticks
      expect(snapshot).toBeGreaterThanOrEqual(2)
      controller.setMode(PollMode.Paused)
      await wait(80)
      dispose()
      expect(ticks).toBe(snapshot)
    })
  })
})
