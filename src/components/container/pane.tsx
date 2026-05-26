import type { Dimension, DimensionFixed } from "@terminal/dimension.ts"
import { useTheme } from "@theme/provider.tsx"
import type { JSX, ParentProps } from "solid-js"

export interface PaneProps extends ParentProps {
  title?: string
  focused?: () => boolean
  /** Override the border colour. Bypasses focus derivation. */
  borderColor?: string
  flexGrow?: number
  flexBasis?: DimensionFixed
  width?: Dimension
  height?: Dimension
  padding?: number
  paddingX?: number
  paddingY?: number
  gap?: number
}

/**
 * Bordered container with a focus-aware border colour and optional title.
 * Pass `borderColor` to bypass focus derivation. Padding accepts a uniform
 * `padding` or per-axis `paddingX`/`paddingY`.
 */
export function Pane(props: PaneProps): JSX.Element {
  const theme = useTheme()
  const padX = () => props.paddingX ?? props.padding ?? 0
  const padY = () => props.paddingY ?? props.padding ?? 0
  const border = () => props.borderColor ?? (props.focused?.() ? theme.accent : theme.faint)
  return (
    <box
      flexDirection="column"
      flexGrow={props.flexGrow ?? 1}
      flexBasis={props.flexBasis}
      width={props.width}
      height={props.height}
      paddingLeft={padX()}
      paddingRight={padX()}
      paddingTop={padY()}
      paddingBottom={padY()}
      gap={props.gap}
      border
      borderStyle="rounded"
      borderColor={border()}
      title={props.title ? ` ${props.title} ` : undefined}
      titleAlignment="left"
    >
      {props.children}
    </box>
  )
}
