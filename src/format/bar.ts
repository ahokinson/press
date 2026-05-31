import { Icon } from "@icons"

/** Single-glyph constants for `rangeBar`. */
export const RANGE_BAR_MARKER = Icon.circleFilled.char
export const RANGE_BAR_TRACK = Icon.lineHorizontal.char
export const RANGE_BAR_LEFT_CAP = Icon.teeRight.char
export const RANGE_BAR_RIGHT_CAP = Icon.teeLeft.char

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
