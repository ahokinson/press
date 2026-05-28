import { Strip } from "@components/atom/strip.tsx"
import { BOLD, Severity, severityColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type JSX, type ParentProps, Show } from "solid-js"

export interface CalloutProps extends ParentProps {
  severity?: Severity
  /** Raw color override. Takes precedence over severity. Expects a theme token (e.g. `theme.warn`). */
  color?: string
  icon?: string
  bold?: boolean
}

/**
 * One-row coloured strip with optional leading icon. For inline alerts,
 * notices, or status callouts inside a pane. Use `severity` for semantic
 * colour; pass `color` to override with a specific theme token.
 */
export function Callout(props: CalloutProps): JSX.Element {
  const theme = useTheme()

  const resolvedColor = (): string => {
    if (props.color !== undefined) return props.color
    return severityColor(theme, props.severity ?? Severity.Neutral)
  }

  return (
    <Strip>
      <Show when={props.icon}>
        <text fg={resolvedColor()} attributes={BOLD}>{`${props.icon}  `}</text>
      </Show>
      {typeof props.children === "string" ? (
        <text fg={resolvedColor()} attributes={props.bold ? BOLD : 0}>
          {props.children}
        </text>
      ) : (
        props.children
      )}
    </Strip>
  )
}
