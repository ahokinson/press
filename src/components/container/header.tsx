import { useTheme } from "@theme/provider.tsx"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

export interface HeaderProps {
  /** Left-aligned content (typically a summary text/spans). */
  left?: () => JSX.Element
  /** Right-aligned content (typically a position/filter/sort badge). */
  right?: () => JSX.Element
  /** Background color override. Defaults to `theme.headerBg`. */
  background?: string
}

/**
 * One-row top bar with left/right JSX slots and a theme-aware background.
 * Both slots are optional; if neither is provided the bar is a blank strip.
 */
export function Header(props: HeaderProps): JSX.Element {
  const theme = useTheme()
  return (
    <box
      height={1}
      flexDirection="row"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
      backgroundColor={props.background ?? theme.headerBg}
    >
      <Show when={props.left} fallback={<text>{""}</text>}>
        {props.left?.()}
      </Show>
      <Show when={props.right} fallback={<text>{""}</text>}>
        {props.right?.()}
      </Show>
    </box>
  )
}
