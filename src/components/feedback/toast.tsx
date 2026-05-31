import { Strip } from "@components/atom/strip.tsx"
import { Severity, severityColor, severityGlyph } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type Accessor, type JSX, Show } from "solid-js"

export interface ToastProps {
  /** Message accessor. When it returns null, nothing renders. */
  message: () => string | null
  /** Trailing decoration (e.g. shrinking trail from `createStatusState`). */
  trail?: () => string
  /** Semantic colour bucket. Defaults to `Severity.Neutral`. */
  severity?: Severity
  /** Leading glyph character override. When omitted, the canonical severity glyph is used (none for Neutral). */
  glyph?: string
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

  const color = (): string => severityColor(theme, props.severity ?? Severity.Neutral)
  const glyph = (): string | null => props.glyph !== undefined ? props.glyph : severityGlyph(props.severity ?? Severity.Neutral)

  return (
    <Show when={props.message()}>
      {(msg: Accessor<string>) => (
        <Strip paddingX={1}>
          <text fg={color()}>
            <Show when={glyph()}>
              <span>{`${glyph()} `}</span>
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
