import { Severity, severityColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import type { JSX } from "solid-js"

export interface BadgeProps {
  /** Label text to render. */
  text: string
  severity?: Severity
  /** Raw color override. Takes precedence over severity. Expects a theme token (e.g. `theme.accent`). */
  color?: string
  /** When true, wraps the label in brackets to mark a selected/current state. */
  active?: boolean
}

/** One-line label rendered in a semantic colour, optionally bracketed when `active`. */
export function Badge(props: BadgeProps): JSX.Element {
  const theme = useTheme()

  const resolvedColor = (): string => {
    if (props.color !== undefined) return props.color
    return severityColor(theme, props.severity ?? Severity.Neutral)
  }

  return <text fg={resolvedColor()}>{props.active ? `[${props.text}]` : ` ${props.text} `}</text>
}
