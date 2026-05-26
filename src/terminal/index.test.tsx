import { describe, expect, test } from "bun:test"
import type { CliRenderer } from "@opentui/core"
import { testRender } from "@opentui/solid"
import { createTerminalHandover, useResponsiveLayout } from "@terminal"

interface MockRenderer {
  suspended: number
  resumed: number
  suspend(): void
  resume(): void
}

function mockRenderer(): MockRenderer {
  return {
    suspended: 0,
    resumed: 0,
    suspend() {
      this.suspended++
    },
    resume() {
      this.resumed++
    },
  }
}

describe("createTerminalHandover", () => {
  test("suspends, runs the callback, and resumes once", async () => {
    const renderer = mockRenderer()
    const handover = createTerminalHandover(renderer as unknown as CliRenderer)
    const result = await handover(async () => 42)
    expect(result).toBe(42)
    expect(renderer.suspended).toBe(1)
    expect(renderer.resumed).toBe(1)
  })

  test("resumes even when the callback throws", async () => {
    const renderer = mockRenderer()
    const handover = createTerminalHandover(renderer as unknown as CliRenderer)
    await expect(
      handover(async () => {
        throw new Error("boom")
      }),
    ).rejects.toThrow("boom")
    expect(renderer.suspended).toBe(1)
    expect(renderer.resumed).toBe(1)
  })

  test("nested calls share a single suspend/resume cycle", async () => {
    const renderer = mockRenderer()
    const handover = createTerminalHandover(renderer as unknown as CliRenderer)
    const order: string[] = []
    const result = await handover(async () => {
      order.push("outer-start")
      const inner = await handover(async () => {
        order.push("inner")
        return await handover(async () => "deep")
      })
      order.push("outer-end")
      return inner
    })
    expect(result).toBe("deep")
    expect(order).toEqual(["outer-start", "inner", "outer-end"])
    expect(renderer.suspended).toBe(1)
    expect(renderer.resumed).toBe(1)
  })

  test("nested call resumes outer suspend even if inner throws", async () => {
    const renderer = mockRenderer()
    const handover = createTerminalHandover(renderer as unknown as CliRenderer)
    await expect(
      handover(async () => {
        await handover(async () => {
          throw new Error("inner-boom")
        })
      }),
    ).rejects.toThrow("inner-boom")
    expect(renderer.suspended).toBe(1)
    expect(renderer.resumed).toBe(1)
  })

  test("serializes concurrent (non-nested) calls", async () => {
    const renderer = mockRenderer()
    const handover = createTerminalHandover(renderer as unknown as CliRenderer)
    const order: string[] = []
    const first = handover(async () => {
      order.push("a-start")
      await Promise.resolve()
      order.push("a-end")
    })
    const second = handover(async () => {
      order.push("b-start")
      await Promise.resolve()
      order.push("b-end")
    })
    await Promise.all([first, second])
    expect(order).toEqual(["a-start", "a-end", "b-start", "b-end"])
    expect(renderer.suspended).toBe(2)
    expect(renderer.resumed).toBe(2)
  })
})

describe("useResponsiveLayout", () => {
  test("throws on empty breakpoints", () => {
    expect(() => useResponsiveLayout([])).toThrow(/must not be empty/)
  })

  test("throws when no breakpoint has minWidth <= 0", () => {
    expect(() => useResponsiveLayout([{ minWidth: 80, mode: "wide" }])).toThrow(/catch-all/)
  })

  test("returns the first breakpoint whose minWidth is met", async () => {
    let mode = ""
    const { renderOnce } = await testRender(
      () => {
        mode = useResponsiveLayout([
          { minWidth: 0, mode: "narrow" },
          { minWidth: 80, mode: "wide" },
        ])()
        return <text>{mode}</text>
      },
      { width: 100, height: 1 },
    )
    await renderOnce()
    expect(mode).toBe("wide")
  })

  test("falls back to the catch-all when terminal is narrower than all real breakpoints", async () => {
    let mode = ""
    const { renderOnce } = await testRender(
      () => {
        mode = useResponsiveLayout([
          { minWidth: 0, mode: "narrow" },
          { minWidth: 80, mode: "wide" },
        ])()
        return <text>{mode}</text>
      },
      { width: 40, height: 1 },
    )
    await renderOnce()
    expect(mode).toBe("narrow")
  })
})
