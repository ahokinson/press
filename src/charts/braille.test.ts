import { describe, expect, test } from "bun:test"
import { BRAILLE_BASE, rasterize, rowToString } from "@charts/braille.ts"

describe("rasterize", () => {
  test("empty input returns empty grid with zero range", () => {
    const grid = rasterize([], 4, 2)
    expect(grid.width).toBe(4)
    expect(grid.height).toBe(2)
    expect(grid.min).toBe(0)
    expect(grid.max).toBe(0)
    for (const cell of grid.cells) expect(cell).toBe(0)
  })

  test("non-positive dimensions return empty grid", () => {
    const a = rasterize([1, 2, 3], 0, 2)
    expect(a.cells.length).toBe(0)
    const b = rasterize([1, 2, 3], 4, 0)
    expect(b.cells.length).toBe(0)
  })

  test("single value populates and reports flat min/max", () => {
    const grid = rasterize([5], 4, 2)
    expect(grid.min).toBe(5)
    expect(grid.max).toBe(5)
    // At least one cell should carry braille bits.
    expect(grid.cells.some((c) => c !== 0)).toBe(true)
  })

  test("monotone ramp produces a low→high path", () => {
    const values = Array.from({ length: 64 }, (_, i) => i)
    const grid = rasterize(values, 8, 2)
    expect(grid.min).toBe(0)
    expect(grid.max).toBe(63)

    // Bottom-row cells should fire for the early (low) samples; top-row cells
    // should fire for the late (high) samples. The grid is 2 cells tall × 8 wide.
    const bottomRow = rowToString(grid, 1)
    const topRow = rowToString(grid, 0)
    // First cell of the bottom row is non-empty (line starts at the bottom).
    expect(bottomRow.charCodeAt(0)).toBeGreaterThan(BRAILLE_BASE)
    // Last cell of the top row is non-empty (line ends at the top).
    expect(topRow.charCodeAt(topRow.length - 1)).toBeGreaterThan(BRAILLE_BASE)
  })

  test("custom rangeMin/rangeMax overrides observed min/max", () => {
    const grid = rasterize([1, 2, 3, 4], 4, 2, 0, 10)
    expect(grid.min).toBe(0)
    expect(grid.max).toBe(10)
  })
})

describe("rowToString", () => {
  test("empty cells render as spaces", () => {
    const grid = rasterize([], 3, 1)
    expect(rowToString(grid, 0)).toBe("   ")
  })

  test("length matches grid width", () => {
    const grid = rasterize([0, 1, 2, 3], 6, 2)
    expect(rowToString(grid, 0)).toHaveLength(6)
    expect(rowToString(grid, 1)).toHaveLength(6)
  })

  test("populated cells fall in the braille block", () => {
    const grid = rasterize([0, 1, 2, 3, 4, 5, 6, 7], 4, 2)
    for (let r = 0; r < grid.height; r++) {
      for (const ch of rowToString(grid, r)) {
        const code = ch.charCodeAt(0)
        // Either a space or a braille glyph in U+2800..U+28FF.
        expect(ch === " " || (code >= BRAILLE_BASE && code <= BRAILLE_BASE + 0xff)).toBe(true)
      }
    }
  })
})
