import type { Theme } from "@theme/palette.ts"

/**
 * An ordered, caller-named domain scale — vulnerability severities, task priorities, tiers — mapped
 * to theme colors. Distinct from `Intent` (an *unordered* feedback tone: neutral/info/success/…):
 * a `Scale` is a *ranked* ramp where the order carries meaning (sorting, "worse than"). press owns
 * the machinery; the caller owns the levels and their colors, so it stays flavor-consistent without
 * press dictating the palette.
 */
export interface Scale<L extends string> {
  /** Levels in rank order — index 0 is the top of the ramp (highest weight). */
  readonly levels: readonly L[]
  /** Rank of `level`: `levels.length` for the top level down to 1 for the last; 0 when unknown. Use for sorting (desc = worst-first). */
  weight(level: string | undefined): number
  /** Index in `levels` (0 = top), or -1 when unknown. */
  indexOf(level: string | undefined): number
  /** Resolve a level's theme color; unknown levels use the configured fallback. */
  color(theme: Theme, level: string | undefined): string
}

export interface ScaleConfig<L extends string> {
  /** Levels in rank order, top (worst/highest) first. Matched case-insensitively by `weight`/`color`. */
  levels: readonly L[]
  /** A level's theme color. */
  color: (theme: Theme, level: L) => string
  /** Color for an unknown/absent level. Defaults to `theme.textMuted`. */
  fallback?: (theme: Theme) => string
}

/**
 * Build a `Scale` from an ordered level list and a per-level color resolver.
 *
 * ```ts
 * const severity = createScale({
 *   levels: ["critical", "high", "medium", "low", "info"] as const,
 *   color: (t, l) => ({ critical: t.err, high: t.syntaxNum, medium: t.warn, low: t.ok, info: t.textDim })[l],
 * })
 * severity.weight("high")            // 4  (for desc sort)
 * severity.color(theme, "critical")  // theme.err
 * ```
 */
export function createScale<L extends string>(config: ScaleConfig<L>): Scale<L> {
  const index = new Map<string, number>()
  config.levels.forEach((level, i) => {
    index.set(level.toLowerCase(), i)
  })

  const indexOf = (level: string | undefined): number =>
    level === undefined ? -1 : (index.get(level.toLowerCase()) ?? -1)

  return {
    levels: config.levels,
    indexOf,
    weight: (level) => {
      const i = indexOf(level)
      return i < 0 ? 0 : config.levels.length - i
    },
    color: (theme, level) => {
      const i = indexOf(level)
      return i < 0 ? (config.fallback?.(theme) ?? theme.textMuted) : config.color(theme, config.levels[i]!)
    },
  }
}
