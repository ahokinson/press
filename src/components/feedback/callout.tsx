import { BOLD } from "@theme"
import { type JSX, type ParentProps, Show } from "solid-js"

export interface CalloutProps extends ParentProps {
  color: string
  icon?: string
  bold?: boolean
}

/**
 * One-row coloured strip with optional leading icon. Used for inline alerts,
 * notices, or status callouts inside a pane. Foreground colour is supplied —
 * caller picks from the theme palette (e.g. `theme.warn`, `theme.err`).
 */
export function Callout(props: CalloutProps): JSX.Element {
  return (
    <box flexDirection="row" height={1}>
      <Show when={props.icon}>
        <text fg={props.color} attributes={BOLD}>{`${props.icon}  `}</text>
      </Show>
      {typeof props.children === "string" ? (
        <text fg={props.color} attributes={props.bold ? BOLD : 0}>
          {props.children}
        </text>
      ) : (
        props.children
      )}
    </box>
  )
}
