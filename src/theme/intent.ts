import { Icon } from "@icons"
import type { Theme } from "@theme/palette.ts"

/**
 * Semantic colour bucket for feedback surfaces (Modal, Toast, Callout, etc).
 * Resolve a bucket to a theme colour with `intentColor`. `Neutral` paints
 * in muted text.
 */
export enum Intent {
  Neutral = "neutral",
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}

/**
 * Resolve a `Intent` to a theme colour. Defaults: Info=accent, Success=ok,
 * Warning=warn, Error=err, Neutral=muted. Override per-bucket via
 * `theme.intentColors`.
 */
export function intentColor(theme: Theme, intent: Intent): string {
  const override = theme.intentColors?.[intent]
  if (override !== undefined) return override
  switch (intent) {
    case Intent.Info:
      return theme.accent
    case Intent.Success:
      return theme.ok
    case Intent.Warning:
      return theme.warn
    case Intent.Error:
      return theme.err
    case Intent.Neutral:
      return theme.textMuted
  }
}

/** Canonical Nerd Font glyph character for a intent level. Returns `null` for Neutral. */
export function intentGlyph(intent: Intent): string | null {
  switch (intent) {
    case Intent.Info:
      return Icon.circleInfo.char
    case Intent.Success:
      return Icon.circleSuccess.char
    case Intent.Warning:
      return Icon.triangleWarning.char
    case Intent.Error:
      return Icon.circleError.char
    case Intent.Neutral:
      return null
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
      return theme.textMuted
  }
}
