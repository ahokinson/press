import { describe, expect, test } from "bun:test"
import type { CliRenderer } from "@opentui/core"
import { createTestRenderer } from "@opentui/core/testing"
import { mountTUI, runTUI } from "@terminal/mount.ts"

/**
 * A real renderer that never touches stdin, with `stop` counted.
 *
 * It has to be a real one: `render(node, x)` branches on
 * `x instanceof CliRenderer` and treats anything else as *config*, so a plain
 * object is silently turned into a second real renderer — which then fails with
 * "stdin is already used by another CliRenderer". A stub would test nothing and
 * mislead while doing it.
 */
async function countedRenderer(): Promise<CliRenderer & { stops: () => number }> {
  const { renderer } = await createTestRenderer({ width: 20, height: 5 })
  let stops = 0
  const original = renderer.stop.bind(renderer)
  renderer.stop = () => {
    stops++
    original()
  }
  return Object.assign(renderer, { stops: () => stops }) as CliRenderer & {
    stops: () => number
  }
}

/** A node that blows up on render, to exercise the failure path. */
const explodes = () => {
  throw new Error("mount exploded")
}

describe("runTUI", () => {
  test(
    "resolves with whatever finish was called with",
    async () => {
      const fake = await countedRenderer()
      const outcome = await runTUI<string>(
        (finish) => {
          finish("done")
          return null
        },
        { create: async () => fake },
      )
      expect(outcome).toBe("done")
    },
    { timeout: 5000 },
  )

  // Leaving the terminal up strands the shell in raw mode with no prompt.
  test(
    "stops the renderer once finished",
    async () => {
      const fake = await countedRenderer()
      await runTUI<number>(
        (finish) => {
          finish(1)
          return null
        },
        { create: async () => fake },
      )
      expect(fake.stops()).toBe(1)
    },
    { timeout: 5000 },
  )

  /**
   * The trap this exists to remove. `void render(...)` swallows the rejection
   * and the caller waits forever — indistinguishable from the frozen-quit bug.
   */
  test(
    "a failed mount rejects rather than hanging",
    async () => {
      const fake = await countedRenderer()
      await expect(runTUI(explodes, { create: async () => fake })).rejects.toThrow()
    },
    { timeout: 5000 },
  )

  test(
    "a failed mount still puts the terminal back",
    async () => {
      const fake = await countedRenderer()
      await runTUI(explodes, { create: async () => fake }).catch(() => {})
      expect(fake.stops()).toBe(1)
    },
    { timeout: 5000 },
  )
})

describe("mountTUI", () => {
  test(
    "hands back the renderer, which render itself does not",
    async () => {
      const fake = await countedRenderer()
      const renderer = await mountTUI(() => null, { create: async () => fake })
      expect(renderer).toBe(fake)
    },
    { timeout: 5000 },
  )

  // The app owns its own exit here, so mounting must not stop anything.
  test(
    "does not stop the renderer it returns",
    async () => {
      const fake = await countedRenderer()
      await mountTUI(() => null, { create: async () => fake })
      expect(fake.stops()).toBe(0)
    },
    { timeout: 5000 },
  )
})
