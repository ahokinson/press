/**
 * Linear-interpolate `values` to exactly `count` samples.
 *
 * Edge cases:
 * - `count <= 0` or empty `values` → `[]`
 * - `values.length === 1` → an array filled with that single value
 * - `count === 1` → the last value (most-recent-wins). For a summary stat,
 *   compute it before calling.
 */
export function resample(values: number[], count: number): number[] {
  if (count <= 0 || values.length === 0) return []
  if (values.length === 1) return Array(count).fill(values[0])
  if (count === 1) return [values[values.length - 1]!]

  const result: number[] = new Array(count)
  const last = values.length - 1
  for (let index = 0; index < count; index++) {
    const position = (index / (count - 1)) * last
    const lowerIndex = Math.floor(position)
    const upperIndex = Math.min(lowerIndex + 1, last)
    const fraction = position - lowerIndex
    result[index] = values[lowerIndex]! * (1 - fraction) + values[upperIndex]! * fraction
  }
  return result
}
