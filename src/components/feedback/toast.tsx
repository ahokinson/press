import { Strip } from "@components/atom/strip.tsx"
import { Severity, severityColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type Accessor, type JSX, Show } from "solid-js"

export interface ToastProps {
  /** Message accessor. When it returns null, nothing renders. */
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
 * Single-row floating notification driven by an accessor.
 *
 *   const status = createStatusState()
 *   <Toast message={status.message} trail={status.trail} />
 *
 * Owns no timers. `createStatusState` does the dismiss bookkeeping.
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
        <Strip paddingX={1}>
          <text fg={color()}>
            <Show when={props.icon}>
              <span>{`${props.icon} `}</span>
            </Show>
            <span>{msg()}</span>
            <Show when={props.trail?.()}>
              <span>{props.trail?.()}</span>
            </Show>
          </text>
        </Strip>
      )}
    </Show>
  )
}
