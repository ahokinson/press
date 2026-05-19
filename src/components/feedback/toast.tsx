import { Severity, severityColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type Accessor, type JSX, Show } from "solid-js"

export interface ToastProps {
  /** Reactive accessor — when it returns null, nothing renders. */
  message: () => string | null
  /** Trailing decoration (e.g. shrinking trail from `createStatusState`). */
  trail?: () => string
  /** Semantic colour bucket. Defaults to `Severity.Info`. Ignored when `color` is set. */
  severity?: Severity
  /** Raw colour override for the message text. Wins over `severity`. */
  color?: string
  /** Leading glyph (typically a Nerd Font icon). Painted in the same colour. */
  icon?: string
}

/**
 * Single-row floating notification driven by an accessor. Pairs directly with
 * `createStatusState`:
 *
 *   const status = createStatusState()
 *   <Toast message={status.message} trail={status.trail} />
 *
 * Pure renderer — owns no timers; `createStatusState` does the dismiss bookkeeping.
 */
export function Toast(props: ToastProps): JSX.Element {
  const theme = useTheme()

  const color = (): string => {
    if (props.color !== undefined) return props.color
    return severityColor(theme, props.severity ?? Severity.Info)
  }

  return (
    <Show when={props.message()}>
      {(msg: Accessor<string>) => (
        <box flexDirection="row" height={1} paddingLeft={1} paddingRight={1}>
          <text fg={color()}>
            <Show when={props.icon}>
              <span>{`${props.icon} `}</span>
            </Show>
            <span>{msg()}</span>
            <Show when={props.trail?.()}>
              <span>{props.trail?.()}</span>
            </Show>
          </text>
        </box>
      )}
    </Show>
  )
}
