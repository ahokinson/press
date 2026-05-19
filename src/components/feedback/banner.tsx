import { useTheme } from "@theme/provider.tsx"
import type { JSX, ParentProps } from "solid-js"

export interface BannerProps extends ParentProps {
  /** Defaults to `theme.accent`. */
  backgroundColor?: string
  padding?: number
  paddingX?: number
}

/**
 * One-row colored strip. Pure frame — caller provides the inner `<text>`.
 * Useful for error/status/progress bars at the top or bottom of a screen.
 */
export function Banner(props: BannerProps): JSX.Element {
  const theme = useTheme()
  const padX = () => props.paddingX ?? props.padding ?? 1
  return (
    <box
      flexDirection="row"
      height={1}
      paddingLeft={padX()}
      paddingRight={padX()}
      backgroundColor={props.backgroundColor ?? theme.accent}
    >
      {props.children}
    </box>
  )
}
