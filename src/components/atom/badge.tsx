import type { JSX } from "solid-js"

export interface BadgeProps {
  /** Label text to render. */
  text: string
  /** Foreground color for the label. Caller picks the palette. */
  color: string
  /** When true, wraps the label in brackets to mark a selected/current state. */
  active?: boolean
}

/**
 * One-line label rendered in `color`, optionally bracketed when `active`.
 * No domain logic — the parent decides text and color (env name, status tag,
 * tab marker, etc).
 */
export function Badge(props: BadgeProps): JSX.Element {
  return <text fg={props.color}>{props.active ? `[${props.text}]` : ` ${props.text} `}</text>
}
