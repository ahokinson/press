import { progressParts } from "@format"
import { Icon } from "@icons"
import { useTheme } from "@theme/provider.tsx"
import type { JSX } from "solid-js"

export interface ProgressProps {
  value: () => number
  max: () => number
  width?: number
  filledChar?: string
  unfilledChar?: string
  filledColor?: string
  unfilledColor?: string
}

/**
 * Single-row text-mode progress bar. Two coloured spans: filled and unfilled.
 * `max <= 0` paints fully filled.
 */
export function Progress(props: ProgressProps): JSX.Element {
  const theme = useTheme()
  const width = () => Math.max(1, props.width ?? 16)
  const filledChar = () => props.filledChar ?? Icon.blockFilled.char
  const unfilledChar = () => props.unfilledChar ?? Icon.blockShaded.char
  const parts = () => progressParts(props.value(), props.max(), width(), filledChar(), unfilledChar())
  return (
    <text>
      <span style={{ fg: props.filledColor ?? theme.ok }}>{parts().filled}</span>
      <span style={{ fg: props.unfilledColor ?? theme.faint }}>{parts().unfilled}</span>
    </text>
  )
}
