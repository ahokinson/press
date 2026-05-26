import { beforeEach, describe, expect, test } from "bun:test"
import { createCreditLimiter } from "@async/credit.ts"

let clock = 0
const now = (): number => clock

beforeEach(() => {
  clock = 1_000_000
})

describe("createCreditLimiter", () => {
  test("exposes minute and day buckets with the configured capacity", () => {
    const limiter = createCreditLimiter({ perMinute: 8, perDay: 800, now })
    expect(limiter.minuteRemaining()).toBe(8)
    expect(limiter.dailyRemaining()).toBe(800)
  })

  test("spend reduces both buckets", () => {
    const limiter = createCreditLimiter({ perMinute: 8, perDay: 800, now })
    limiter.spend(3)
    expect(limiter.minuteRemaining()).toBe(5)
    expect(limiter.dailyRemaining()).toBe(797)
  })

  test("canSpend mirrors capacity across both buckets", () => {
    const limiter = createCreditLimiter({ perMinute: 2, perDay: 10, now })
    limiter.spend(2)
    expect(limiter.canSpend(1)).toBe(false)
  })

  test("nextCreditAt aliases nextAvailableAt", () => {
    const limiter = createCreditLimiter({ perMinute: 1, perDay: 1, now })
    limiter.spend(1)
    expect(limiter.nextCreditAt(1)).toBe(limiter.nextAvailableAt(1))
  })

  test("uses Date.now by default", () => {
    const limiter = createCreditLimiter({ perMinute: 1, perDay: 1 })
    expect(limiter.minuteRemaining()).toBe(1)
    limiter.spend(1)
    expect(limiter.canSpend(1)).toBe(false)
  })
})
