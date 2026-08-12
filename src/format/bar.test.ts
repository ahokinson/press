import { describe, expect, test } from "bun:test"
import { stackedCells } from "@format/bar.ts"

describe("stackedCells", () => {
  test("apportions cells by share and always sums to width", () => {
    const cells = stackedCells([140, 1160, 4575, 0, 0], 24)
    expect(cells.reduce((a, b) => a + b, 0)).toBe(24)
    // Ordered by share: medium (4575) widest, then high, then critical.
    expect(cells[2]).toBeGreaterThan(cells[1]!)
    expect(cells[1]).toBeGreaterThan(cells[0]!)
  })

  test("keeps a non-zero band visible even when its share rounds to zero", () => {
    // 140/5875 * 24 ≈ 0.57 — would floor to 0 without the per-band minimum.
    const cells = stackedCells([140, 1160, 4575, 0, 0], 24)
    expect(cells[0]).toBeGreaterThanOrEqual(1)
    // Zero bands stay at zero.
    expect(cells[3]).toBe(0)
    expect(cells[4]).toBe(0)
  })

  test("returns all zeros for an empty total or non-positive width", () => {
    expect(stackedCells([0, 0, 0], 24)).toEqual([0, 0, 0])
    expect(stackedCells([1, 2, 3], 0)).toEqual([0, 0, 0])
  })

  test("respects a custom minimum and still sums to width", () => {
    const cells = stackedCells([1, 1, 1, 1], 8, 2)
    expect(cells.reduce((a, b) => a + b, 0)).toBe(8)
    for (const n of cells) expect(n).toBeGreaterThanOrEqual(2)
  })
})
