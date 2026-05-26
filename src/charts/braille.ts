/**
 * Braille sub-cell rasterizer.
 *
 * One braille cell (U+2800..U+28FF) packs a 2×4 grid of sub-pixels.
 * Bit layout within a cell (Unicode spec):
 *
 *     col 0   col 1
 *   row 0   0x01    0x08
 *   row 1   0x02    0x10
 *   row 2   0x04    0x20
 *   row 3   0x40    0x80
 */

import { resample } from "@charts/series.ts"

export const BRAILLE_BASE = 0x2800

const BIT_TABLE = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]

export interface BrailleGrid {
  cells: Uint16Array // row-major: cells[y * width + x] = bitmask (0 = empty)
  width: number // in terminal cells
  height: number // in terminal cells
  min: number
  max: number
}

/** Rasterize a 1-D value array into a braille bitmap of the given cell dimensions. */
export function rasterize(
  values: number[],
  width: number,
  height: number,
  rangeMin?: number,
  rangeMax?: number,
): BrailleGrid {
  const cells = new Uint16Array(width * height)
  if (values.length === 0 || width <= 0 || height <= 0) {
    return { cells, width, height, min: 0, max: 0 }
  }

  const subPixelWidth = width * 2
  const subPixelHeight = height * 4

  const sampledValues = resample(values, subPixelWidth)

  let minimum = sampledValues[0]!
  let maximum = sampledValues[0]!
  for (const value of sampledValues) {
    if (value < minimum) minimum = value
    if (value > maximum) maximum = value
  }

  const floor = rangeMin ?? minimum
  const ceiling = rangeMax ?? maximum
  const span = ceiling - floor || 1

  // Map each sub-x to a sub-y (0 = top, subPixelHeight-1 = bottom).
  const subPixelYs = new Int16Array(subPixelWidth)
  for (let column = 0; column < subPixelWidth; column++) {
    const fraction = (sampledValues[column]! - floor) / span
    subPixelYs[column] = subPixelHeight - 1 - Math.round(fraction * (subPixelHeight - 1))
  }

  // Plot a connected line by stepping along x and drawing vertical segments
  // between consecutive sample y's. Width is exactly subPixelWidth samples,
  // one sample per sub-x column.
  for (let x = 0; x < subPixelWidth; x++) {
    const yStart = subPixelYs[x]!
    const previousY = x === 0 ? yStart : subPixelYs[x - 1]!
    const lowerY = Math.min(previousY, yStart)
    const upperY = Math.max(previousY, yStart)
    for (let y = lowerY; y <= upperY; y++) plot(cells, width, x, y)
  }

  return { cells, width, height, min: floor, max: ceiling }
}

function plot(cells: Uint16Array, width: number, subPixelX: number, subPixelY: number): void {
  const cellX = subPixelX >> 1
  const cellY = subPixelY >> 2
  const columnInCell = subPixelX & 1
  const rowInCell = subPixelY & 3
  const bitMask = BIT_TABLE[rowInCell]![columnInCell]!
  cells[cellY * width + cellX]! |= bitMask
}

/** Convert a row of bitmasks → an array of braille characters (empty cells stay as " "). */
export function rowToString(grid: BrailleGrid, row: number): string {
  let result = ""
  const base = row * grid.width
  for (let x = 0; x < grid.width; x++) {
    const bitMask = grid.cells[base + x]!
    result += bitMask === 0 ? " " : String.fromCharCode(BRAILLE_BASE | bitMask)
  }
  return result
}
