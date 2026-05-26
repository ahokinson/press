/**
 * Split a progress run into filled and unfilled character strings.
 *
 * - `max <= 0` paints fully filled (indeterminate-complete).
 * - Ratios outside [0, 1] are clamped.
 * - `filledChar` and `unfilledChar` must be one column wide; wider glyphs
 *   overflow `width`.
 */
export function progressParts(
  value: number,
  max: number,
  width: number,
  filledChar: string = "█",
  unfilledChar: string = "░",
): { filled: string; unfilled: string } {
  const usableWidth = Math.max(1, Math.floor(width))
  if (max <= 0) return { filled: filledChar.repeat(usableWidth), unfilled: "" }
  const ratio = Math.min(1, Math.max(0, value / max))
  const filled = Math.min(usableWidth, Math.round(ratio * usableWidth))
  return { filled: filledChar.repeat(filled), unfilled: unfilledChar.repeat(usableWidth - filled) }
}
