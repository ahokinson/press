/**
 * Whether a confirmed pivot is a local high (preceding run was rising and has
 * now reversed downward) or a local low (preceding run was falling and has
 * now reversed upward).
 */
export enum PivotKind {
  High = "high",
  Low = "low",
}

/**
 * A confirmed reversal point in a series. Endpoints of the input are never
 * returned. A pivot is only emitted when the series reverses against the
 * current direction by more than the threshold. The very first move (which
 * only establishes a direction) and the unconfirmed closing extreme are
 * both omitted.
 */
export interface Pivot {
  index: number
  value: number
  kind: PivotKind
}

export interface PivotOptions {
  /**
   * Minimum fractional swing from the running extreme required to confirm a
   * reversal, e.g. `0.02` = 2%. Computed as `|value - extreme| / |extreme|`.
   * When `extreme` is `0`, only `minDelta` applies. Default `0.01`.
   */
  thresholdRatio?: number
  /**
   * Minimum absolute swing required in addition to `thresholdRatio`. Both
   * conditions must hold. Default `0`.
   */
  minDelta?: number
}

/**
 * ZigZag pivot detection. Walks `values` forward tracking the running
 * extreme in the current direction. When the value moves against that
 * direction by more than the threshold, the running extreme becomes a
 * confirmed pivot.
 *
 * - Non-finite values are skipped.
 * - Series with fewer than 3 finite values returns `[]`.
 * - A flat or near-flat series returns `[]`.
 */
export function findPivots(values: readonly number[], opts: PivotOptions = {}): Pivot[] {
  const thresholdRatio = opts.thresholdRatio ?? 0.01
  const minDelta = opts.minDelta ?? 0
  if (values.length < 3) return []

  let firstIndex = -1
  for (let index = 0; index < values.length; index++) {
    if (Number.isFinite(values[index]!)) {
      firstIndex = index
      break
    }
  }
  if (firstIndex === -1) return []

  function reversedEnough(current: number, extreme: number): boolean {
    const delta = Math.abs(current - extreme)
    if (delta < minDelta) return false
    const ratio = extreme === 0 ? Infinity : delta / Math.abs(extreme)
    return ratio >= thresholdRatio
  }

  const pivots: Pivot[] = []
  // Phase 1: direction unconfirmed. Track both running low and running high
  // to emit the correct opposing pivot when direction commits.
  let lowIndex = firstIndex
  let lowValue = values[firstIndex]!
  let highIndex = firstIndex
  let highValue = values[firstIndex]!
  let direction: Direction = Direction.Unknown
  let extremeIndex = firstIndex
  let extremeValue = values[firstIndex]!

  for (let index = firstIndex + 1; index < values.length; index++) {
    const value = values[index]!
    if (!Number.isFinite(value)) continue

    if (direction === Direction.Unknown) {
      if (value > highValue) {
        highIndex = index
        highValue = value
      }
      if (value < lowValue) {
        lowIndex = index
        lowValue = value
      }
      if (reversedEnough(value, lowValue)) {
        // Confirmed up move from the running low. The low itself is NOT a
        // pivot (it's an endpoint of the unconfirmed phase). Switch to trend
        // tracking with the running high as the new extreme.
        direction = Direction.Up
        extremeIndex = highIndex
        extremeValue = highValue
      } else if (reversedEnough(value, highValue)) {
        direction = Direction.Down
        extremeIndex = lowIndex
        extremeValue = lowValue
      }
      continue
    }

    if (direction === Direction.Up) {
      if (value > extremeValue) {
        extremeIndex = index
        extremeValue = value
      } else if (reversedEnough(value, extremeValue)) {
        pivots.push({ index: extremeIndex, value: extremeValue, kind: PivotKind.High })
        direction = Direction.Down
        extremeIndex = index
        extremeValue = value
      }
    } else {
      if (value < extremeValue) {
        extremeIndex = index
        extremeValue = value
      } else if (reversedEnough(value, extremeValue)) {
        pivots.push({ index: extremeIndex, value: extremeValue, kind: PivotKind.Low })
        direction = Direction.Up
        extremeIndex = index
        extremeValue = value
      }
    }
  }

  return pivots
}

enum Direction {
  Unknown = 0,
  Up = 1,
  Down = -1,
}
