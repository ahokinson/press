import { describe, expect, test } from "bun:test"
import { resample } from "@charts/series.ts"

describe("resample", () => {
  test("empty input returns []", () => {
    expect(resample([], 5)).toEqual([])
  })

  test("non-positive count returns []", () => {
    expect(resample([1, 2, 3], 0)).toEqual([])
    expect(resample([1, 2, 3], -1)).toEqual([])
  })

  test("single value fills the output", () => {
    expect(resample([7], 4)).toEqual([7, 7, 7, 7])
  })

  test("count === 1 picks the most-recent value", () => {
    expect(resample([1, 2, 3, 4], 1)).toEqual([4])
  })

  test("linear interpolation between endpoints", () => {
    expect(resample([0, 10], 3)).toEqual([0, 5, 10])
  })

  test("identity when count matches input length", () => {
    expect(resample([0, 5, 10], 3)).toEqual([0, 5, 10])
  })

  test("upsamples a monotone ramp into a monotone ramp", () => {
    const out = resample([0, 1, 2, 3], 7)
    expect(out).toHaveLength(7)
    expect(out[0]).toBe(0)
    expect(out[6]).toBe(3)
    for (let i = 1; i < out.length; i++) {
      expect(out[i]).toBeGreaterThanOrEqual(out[i - 1]!)
    }
  })

  test("downsamples preserve endpoints", () => {
    const out = resample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3)
    expect(out[0]).toBe(0)
    expect(out[out.length - 1]).toBe(9)
  })
})
