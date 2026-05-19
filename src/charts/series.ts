/**
 * Linear-interpolate `values` to exactly `count` samples.
 *
 * Edge cases:
 * - `count <= 0` or empty `values` → `[]`
 * - `values.length === 1` → array filled with that single value
 * - `count === 1` → the **last** value, by convention (most-recent-wins for sparklines).
 *   Callers wanting a summary stat (mean/median) should compute it before calling.
 */
export function resample(values: number[], count: number): number[] {
  if (count <= 0 || values.length === 0) return []
  if (values.length === 1) return Array(count).fill(values[0])
  if (count === 1) return [values[values.length - 1]!]

  const out: number[] = new Array(count)
  const last = values.length - 1
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * last
    const lo = Math.floor(t)
    const hi = Math.min(lo + 1, last)
    const frac = t - lo
    out[i] = values[lo]! * (1 - frac) + values[hi]! * frac
  }
  return out
}
