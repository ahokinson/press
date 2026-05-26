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
    const result = resample([0, 1, 2, 3], 7)
    expect(result).toHaveLength(7)
    expect(result[0]).toBe(0)
    expect(result[6]).toBe(3)
    for (let index = 1; index < result.length; index++) {
      expect(result[index]).toBeGreaterThanOrEqual(result[index - 1]!)
    }
  })

  test("downsamples preserve endpoints", () => {
    const result = resample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3)
    expect(result[0]).toBe(0)
    expect(result[result.length - 1]).toBe(9)
  })
})
