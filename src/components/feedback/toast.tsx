import { Strip } from "@components/atom/strip.tsx"
import { Intent, intentColor, intentGlyph } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type Accessor, type JSX, Show } from "solid-js"

export interface ToastProps {
  /** Message accessor. When it returns null, nothing renders. */
  message: () => string | null
  /** Trailing decoration (e.g. shrinking trail from `createStatusState`). */
  trail?: () => string
  /** Semantic colour bucket. Defaults to `Intent.Neutral`. */
  intent?: Intent
  /** Leading glyph character override. When omitted, the canonical intent glyph is used (none for Neutral). */
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

  const color = (): string => intentColor(theme, props.intent ?? Intent.Neutral)
  const glyph = (): string | null =>
    props.glyph !== undefined ? props.glyph : intentGlyph(props.intent ?? Intent.Neutral)

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
