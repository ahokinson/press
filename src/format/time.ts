/**
 * Compact relative age (e.g. "12m", "3h", "5d") from an ISO timestamp.
 * Returns `fallback` (default "-") if the input is unparseable.
 */
export function relativeAge(iso: string, now: number = Date.now(), fallback: string = "-"): string {
  const deltaMs = now - Date.parse(iso)
  return relativeAgeMs(deltaMs, fallback)
}

/**
 * Compact age from a millisecond delta. Includes seconds below the minute
 * mark.
 *
 *   relativeAgeMs(0)          → "0s"
 *   relativeAgeMs(45_000)     → "45s"
 *   relativeAgeMs(180_000)    → "3m"
 *
 * Negative deltas clamp to 0. `NaN`/`Infinity` returns `fallback`.
 */
export function relativeAgeMs(deltaMs: number, fallback: string = "-"): string {
  if (!Number.isFinite(deltaMs)) return fallback
  const clampedMs = Math.max(0, deltaMs)
  if (clampedMs < 60_000) return `${Math.floor(clampedMs / 1000)}s`
  const minutes = Math.floor(clampedMs / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/** Local-time clock string, zero-padded `HH:MM:SS`. */
export function formatClock(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number) => value.toString().padStart(2, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
