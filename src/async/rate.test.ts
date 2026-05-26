import { beforeEach, describe, expect, test } from "bun:test"
import { createRateLimiter, noopRateGate } from "@async/rate.ts"

let clock = 0
const now = (): number => clock

beforeEach(() => {
  clock = 1_000_000
})

describe("createRateLimiter", () => {
  test("fresh limiter exposes full capacity per window", () => {
    const limiter = createRateLimiter({
      windows: [
        { windowMs: 60_000, capacity: 8 },
        { windowMs: 86_400_000, capacity: 800 },
      ],
      now,
    })
    expect(limiter.remaining(0)).toBe(8)
    expect(limiter.remaining(1)).toBe(800)
    expect(limiter.canSpend(8)).toBe(true)
    expect(limiter.canSpend(9)).toBe(false)
  })

  test("spend decrements every window", () => {
    const limiter = createRateLimiter({
      windows: [
        { windowMs: 60_000, capacity: 8 },
        { windowMs: 86_400_000, capacity: 800 },
      ],
      now,
    })
    limiter.spend(3)
    expect(limiter.remaining(0)).toBe(5)
    expect(limiter.remaining(1)).toBe(797)
  })

  test("entries age out of their window exactly at the boundary", () => {
    const limiter = createRateLimiter({
      windows: [{ windowMs: 60_000, capacity: 2 }],
      now,
    })
    limiter.spend(2)
    expect(limiter.remaining(0)).toBe(0)
    clock += 59_999
    expect(limiter.remaining(0)).toBe(0)
    clock += 1
    expect(limiter.remaining(0)).toBe(2)
  })

  test("nextAvailableAt picks the longer of all window waits", () => {
    const limiter = createRateLimiter({
      windows: [
        { windowMs: 60_000, capacity: 1 },
        { windowMs: 86_400_000, capacity: 1 },
      ],
      now,
    })
    limiter.spend(1)
    expect(limiter.nextAvailableAt(1)).toBe(86_400_000)
  })

  test("nextAvailableAt returns 0 when already affordable", () => {
    const limiter = createRateLimiter({
      windows: [{ windowMs: 60_000, capacity: 8 }],
      now,
    })
    expect(limiter.nextAvailableAt(1)).toBe(0)
  })

  test("nextAvailableAt reports per-window wait", () => {
    const limiter = createRateLimiter({
      windows: [{ windowMs: 60_000, capacity: 2 }],
      now,
    })
    limiter.spend(1)
    clock += 10_000
    limiter.spend(1)
    expect(limiter.nextAvailableAt(1)).toBe(50_000)
  })

  test("remaining(out-of-range) returns 0 without throwing", () => {
    const limiter = createRateLimiter({
      windows: [{ windowMs: 60_000, capacity: 8 }],
      now,
    })
    expect(limiter.remaining(5)).toBe(0)
  })

  test("supports a single window only", () => {
    const limiter = createRateLimiter({ windows: [{ windowMs: 1_000, capacity: 3 }], now })
    expect(limiter.canSpend(3)).toBe(true)
    limiter.spend(3)
    expect(limiter.canSpend(1)).toBe(false)
  })

  test("supports three or more windows", () => {
    const limiter = createRateLimiter({
      windows: [
        { windowMs: 1_000, capacity: 2 },
        { windowMs: 60_000, capacity: 10 },
        { windowMs: 3_600_000, capacity: 100 },
      ],
      now,
    })
    expect(limiter.remaining(0)).toBe(2)
    expect(limiter.remaining(1)).toBe(10)
    expect(limiter.remaining(2)).toBe(100)
    limiter.spend(2)
    expect(limiter.canSpend(1)).toBe(false) // 1s window exhausted
  })

  test("uses Date.now by default", () => {
    const limiter = createRateLimiter({ windows: [{ windowMs: 60_000, capacity: 1 }] })
    expect(limiter.remaining(0)).toBe(1)
    limiter.spend(1)
    expect(limiter.canSpend(1)).toBe(false)
  })

  test("throws when constructed with no windows", () => {
    expect(() => createRateLimiter({ windows: [] })).toThrow(/at least one window/)
  })

  test("prunes spends older than the longest window", () => {
    const limiter = createRateLimiter({
      windows: [
        { windowMs: 1_000, capacity: 5 },
        { windowMs: 10_000, capacity: 10 },
      ],
      now,
    })
    limiter.spend(5)
    clock += 11_000
    expect(limiter.remaining(0)).toBe(5)
    expect(limiter.remaining(1)).toBe(10)
  })
})

describe("noopRateGate", () => {
  test("always affords any cost", () => {
    expect(noopRateGate.canSpend(1)).toBe(true)
    expect(noopRateGate.canSpend(1_000_000)).toBe(true)
  })

  test("spend is a no-op", () => {
    noopRateGate.spend(42)
    expect(noopRateGate.canSpend(1)).toBe(true)
  })
})
