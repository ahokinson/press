import { Strip } from "@components/atom/strip.tsx"
import { useTheme } from "@theme/provider.tsx"
import type { JSX, ParentProps } from "solid-js"

export interface BannerProps extends ParentProps {
  /** Defaults to `theme.accent`. */
  backgroundColor?: string
  padding?: number
  paddingX?: number
}

/**
 * One-row colored strip. The caller supplies the inner `<text>`. For
 * error/status/progress bars at the top or bottom of a screen.
 */
export function Banner(props: BannerProps): JSX.Element {
  const theme = useTheme()
  const padX = () => props.paddingX ?? props.padding ?? 1
  return (
    <Strip paddingX={padX()} backgroundColor={props.backgroundColor ?? theme.accent}>
      {props.children}
    </Strip>
  )
}
