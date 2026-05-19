import { beforeEach, describe, expect, test } from "bun:test"
import { createCreditLimiter } from "@async/credit.ts"

let clock = 0
const now = (): number => clock

beforeEach(() => {
  clock = 1_000_000
})

describe("createCreditLimiter", () => {
  test("exposes minute and day buckets with the configured capacity", () => {
    const l = createCreditLimiter({ perMinute: 8, perDay: 800, now })
    expect(l.minuteRemaining()).toBe(8)
    expect(l.dailyRemaining()).toBe(800)
  })

  test("spend reduces both buckets", () => {
    const l = createCreditLimiter({ perMinute: 8, perDay: 800, now })
    l.spend(3)
    expect(l.minuteRemaining()).toBe(5)
    expect(l.dailyRemaining()).toBe(797)
  })

  test("canSpend mirrors capacity across both buckets", () => {
    const l = createCreditLimiter({ perMinute: 2, perDay: 10, now })
    l.spend(2)
    expect(l.canSpend(1)).toBe(false)
  })

  test("nextCreditAt aliases nextAvailableAt", () => {
    const l = createCreditLimiter({ perMinute: 1, perDay: 1, now })
    l.spend(1)
    expect(l.nextCreditAt(1)).toBe(l.nextAvailableAt(1))
  })

  test("uses Date.now by default", () => {
    const l = createCreditLimiter({ perMinute: 1, perDay: 1 })
    expect(l.minuteRemaining()).toBe(1)
    l.spend(1)
    expect(l.canSpend(1)).toBe(false)
  })
})
