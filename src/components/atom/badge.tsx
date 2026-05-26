import type { JSX } from "solid-js"

export interface BadgeProps {
  /** Label text to render. */
  text: string
  /** Foreground color for the label. */
  color: string
  /** When true, wraps the label in brackets to mark a selected/current state. */
  active?: boolean
}

/** One-line label rendered in `color`, optionally bracketed when `active`. */
export function Badge(props: BadgeProps): JSX.Element {
  return <text fg={props.color}>{props.active ? `[${props.text}]` : ` ${props.text} `}</text>
}
