import { describe, expect, test } from "bun:test"
import { findPivots, PivotKind } from "@charts/pivots.ts"

describe("findPivots", () => {
  test("series shorter than 3 returns []", () => {
    expect(findPivots([])).toEqual([])
    expect(findPivots([1])).toEqual([])
    expect(findPivots([1, 2])).toEqual([])
  })

  test("monotone series returns no pivots", () => {
    expect(findPivots([1, 2, 3, 4, 5], { thresholdRatio: 0.1 })).toEqual([])
    expect(findPivots([5, 4, 3, 2, 1], { thresholdRatio: 0.1 })).toEqual([])
  })

  test("flat series returns no pivots", () => {
    expect(findPivots([5, 5, 5, 5, 5], { thresholdRatio: 0.01 })).toEqual([])
  })

  test("simple up-then-down emits only the peak", () => {
    // 100 → 110 → 100: the 110 is a confirmed high (10% reversal). The
    // starting 100 is an unconfirmed endpoint and is not emitted.
    expect(findPivots([100, 110, 100], { thresholdRatio: 0.05 })).toEqual([
      { index: 1, value: 110, kind: PivotKind.High },
    ])
  })

  test("zig-zag with sub-threshold wiggles ignores noise", () => {
    // The 0.5 dip between 10.5 and 10.2 is below threshold; only the 11→9
    // reversal and the 9→11 reversal commit pivots.
    const pivots = findPivots([10, 10.5, 10.2, 11, 9, 11], { thresholdRatio: 0.1 })
    expect(pivots).toEqual([
      { index: 3, value: 11, kind: PivotKind.High },
      { index: 4, value: 9, kind: PivotKind.Low },
    ])
  })

  test("higher threshold suppresses smaller pivots", () => {
    const series = [100, 110, 105, 120, 90, 130]
    const lenient = findPivots(series, { thresholdRatio: 0.03 })
    const strict = findPivots(series, { thresholdRatio: 0.2 })
    expect(lenient.length).toBeGreaterThan(strict.length)
  })

  test("minDelta floor suppresses noise on small absolute values", () => {
    const series = [0.001, 0.002, 0.001, 0.003]
    expect(findPivots(series, { thresholdRatio: 0.01, minDelta: 0.01 })).toEqual([])
  })

  test("non-finite values are skipped", () => {
    const series = [100, Number.NaN, 110, Number.POSITIVE_INFINITY, 100]
    expect(findPivots(series, { thresholdRatio: 0.05 })).toEqual([{ index: 2, value: 110, kind: PivotKind.High }])
  })

  test("all-non-finite series returns []", () => {
    expect(findPivots([Number.NaN, Number.NaN, Number.NaN])).toEqual([])
  })

  test("default threshold is 1%", () => {
    // 100 → 101.1 → 99: 1.1% up then 2.1% down — over default 1% threshold.
    expect(findPivots([100, 101.1, 99])).toEqual([{ index: 1, value: 101.1, kind: PivotKind.High }])
    // 100 → 100.5 → 100: 0.5% moves — under default threshold; no pivots.
    expect(findPivots([100, 100.5, 100])).toEqual([])
  })

  test("alternating extremes produce alternating kinds", () => {
    const series = [100, 120, 80, 140, 60, 160]
    const pivots = findPivots(series, { thresholdRatio: 0.05 })
    expect(pivots.length).toBeGreaterThan(1)
    for (let index = 1; index < pivots.length; index++) {
      expect(pivots[index]!.kind).not.toBe(pivots[index - 1]!.kind)
    }
  })
})
