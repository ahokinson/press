import type { Theme } from "@theme/palette.ts"

/**
 * Semantic colour bucket used across feedback surfaces (Modal, Toast,
 * Callout, …). Components map `Severity` → a concrete theme token via
 * `severityColor`; callers pick a bucket without learning the colour name.
 *
 * Use `Severity.Neutral` for "no opinion" — paints in muted text colour.
 */
export enum Severity {
  Neutral = "neutral",
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}

/** Map a `Severity` onto the active theme's canonical colour for that bucket. */
export function severityColor(theme: Theme, severity: Severity): string {
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
