import { Icon } from "@icons"

/** Single-glyph constants for `rangeBar`. */
export const RANGE_BAR_MARKER = Icon.circleFilled.char
export const RANGE_BAR_TRACK = Icon.lineHorizontal.char
export const RANGE_BAR_LEFT_CAP = Icon.teeRight.char
export const RANGE_BAR_RIGHT_CAP = Icon.teeLeft.char

/**
 * Split `width` cells across a list of non-negative values by their share of the total, for a
 * stacked/segmented bar. Each value keeps at least `minCell` cells when non-zero (so a small-but-
 * meaningful slice — a handful of criticals among thousands of lows — never rounds away), trimming
 * the surplus off the widest segments; any leftover from rounding down is handed to the largest
 * fractional remainders. Zero values get zero cells. Returns one cell count per input value, always
 * summing to `width` (or to 0 when the total is 0 / width ≤ 0).
 */
export function stackedCells(values: readonly number[], width: number, minCell = 1): number[] {
  const usableWidth = Math.max(0, Math.floor(width))
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0)
  if (usableWidth === 0 || total <= 0) return values.map(() => 0)

  const exact = values.map((value) => (Math.max(0, value) / total) * usableWidth)
  const cells = values.map((value, i) => (value > 0 ? Math.max(minCell, Math.floor(exact[i]!)) : 0))

  let over = cells.reduce((sum, n) => sum + n, 0) - usableWidth
  while (over > 0) {
    let widest = -1
    let max = minCell
    for (let i = 0; i < cells.length; i++) {
      if (cells[i]! > max) {
        max = cells[i]!
        widest = i
      }
    }
    if (widest < 0) break
    cells[widest]! -= 1
    over -= 1
  }

  let under = usableWidth - cells.reduce((sum, n) => sum + n, 0)
  if (under > 0) {
    const byRemainder = values
      .map((_, i) => i)
      .filter((i) => values[i]! > 0)
      .sort((a, b) => exact[b]! - Math.floor(exact[b]!) - (exact[a]! - Math.floor(exact[a]!)))
    for (let i = 0; under > 0 && byRemainder.length > 0; i++, under--) {
      cells[byRemainder[i % byRemainder.length]!]! += 1
    }
  }

  return cells
}

/**
 * Render a positional slider as a single line: `├──●──┤`. `current` is
 * clamped to `[low, high]` for placement. When `high === low`, returns a
 * flat track of dashes. `width` is in terminal columns and includes the
 * marker cell.
 */
export function rangeBar(current: number, low: number, high: number, width: number): string {
  if (width <= 0) return ""
  if (high === low) return RANGE_BAR_TRACK.repeat(width)
  const ratio = Math.max(0, Math.min(1, (current - low) / (high - low)))
  const position = Math.round(ratio * (width - 1))
  const cells: string[] = new Array(width)
  for (let index = 0; index < width; index++) {
    if (index === position) cells[index] = RANGE_BAR_MARKER
    else if (index === 0) cells[index] = RANGE_BAR_LEFT_CAP
    else if (index === width - 1) cells[index] = RANGE_BAR_RIGHT_CAP
    else cells[index] = RANGE_BAR_TRACK
  }
  return cells.join("")
}
