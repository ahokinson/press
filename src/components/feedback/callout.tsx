import { Strip } from "@components/atom/strip.tsx"
import { Icon } from "@icons"
import { Severity, severityColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import { type JSX, type ParentProps, Show } from "solid-js"

export type CalloutVariant = "rail" | "banner"

export interface CalloutProps extends ParentProps {
  severity?: Severity
  /** Leading glyph character. Must be passed explicitly — no glyph is shown by default. */
  glyph?: string
  /**
   * Visual presentation variant.
   * - `"rail"`: text in severity color with a `▌` gutter glyph — use for inline annotations.
   * - `"banner"`: colored background strip — use for ambient inline status.
   */
  variant: CalloutVariant
}

/** One-row inline feedback strip. `variant="rail"` renders a `▌` gutter glyph; `variant="banner"` fills the background. */
export function Callout(props: CalloutProps): JSX.Element {
  const theme = useTheme()
  const color = (): string => severityColor(theme, props.severity ?? Severity.Neutral)
  const glyph = (): string | null => props.glyph ?? null

  if (props.variant === "banner") {
    return (
      <Strip paddingX={1} backgroundColor={color()}>
        {props.children}
      </Strip>
    )
  }

  return (
    <Strip>
      <text fg={color()}>{`${Icon.blockLeft.char} `}</text>
      <Show when={glyph()}>
        <text fg={color()}>{`${glyph()}  `}</text>
      </Show>
      {typeof props.children === "string"
        ? <text fg={color()}>{props.children}</text>
        : props.children}
    </Strip>
  )
}
