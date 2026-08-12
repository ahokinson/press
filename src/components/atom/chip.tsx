import type { KeyHint } from "@keyboard"
import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import type { JSX } from "solid-js"

export interface KeyChipProps {
  hint: KeyHint
}

/**
 * Inline `key + action` chip. Must be rendered inside a `<text>` element.
 * Returns two adjacent `<span>` elements: the key in bold on `backgroundSelection`,
 * the action in `dim`. Shared between `StatusBar` and `HelpOverlay`.
 */
export function KeyChip(props: KeyChipProps): JSX.Element {
  const theme = useTheme()
  return (
    <>
      <span style={{ fg: theme.text, bg: theme.backgroundSelection, attributes: BOLD }}>{` ${props.hint.key} `}</span>
      <span style={{ fg: theme.textDim }}>{` ${props.hint.action}`}</span>
    </>
  )
}

export interface ChipProps {
  /** Label text. */
  label: string
  /** The chip's color: foreground when plain, background fill when `filled`. */
  color: string
  /** Reverse-video: paint `color` as the background with `textColor` on top. */
  filled?: boolean
  /** Foreground when `filled`. Defaults to `theme.background` (dark text on the fill). */
  textColor?: string
  /** Render the label bold. Default true. */
  bold?: boolean
}

/**
 * A one-line colored chip with a caller-chosen `color` — no coupling to `Intent`, so it fits domain
 * colorings (source tags, env names, an ordered severity scale, etc). `filled` inverts it to a
 * reverse-video pill; otherwise `color` is the foreground. Renders a single `<text>` (usable inline).
 */
export function Chip(props: ChipProps): JSX.Element {
  const theme = useTheme()
  const attributes = () => ((props.bold ?? true) ? BOLD : 0)
  return props.filled ? (
    <text fg={props.textColor ?? theme.background} bg={props.color} attributes={attributes()}>
      {` ${props.label} `}
    </text>
  ) : (
    <text fg={props.color} attributes={attributes()}>
      {props.label}
    </text>
  )
}
