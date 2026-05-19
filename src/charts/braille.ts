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

  const subW = width * 2
  const subH = height * 4

  const ys = resample(values, subW)

  let min = ys[0]!
  let max = ys[0]!
  for (const v of ys) {
    if (v < min) min = v
    if (v > max) max = v
  }

  const floor = rangeMin ?? min
  const ceil = rangeMax ?? max
  const span = ceil - floor || 1

  // Map each sub-x to a sub-y (0 = top, subH-1 = bottom).
  const subY = new Int16Array(subW)
  for (let i = 0; i < subW; i++) {
    const frac = (ys[i]! - floor) / span
    subY[i] = subH - 1 - Math.round(frac * (subH - 1))
  }

  // Plot a connected line by stepping along x and drawing vertical segments
  // between consecutive sample y's. Width is exactly subW samples → 1 sample
  // per sub-x column, so no x-interpolation needed.
  for (let x = 0; x < subW; x++) {
    const y0 = subY[x]!
    const yPrev = x === 0 ? y0 : subY[x - 1]!
    const lo = Math.min(yPrev, y0)
    const hi = Math.max(yPrev, y0)
    for (let y = lo; y <= hi; y++) plot(cells, width, x, y)
  }

  return { cells, width, height, min: floor, max: ceil }
}

function plot(cells: Uint16Array, width: number, sx: number, sy: number): void {
  const cx = sx >> 1
  const cy = sy >> 2
  const col = sx & 1
  const row = sy & 3
  const bit = BIT_TABLE[row]![col]!
  cells[cy * width + cx]! |= bit
}

/** Convert a row of bitmasks → an array of braille characters (empty cells stay as " "). */
export function rowToString(grid: BrailleGrid, row: number): string {
  let out = ""
  const base = row * grid.width
  for (let x = 0; x < grid.width; x++) {
    const bits = grid.cells[base + x]!
    out += bits === 0 ? " " : String.fromCharCode(BRAILLE_BASE | bits)
  }
  return out
}
