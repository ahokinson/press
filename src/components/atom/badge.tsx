import { Intent, intentColor } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import type { JSX } from "solid-js"

export interface BadgeProps {
  /** Label text to render. */
  text: string
  intent?: Intent
  /** When true, renders as an inverted filled chip to signal the selected/current state. */
  active?: boolean
}

/** One-line label in a semantic colour. Active state inverts to a filled chip. */
export function Badge(props: BadgeProps): JSX.Element {
  const theme = useTheme()
  const color = (): string => intentColor(theme, props.intent ?? Intent.Neutral)

  return (
    <text>
      {props.active ? (
        <span style={{ fg: theme.background, bg: color() }}>{` ${props.text} `}</span>
      ) : (
        <span style={{ fg: color() }}>{` ${props.text} `}</span>
      )}
    </text>
  )
}
