import { BOLD } from "@theme"
import { useTheme } from "@theme/provider.tsx"
import type { Scale } from "@theme/scale.ts"
import type { JSX } from "solid-js"

export interface MeterProps<L extends string> {
  /** The ordered scale the level belongs to. */
  scale: Scale<L>
  /** The current level; drives how many cells fill and the color. */
  level: string | undefined
  /** Glyph for a filled cell. Default "●". */
  on?: string
  /** Glyph for an empty cell. Default "○". */
  off?: string
  /** Render bold. Default true. */
  bold?: boolean
}

/**
 * A ranked dots meter for a `Scale` level: one cell per scale level, filled up to the level's rank
 * (top level fills all, last fills one), painted in the level's color. A compact "how bad" glyph
 * that stays consistent with the scale's ordering and theme colors.
 */
export function Meter<L extends string>(props: MeterProps<L>): JSX.Element {
  const theme = useTheme()
  const on = () => props.on ?? "●"
  const off = () => props.off ?? "○"
  const filled = () => props.scale.weight(props.level)
  const total = () => props.scale.levels.length
  return (
    <text fg={props.scale.color(theme, props.level)} attributes={(props.bold ?? true) ? BOLD : 0}>
      {on().repeat(filled()) + off().repeat(Math.max(0, total() - filled()))}
    </text>
  )
}
