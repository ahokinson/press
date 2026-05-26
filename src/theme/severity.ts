import type { Theme } from "@theme/palette.ts"

/**
 * Semantic colour bucket for feedback surfaces (Modal, Toast, Callout, etc).
 * Resolve a bucket to a theme colour with `severityColor`. `Neutral` paints
 * in muted text.
 */
export enum Severity {
  Neutral = "neutral",
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}

/**
 * Resolve a `Severity` to a theme colour. Defaults: Info=accent, Success=ok,
 * Warning=warn, Error=err, Neutral=muted. Override per-bucket via
 * `theme.severityColors`.
 */
export function severityColor(theme: Theme, severity: Severity): string {
  const override = theme.severityColors?.[severity]
  if (override !== undefined) return override
  switch (severity) {
    case Severity.Info:
      return theme.accent
    case Severity.Success:
      return theme.ok
    case Severity.Warning:
      return theme.warn
    case Severity.Error:
      return theme.err
    case Severity.Neutral:
      return theme.muted
  }
}

/**
 * Direction of a numeric delta for surfaces that show change over time (price
 * tickers, diff counters, perf trends). `changeOf` decides what counts as
 * `Flat` via an `epsilon` tolerance.
 */
export enum Change {
  Down = "down",
  Flat = "flat",
  Up = "up",
}

/**
 * Classify `delta` as `Up`/`Down`/`Flat`. `|delta| <= epsilon` collapses to
 * `Flat`. Default `epsilon` is `0` (strict sign). `NaN` returns `Flat`.
 * Infinities follow their sign.
 */
export function changeOf(delta: number, epsilon: number = 0): Change {
  if (Number.isNaN(delta)) return Change.Flat
  if (delta > epsilon) return Change.Up
  if (delta < -epsilon) return Change.Down
  return Change.Flat
}

export function changeColor(theme: Theme, change: Change): string {
  switch (change) {
    case Change.Up:
      return theme.ok
    case Change.Down:
      return theme.err
    case Change.Flat:
      return theme.muted
  }
}
